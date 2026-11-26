const reservationData = [
  {
    reservationId: "R-001",

    guestEmail: "sofiachen@gmail.com",

    guestName: "Sofia Chen",
    email: "sofiachen@gmail.com",
    phone: "0125678901",

    date: "2026-11-12",
    time: "17:30",

    partySize: 3,

    servicePeriod: "dinner",

    diningOption: "alacarte",

    selectedDishes: [
      {
        id: "M-013",
        name: "Hinoki Forest Cooler",
        price: 16,
        quantity: 1
      },
      {
        id: "M-014",
        name: "Smoked Birch Potato Mousseline",
        price: 20,
        quantity: 1
      }
    ],

    table: "T04",
    specialRequests: "",

    status: "Completed"
  },

  {
    reservationId: "R-002",

    guestEmail: "sofiachen@gmail.com",

    guestName: "Sofia Chen",
    email: "sofiachen@gmail.com",
    phone: "0125678901",

    date: "2026-12-02",
    time: "17:30",

    partySize: 4,

    servicePeriod: "dinner",

    diningOption: "alacarte",

    selectedDishes: [
      {
        id: "M-010",
        name: "Hardanger Fjord Trout",
        price: 26,
        quantity: 1
      },
      {
        id: "M-009",
        name: "Koji Fermented Maitake",
        price: 24,
        quantity: 1
      }
    ],

    tastingMenus: [
      {
        name: "Five Course Prelude",
        quantity: 1,
        price: 125
      }
    ],

    table: "T06",
    specialRequests: "",

    status: "Confirmed"
  }
];

module.exports = reservationData;