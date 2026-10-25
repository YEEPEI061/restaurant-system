const bcrypt = require('bcryptjs');

const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const Reservation = require('../models/Reservation');

const menuData = require('../data/menu');
const userData = require('../data/users');
const reservationData = require('../data/reservations');

async function initialiseSampleData() {

  console.log('Checking sample data...');

  /*
   * --------------------------------------------------
   * SAMPLE MENU
   * --------------------------------------------------
   */

  for (const item of menuData) {

    const existingItem = await MenuItem.findOne({
      dishId: item.dishId
    });

    if (!existingItem) {

      await MenuItem.create(item);

      console.log(
        `Sample menu item added: ${item.dishId} - ${item.name}`
      );
    }
  }


  /*
   * --------------------------------------------------
   * SAMPLE USERS
   * --------------------------------------------------
   */

  for (const user of userData) {

    const existingUser = await User.findOne({
      email: user.email
    });

    if (!existingUser) {

      const hashedPassword =
        await bcrypt.hash(user.password, 12);

      await User.create({
        ...user,
        password: hashedPassword
      });

      console.log(
        `Sample user added: ${user.email}`
      );
    }
  }


  /*
   * --------------------------------------------------
   * SAMPLE RESERVATIONS
   * --------------------------------------------------
   */

  for (const reservation of reservationData) {

    const existingReservation =
      await Reservation.findOne({
        reservationId: reservation.reservationId
      });

    if (!existingReservation) {

      const guest = await User.findOne({
        email: reservation.guestEmail
      });

      if (!guest) {

        console.log(
          `Sample reservation skipped: guest not found - ${reservation.guestEmail}`
        );

        continue;
      }

      await Reservation.create({
        reservationId: reservation.reservationId,

        guest: guest._id,

        guestName: reservation.guestName,
        email: reservation.email,
        phone: reservation.phone,

        date: reservation.date,
        time: reservation.time,

        partySize: reservation.partySize,

        servicePeriod: reservation.servicePeriod,

        seating: reservation.seating,

        diningOption: reservation.diningOption,

        selectedDishes: reservation.selectedDishes,

        tastingMenu: reservation.tastingMenu,
        beveragePairing: reservation.beveragePairing,
        packageName: reservation.packageName,

        table: reservation.table,

        specialRequests: reservation.specialRequests,

        status: reservation.status
      });

      console.log(
        `Sample reservation added: ${reservation.reservationId}`
      );
    }
  }


  console.log('Sample data check completed.');
}

module.exports = {
  initialiseSampleData
};