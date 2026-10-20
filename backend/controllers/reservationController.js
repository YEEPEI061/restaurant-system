const Reservation = require('../models/Reservation');

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


    // =========================
    // GENERATE RESERVATION ID
    // =========================

    const latestReservation =
      await Reservation.findOne()
        .sort({
          createdAt: -1
        });

    let nextNumber = 1;

    if (latestReservation) {

      const latestNumber =
        parseInt(
          latestReservation
            .reservationId
            .replace('R-', ''),
          10
        );

      if (
        !Number.isNaN(
          latestNumber
        )
      ) {
        nextNumber =
          latestNumber + 1;
      }
    }

    const reservationId =
      `R-${String(nextNumber).padStart(3, '0')}`;


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

      // Guest can only cancel
      if (status !== 'Cancelled') {

        return res.status(403).json({
          message:
            'Guests can only cancel their reservations'
        });

      }

      // Guest can only cancel Pending or Confirmed
      if (
        reservation.status !== 'Pending' &&
        reservation.status !== 'Confirmed'
      ) {

        return res.status(403).json({
          message:
            'Only pending or confirmed reservations can be cancelled'
        });

      }

    }

    // Update status
    reservation.status =
      status;

    await reservation.save();

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