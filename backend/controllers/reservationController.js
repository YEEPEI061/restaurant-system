const Reservation = require('../models/Reservation');

const {
  broadcast
} = require('../services/websocketService');

const {
  createNotification
} = require('../services/notificationService');

/*
 * --------------------------------------------------
 * RESTAURANT TABLE CONFIGURATION
 * --------------------------------------------------
 */

const RESTAURANT_TABLES = {
  T01: 2,
  T02: 2,
  T03: 2,
  T04: 4,
  T05: 4,
  T06: 4,
  T07: 4,
  T08: 6,
  T09: 6,
  T10: 8
};

const RESTAURANT_CAPACITY = Object.values(
  RESTAURANT_TABLES
).reduce((total, capacity) => total + capacity, 0);


/*
 * --------------------------------------------------
 * TIME HELPERS
 * --------------------------------------------------
 */

function timeToMinutes(time) {

  if (
    typeof time !== 'string' ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  ) {
    return null;
  }

  const [hours, minutes] = time
    .split(':')
    .map(Number);

  return hours * 60 + minutes;
}


/*
 * --------------------------------------------------
 * TABLE ASSIGNMENT VALIDATION
 * --------------------------------------------------
 */

async function validateTableAssignment({
  table,
  date,
  time,
  partySize,
  excludeReservationId
}) {

  // No assigned table means no table validation is needed.
  if (!table) {
    return null;
  }

  // Check whether the table exists.
  const capacity = RESTAURANT_TABLES[table];

  if (!capacity) {
    return {
      status: 400,
      message: 'Invalid table selection.'
    };
  }

  // Check party size.
  if (
    !Number.isInteger(Number(partySize)) ||
    Number(partySize) < 1 ||
    Number(partySize) > capacity
  ) {
    return {
      status: 400,
      message:
        `${table} can accommodate a maximum of ${capacity} guests.`
    };
  }

  // Validate booking time.
  const requestedStart = timeToMinutes(time);

  if (requestedStart === null) {
    return {
      status: 400,
      message: 'Invalid reservation time.'
    };
  }

  const requestedEnd = requestedStart + 60;

  // Find other active reservations for this table and date.
  const query = {
    table,
    date,
    status: {
      $nin: ['Cancelled', 'Completed']
    }
  };

  // Exclude the current reservation when editing.
  if (excludeReservationId) {
    query.reservationId = {
      $ne: excludeReservationId
    };
  }

  const existingReservations =
    await Reservation.find(query).select(
      'reservationId time'
    );

  // Check for overlapping one-hour bookings.
  for (const existing of existingReservations) {

    const existingStart =
      timeToMinutes(existing.time);

    // Ignore invalid legacy booking times.
    if (existingStart === null) {
      continue;
    }

    const existingEnd =
      existingStart + 60;

    const overlaps =
      requestedStart < existingEnd &&
      requestedEnd > existingStart;

    if (overlaps) {
      return {
        status: 409,
        message:
          `${table} is already reserved from ${existing.time} to ${formatEndTime(existing.time)}. Please choose another table or time.`
      };
    }
  }

  return null;
}

/*
 * --------------------------------------------------
 * RESTAURANT CAPACITY VALIDATION
 * --------------------------------------------------
 */

async function validateRestaurantCapacity({
  date,
  time,
  partySize,
  excludeReservationId
}) {

  const requestedStart = timeToMinutes(time);

  if (requestedStart === null) {
    return {
      status: 400,
      message: 'Invalid reservation time.'
    };
  }

  const guests = Number(partySize);

  if (
    !Number.isInteger(guests) ||
    guests < 1
  ) {
    return {
      status: 400,
      message: 'Invalid reservation party size.'
    };
  }

  const requestedEnd = requestedStart + 60;

  // Pending reservations also count towards capacity.
  const query = {
    date,
    status: {
      $nin: ['Cancelled', 'Completed']
    }
  };

  // Exclude the current reservation when editing or changing status.
  if (excludeReservationId) {
    query.reservationId = {
      $ne: excludeReservationId
    };
  }

  const existingReservations =
    await Reservation.find(query).select(
      'reservationId time partySize status'
    );

  /*
   * Calculate occupancy throughout the requested
   * one-hour period.
   *
   * Negative changes (departures) are processed
   * before positive changes (arrivals) at the
   * same time, allowing back-to-back reservations.
   */

  const events = [];

  for (const existing of existingReservations) {

    const existingStart =
      timeToMinutes(existing.time);

    const existingPartySize =
      Number(existing.partySize);

    if (
      existingStart === null ||
      !Number.isInteger(existingPartySize) ||
      existingPartySize < 1
    ) {
      continue;
    }

    const existingEnd =
      existingStart + 60;

    const overlaps =
      existingStart < requestedEnd &&
      existingEnd > requestedStart;

    if (!overlaps) {
      continue;
    }

    events.push({
      time: Math.max(
        existingStart,
        requestedStart
      ),
      change: existingPartySize
    });

    events.push({
      time: Math.min(
        existingEnd,
        requestedEnd
      ),
      change: -existingPartySize
    });
  }

  // Process departures before arrivals at equal times.
  events.sort((a, b) => {
    if (a.time !== b.time) {
      return a.time - b.time;
    }

    return a.change - b.change;
  });

  // The new reservation occupies seats throughout its hour.
  let currentOccupancy = guests;
  let maximumOccupancy = guests;

  for (const event of events) {

    currentOccupancy += event.change;

    maximumOccupancy = Math.max(
      maximumOccupancy,
      currentOccupancy
    );
  }

  if (maximumOccupancy > RESTAURANT_CAPACITY) {

    return {
      status: 409,
      message:
        'Sorry, this time slot has insufficient capacity for your party. Please select another time or date.'
    };
  }

  return null;
}

