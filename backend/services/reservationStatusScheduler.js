const Reservation = require('../models/Reservation');

const {
    broadcast
} = require('./websocketService');

// =========================
// RESERVATION STATUS SCHEDULER
// =========================

const CHECK_INTERVAL = 10000;
const DINING_DURATION = 60 * 60 * 1000;

let schedulerInterval;
let isRunning = false;

function getReservationDateTime(reservation) {

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(reservation.date) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(reservation.time)
    ) {
        return null;
    }

    return new Date(
        `${reservation.date}T${reservation.time}:00+08:00`
    );
}

async function updateAutomaticStatus(
    reservation,
    newStatus
) {

    // Atomic update prevents duplicate transitions.
    const updatedReservation =
        await Reservation.findOneAndUpdate(
            {
                _id: reservation._id,
                status: reservation.status
            },
            {
                $set: {
                    status: newStatus
                }
            },
            {
                new: true
            }
        );

    // Another request may already have changed the status.
    if (!updatedReservation) {
        return;
    }

    broadcast({
        type: 'reservation.updated',
        message: 'A reservation status has been updated.',
        data: {
            reservationId: updatedReservation.reservationId
        }
    });

}

// =========================
// CHECK RESERVATIONS
// =========================

async function checkReservationStatuses() {

    if (isRunning) {
        return;
    }

    isRunning = true;

    try {

        const now = new Date();

        const reservations = await Reservation.find({
            status: {
                $in: ['Pending', 'Confirmed', 'Seated']
            }
        });

        for (const reservation of reservations) {

            const reservationDateTime =
                getReservationDateTime(reservation);

            if (!reservationDateTime) {
                continue;
            }

            // Pending → Expired
            // Expire unconfirmed reservations after their scheduled time.
            if (
                reservation.status === 'Pending' &&
                reservationDateTime <= now
            ) {
                await updateAutomaticStatus(
                    reservation,
                    'Expired'
                );

                continue;
            }

            // Confirmed → Seated
            // Only reservations with an assigned table
            // can automatically become Seated.
            if (
                reservation.status === 'Confirmed' &&
                reservation.table &&
                reservationDateTime <= now
            ) {

                await updateAutomaticStatus(
                    reservation,
                    'Seated'
                );

                continue;
            }

            // Seated → Completed
            // One hour after the scheduled reservation time.
            if (
                reservation.status === 'Seated' &&
                reservationDateTime.getTime() +
                DINING_DURATION <= now.getTime()
            ) {

                await updateAutomaticStatus(
                    reservation,
                    'Completed'
                );

            }

        }

    } catch (error) {

        console.error(
            'Reservation status scheduler error:',
            error
        );

    } finally {

        isRunning = false;

    }

}

// =========================
// START SCHEDULER
// =========================

function startReservationStatusScheduler() {

    if (schedulerInterval) {
        return;
    }

    console.log(
        'Reservation status scheduler started.'
    );

    // Check immediately when the server starts.
    checkReservationStatuses();

    // Continue checking every 10 seconds.
    schedulerInterval = setInterval(
        checkReservationStatuses,
        CHECK_INTERVAL
    );

}

module.exports = {
    startReservationStatusScheduler
};
