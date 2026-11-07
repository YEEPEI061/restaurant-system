const Reservation = require('../models/Reservation');

const {
  broadcast
} = require('../services/websocketService');

const {
  createNotification
} = require('../services/notificationService');

async function getReservations(req, res) {
  try {
    const reservations = await Reservation.find()
      .populate(
        'guest',
        'firstName lastName email phone'
      )
      .sort({
        createdAt: -1
      });

    res.status(200).json({
      count: reservations.length,
      reservations
    });
  } catch (error) {
    console.error(
      'Get reservations error:',
      error
    );

    res.status(500).json({
      message: 'Failed to retrieve reservations'
    });
  }
}

async function getReservationById(req, res) {
  try {
    const reservation =
      await Reservation.findOne({
        reservationId: req.params.id
      }).populate(
        'guest',
        'firstName lastName email phone'
      );

    if (!reservation) {
      return res.status(404).json({
        message: 'Reservation not found'
      });
    }

    /*
     * GUEST PERMISSION CHECK
     *
     * Admin can view any reservation.
     * Guest can only view their own reservation.
     */
    if (req.user.role === 'guest') {

      const guestId =
        reservation.guest?._id
          ? reservation.guest._id.toString()
          : reservation.guest.toString();

      if (
        guestId !== req.user.userId.toString()
      ) {
        return res.status(403).json({
          message:
            'You are not allowed to view this reservation'
        });
      }
    }

    res.status(200).json({
      reservation
    });

  } catch (error) {
    console.error(
      'Get reservation error:',
      error
    );

    res.status(500).json({
      message: 'Failed to retrieve reservation'
    });
  }
}

async function getMyReservations(req, res) {
  try {
    const reservations =
      await Reservation.find({
        guest: req.user.userId
      }).sort({
        date: 1,
        time: 1
      });

    res.status(200).json({
      count: reservations.length,
      reservations
    });
  } catch (error) {
    console.error(
      'Get my reservations error:',
      error
    );

    res.status(500).json({
      message: 'Failed to retrieve your reservations'
    });
  }
}

async function generateNextReservationId() {
  const reservations = await Reservation.find(
    {},
    {
      reservationId: 1
    }
  );

  let maxNumber = 0;

  reservations.forEach(reservation => {
    const match = /^R-(\d+)$/.exec(reservation.reservationId);

    if (match) {
      const number = Number.parseInt(match[1], 10);

      if (number > maxNumber) {
        maxNumber = number;
      }
    }
  });

  return `R-${String(maxNumber + 1).padStart(3, '0')}`;
}

async function createReservation(req, res) {
  try {

    // =========================
    // GET REQUEST DATA
    // =========================

    const {
      guestName,
      email,
      phone,
      date,
      time,
      partySize,
      servicePeriod,
      seating,
      diningOption,
      tastingMenu,

      // =========================
      // SELECTED DISHES
      // =========================

      selectedDishes,

      beveragePairing,
      packageName,
      table,
      specialRequests
    } = req.body;


    const reservationId = await generateNextReservationId();


    // =========================
    // CREATE RESERVATION
    // =========================

    const reservation =
      await Reservation.create({

        reservationId,

        guest:
          req.user.userId,

        guestName,

        email,

        phone,

        date,

        time,

        partySize,

        servicePeriod,

        seating,

        diningOption,

        tastingMenu,

        // =========================
        // SAVE SELECTED DISHES
        // =========================

        selectedDishes:
          Array.isArray(selectedDishes)
            ? selectedDishes
            : [],

        beveragePairing,

        packageName,

        table,

        specialRequests,

        status: 'Pending'
      });

    // =========================
    // WEBSOCKET NOTIFICATION
    // =========================

    broadcast({
      type: 'reservation.created',
      message:
        'A new reservation has been created.',
      data: {
        reservationId:
          reservation.reservationId
      }
    });

    await createNotification({
      recipientRole: 'admin',
      type: 'reservation_created',
      title: 'New reservation',
      message:
        `${reservation.guestName} created reservation ${reservation.reservationId}.`,
      reservationId:
        reservation.reservationId
    });


    // =========================
    // SUCCESS RESPONSE
    // =========================

    res.status(201).json({

      message:
        'Reservation created successfully',

      reservation

    });

  } catch (error) {

    console.error(
      'Create reservation error:',
      error
    );

    res.status(500).json({

      message:
        'Failed to create reservation'

    });
  }
}