/*
 * --------------------------------------------------
 * FORMAT RESERVATION END TIME
 * --------------------------------------------------
 */

function formatEndTime(time) {

  const totalMinutes =
    timeToMinutes(time) + 60;

  const hours =
    Math.floor(totalMinutes / 60) % 24;

  const minutes =
    totalMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

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
      diningOption,
      tastingMenu,

      // =========================
      // SELECTED DISHES
      // =========================

      selectedDishes,

      beveragePairing,
      packageName,
      specialRequests
    } = req.body;


    // =========================
    // CHECK RESTAURANT CAPACITY
    // =========================

    const capacityValidation =
      await validateRestaurantCapacity({
        date,
        time,
        partySize
      });

    if (capacityValidation) {
      return res.status(
        capacityValidation.status
      ).json({
        message: capacityValidation.message
      });
    }

    const reservationId =
      await generateNextReservationId();

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

        table: '',

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
      'diningOption',
      'tastingMenu',
      'selectedDishes',
      'beveragePairing',
      'packageName',
      'specialRequests'

    ];

    // Only admins can assign or change tables.
    if (req.user.role === 'admin') {
      allowedFields.push('table');
    }

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
    // VALIDATE TABLE ASSIGNMENT
    // =========================

    const tableValidation =
      await validateTableAssignment({

        table: reservation.table,

        date: reservation.date,

        time: reservation.time,

        partySize: reservation.partySize,

        excludeReservationId:
          reservation.reservationId

      });

    if (tableValidation) {

      return res.status(
        tableValidation.status
      ).json({

        message: tableValidation.message

      });

    }

    // =========================
    // VALIDATE RESTAURANT CAPACITY
    // =========================

    if (
      !['Cancelled', 'Completed'].includes(
        reservation.status
      )
    ) {

      const capacityValidation =
        await validateRestaurantCapacity({

          date: reservation.date,

          time: reservation.time,

          partySize: reservation.partySize,

          excludeReservationId:
            reservation.reservationId

        });

      if (capacityValidation) {

        return res.status(
          capacityValidation.status
        ).json({

          message: capacityValidation.message

        });

      }

    }


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

      // Guests can only cancel reservations.
      if (status !== 'Cancelled') {
        return res.status(403).json({
          message:
            'Guests are only allowed to cancel reservations.'
        });
      }
    }

    // =========================
    // VALIDATE RESTAURANT CAPACITY
    // =========================

    if (
      req.user.role === 'admin' &&
      ['Pending', 'Confirmed', 'Seated'].includes(status)
    ) {

      const capacityValidation =
        await validateRestaurantCapacity({

          date: reservation.date,

          time: reservation.time,

          partySize: reservation.partySize,

          excludeReservationId:
            reservation.reservationId

        });

      if (capacityValidation) {

        return res.status(
          capacityValidation.status
        ).json({

          message: capacityValidation.message

        });

      }

    }

    // =========================
    // VALIDATE TABLE BEFORE CONFIRMATION
    // =========================

    if (
      req.user.role === 'admin' &&
      (status === 'Confirmed' || status === 'Seated')
    ) {

      if (!reservation.table) {
        return res.status(400).json({
          message:
            'Please assign a table before confirming or seating this reservation.'
        });
      }

      const tableValidation =
        await validateTableAssignment({

          table: reservation.table,

          date: reservation.date,

          time: reservation.time,

          partySize: reservation.partySize,

          excludeReservationId:
            reservation.reservationId

        });

      if (tableValidation) {

        return res.status(
          tableValidation.status
        ).json({

          message: tableValidation.message

        });

      }

    }


    // =========================
    // UPDATE STATUS
    // =========================

    reservation.status = status;

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