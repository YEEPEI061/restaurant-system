const Reservation = require('../models/Reservation');

async function getReservations(req, res) {
  try {
    const reservations = await Reservation.find()
      .populate('guest', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: reservations.length,
      reservations
    });
  } catch (error) {
    console.error('Get reservations error:', error);

    res.status(500).json({
      message: 'Failed to retrieve reservations'
    });
  }
}

async function getReservationById(req, res) {
  try {
    const reservation = await Reservation.findOne({
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

    res.status(200).json({
      reservation
    });
  } catch (error) {
    console.error('Get reservation error:', error);

    res.status(500).json({
      message: 'Failed to retrieve reservation'
    });
  }
}

async function getMyReservations(req, res) {
  try {
    const reservations = await Reservation.find({
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
    console.error('Get my reservations error:', error);

    res.status(500).json({
      message: 'Failed to retrieve your reservations'
    });
  }
}

async function createReservation(req, res) {
  try {
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
      beveragePairing,
      packageName,
      table,
      deposit,
      dietaryNotes,
      specialRequests
    } = req.body;

    const latestReservation = await Reservation.findOne()
      .sort({ createdAt: -1 });

    let nextNumber = 1;

    if (latestReservation) {
      const latestNumber = parseInt(
        latestReservation.reservationId.replace('R-', ''),
        10
      );

      if (!Number.isNaN(latestNumber)) {
        nextNumber = latestNumber + 1;
      }
    }

    const reservationId = `R-${String(nextNumber).padStart(3, '0')}`;

    const reservation = await Reservation.create({
      reservationId,
      guest: req.user.userId,
      guestName,
      email,
      phone,
      date,
      time,
      partySize,
      servicePeriod,
      diningOption,
      tastingMenu,
      beveragePairing,
      packageName,
      table,
      deposit,
      dietaryNotes,
      specialRequests,
      status: 'Pending'
    });

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation
    });
  } catch (error) {
    console.error('Create reservation error:', error);

    res.status(500).json({
      message: 'Failed to create reservation'
    });
  }
}

async function updateReservation(req, res) {
  try {
    const reservation = await Reservation.findOne({
      reservationId: req.params.id
    });

    if (!reservation) {
      return res.status(404).json({
        message: 'Reservation not found'
      });
    }

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
      'beveragePairing',
      'packageName',
      'table',
      'deposit',
      'dietaryNotes',
      'specialRequests',
      'status'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        reservation[field] = req.body[field];
      }
    });

    await reservation.save();

    res.status(200).json({
      message: 'Reservation updated successfully',
      reservation
    });
  } catch (error) {
    console.error('Update reservation error:', error);

    res.status(500).json({
      message: 'Failed to update reservation'
    });
  }
}

async function deleteReservation(req, res) {
  try {
    const reservation = await Reservation.findOne({
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
      message: 'Reservation deleted successfully'
    });
  } catch (error) {
    console.error('Delete reservation error:', error);

    res.status(500).json({
      message: 'Failed to delete reservation'
    });
  }
}

async function updateReservationStatus(req, res) {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      'Pending',
      'Confirmed',
      'Seated',
      'Completed',
      'Cancelled'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid reservation status'
      });
    }

    const reservation = await Reservation.findOneAndUpdate(
      {
        reservationId: req.params.id
      },
      {
        status
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!reservation) {
      return res.status(404).json({
        message: 'Reservation not found'
      });
    }

    res.status(200).json({
      message: 'Reservation status updated successfully',
      reservation
    });
  } catch (error) {
    console.error(
      'Update reservation status error:',
      error
    );

    res.status(500).json({
      message: 'Failed to update reservation status'
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