function getReservationChanges(previous, updated) {

  const fields = {
    guestName: 'Guest name',
    email: 'Email',
    phone: 'Phone',
    date: 'Reservation date',
    time: 'Reservation time',
    partySize: 'Party size',
    servicePeriod: 'Service period',
    seating: 'Seating',
    diningOption: 'Dining option',
    tastingMenu: 'Tasting menu',
    selectedDishes: 'Dining selections',
    beveragePairing: 'Beverage pairing',
    packageName: 'Package',
    table: 'Table',
    specialRequests: 'Special requests'
  };

  function formatValue(field, value) {

    if (value === undefined || value === null || value === '') {
      return 'Not specified';
    }

    if (field === 'partySize') {
      return `${value} ${Number(value) === 1 ? 'guest' : 'guests'}`;
    }

    if (field === 'table') {
      return `Table ${String(value).replace(/^T/, '')}`;
    }

    if (field === 'beveragePairing') {
      return value ? 'Included' : 'Not included';
    }

    if (field === 'selectedDishes' && Array.isArray(value)) {
      return value
        .map(dish => dish.name || dish)
        .join(', ');
    }

    if (field === 'date') {
      return new Date(value).toLocaleDateString('en-MY');
    }

    return String(value);
  }

  const changes = [];

  for (const field of Object.keys(fields)) {

    // Ignore tasting menu and package changes
    // when the dining option is Table
    if (
      updated.diningOption === 'table' &&
      (field === 'tastingMenu' || field === 'packageName')
    ) {
      continue;
    }

    const oldValue = previous[field];
    const newValue = updated[field];

    if (
      JSON.stringify(oldValue ?? null) !==
      JSON.stringify(newValue ?? null)
    ) {

      const oldIsEmpty =
        oldValue === undefined ||
        oldValue === null ||
        oldValue === '';

      const newIsEmpty =
        newValue === undefined ||
        newValue === null ||
        newValue === '';

      if (oldIsEmpty && !newIsEmpty) {

        changes.push(
          `${fields[field]}: ${formatValue(field, newValue)}`
        );

      } else if (!oldIsEmpty && newIsEmpty) {

        changes.push(
          `${fields[field]}: Removed`
        );

      } else {

        // Handle cleared dining selections
        if (
          field === 'selectedDishes' &&
          Array.isArray(oldValue) &&
          oldValue.length > 0 &&
          Array.isArray(newValue) &&
          newValue.length === 0
        ) {

          changes.push(
            `${fields[field]}: Removed`
          );

        } else {

          changes.push(
            `${fields[field]}: ${formatValue(field, oldValue)} → ${formatValue(field, newValue)}`
          );

        }

      }

    }
  }

  return changes;
}

async function updateReservation(req, res) {
  try {

    const reservation =
      await Reservation.findOne({
        reservationId: req.params.id
      });

    if (!reservation) {
      return res.status(404).json({
        message: 'Reservation not found'
      });
    }

    // =========================
    // GUEST PERMISSION CHECK
    // =========================

    if (req.user.role === 'guest') {

      // Guest can only modify their own reservation
      if (
        reservation.guest.toString() !==
        req.user.userId.toString()
      ) {
        return res.status(403).json({
          message:
            'You are not allowed to modify this reservation'
        });
      }


      // Guest can only modify Pending or Confirmed reservations
      if (
        reservation.status !== 'Pending' &&
        reservation.status !== 'Confirmed'
      ) {
        return res.status(403).json({
          message:
            'Only pending or confirmed reservations can be modified'
        });
      }

    }

    const previousReservation = reservation.toObject();


    // =========================
    // ALLOWED UPDATE FIELDS
    // =========================

    const allowedFields = [

      'guestName',

      'email',

      'phone',

      'date',

      'time',

      'partySize',

      'servicePeriod',

      'seating',

      'diningOption',

      'tastingMenu',

      'selectedDishes',

      'beveragePairing',

      'packageName',

      'table',

      'specialRequests'

    ];

    // =========================
    // CHECK TABLE ASSIGNMENT
    // =========================

    const previousTable =
      reservation.table;

    const tableChanged =
      req.user.role === 'admin' &&
      req.body.table !== undefined &&
      req.body.table !== previousTable;

    // =========================
    // UPDATE FIELDS
    // =========================

    allowedFields.forEach(
      field => {

        if (
          req.body[field] !==
          undefined
        ) {

          reservation[field] =
            req.body[field];

        }

      }
    );


    // =========================
    // SAVE CHANGES
    // =========================

    await reservation.save();

    const changes = getReservationChanges(
      previousReservation,
      reservation.toObject()
    );

    // =========================
    // WEBSOCKET NOTIFICATION
    // =========================

    broadcast({
      type: 'reservation.updated',
      message:
        'A reservation has been updated.',
      data: {
        reservationId:
          reservation.reservationId
      }
    });


    if (changes.length > 0) {

      const changeDetails = changes
        .map(change => `• ${change}`)
        .join('\n');

      if (req.user.role === 'guest') {

        await createNotification({
          recipientRole: 'admin',
          type: 'reservation_updated',
          title: 'Reservation updated',
          message:
            `${reservation.guestName} updated reservation ${reservation.reservationId}:\n${changeDetails}`,
          reservationId: reservation.reservationId
        });


      } else if (req.user.role === 'admin') {

        await createNotification({
          recipient: reservation.guest,
          recipientRole: 'guest',
          type: tableChanged
            ? 'table_assigned'
            : 'reservation_updated',
          title: tableChanged
            ? 'Table assignment updated'
            : 'Reservation updated',
          message:
            `Your reservation ${reservation.reservationId} has been updated:\n${changeDetails}`,
          reservationId: reservation.reservationId
        });

      }

    }

    // =========================
    // SUCCESS RESPONSE
    // =========================

    res.status(200).json({

      message:
        'Reservation updated successfully',

      reservation

    });

  } catch (error) {

    console.error(
      'Update reservation error:',
      error
    );

    res.status(500).json({

      message:
        'Failed to update reservation'

    });
  }
}

async function deleteReservation(req, res) {
  try {

    const reservation =
      await Reservation.findOne({
        reservationId: req.params.id
      });

    if (!reservation) {
      return res.status(404).json({
        message: 'Reservation not found'
      });
    }

    await Reservation.deleteOne({
      _id: reservation._id
    });

    res.status(200).json({
      message:
        'Reservation deleted successfully'
    });

  } catch (error) {

    console.error(
      'Delete reservation error:',
      error
    );

    res.status(500).json({
      message:
        'Failed to delete reservation'
    });
  }
}

async function updateReservationStatus(
  req,
  res
) {
  try {

    const { status } =
      req.body;

    const allowedStatuses = [
      'Pending',
      'Confirmed',
      'Seated',
      'Completed',
      'Cancelled'
    ];

    // Check if status is valid
    if (
      !allowedStatuses.includes(
        status
      )
    ) {

      return res.status(400).json({
        message:
          'Invalid reservation status'
      });

    }

    // Find reservation first
    const reservation =
      await Reservation.findOne({
        reservationId:
          req.params.id
      });

    if (!reservation) {

      return res.status(404).json({
        message:
          'Reservation not found'
      });

    }

    /*
     * GUEST PERMISSION CHECK
     */
    if (req.user.role === 'guest') {

      // Guest can only modify their own reservation
      if (
        reservation.guest.toString() !==
        req.user.userId.toString()
      ) {
        return res.status(403).json({
          message:
            'You are not allowed to modify this reservation'
        });
      }

      // Guest can only modify Pending or Confirmed reservations
      if (
        reservation.status !== 'Pending' &&
        reservation.status !== 'Confirmed'
      ) {
        return res.status(403).json({
          message:
            'Only pending or confirmed reservations can be modified'
        });
      }
    }

    // =========================
    // UPDATE STATUS
    // =========================

    reservation.status =
      status;

    await reservation.save();


    // =========================
    // WEBSOCKET NOTIFICATION
    // =========================

    if (status === 'Cancelled') {

      broadcast({
        type: 'reservation.cancelled',
        message:
          'A reservation has been cancelled.',
        data: {
          reservationId:
            reservation.reservationId
        }
      });

    } else {

      broadcast({
        type: 'reservation.updated',
        message:
          'A reservation status has been updated.',
        data: {
          reservationId:
            reservation.reservationId
        }
      });

    }


    // =========================
    // DATABASE NOTIFICATION
    // =========================

    if (req.user.role === 'guest') {

      await createNotification({
        recipientRole: 'admin',
        type: 'reservation_cancelled',
        title: 'Reservation cancelled',
        message:
          `${reservation.guestName} cancelled reservation ${reservation.reservationId}.`,
        reservationId:
          reservation.reservationId
      });

    }


    if (req.user.role === 'admin') {

      if (status === 'Confirmed') {

        await createNotification({
          recipient:
            reservation.guest,
          recipientRole: 'guest',
          type: 'reservation_confirmed',
          title: 'Reservation confirmed',
          message:
            `Your reservation ${reservation.reservationId} has been confirmed.`,
          reservationId:
            reservation.reservationId
        });

      }


      if (status === 'Cancelled') {

        await createNotification({
          recipient:
            reservation.guest,
          recipientRole: 'guest',
          type: 'reservation_cancelled',
          title: 'Reservation cancelled',
          message:
            `Your reservation ${reservation.reservationId} has been cancelled.`,
          reservationId:
            reservation.reservationId
        });

      }

    }

    // =========================
    // SUCCESS RESPONSE
    // =========================

    res.status(200).json({

      message:
        'Reservation status updated successfully',

      reservation

    });

  } catch (error) {

    console.error(
      'Update reservation status error:',
      error
    );

    res.status(500).json({

      message:
        'Failed to update reservation status'

    });

  }
}

module.exports = {

  getReservations,

  getReservationById,

  getMyReservations,

  createReservation,

  updateReservation,

  deleteReservation,

  updateReservationStatus

};