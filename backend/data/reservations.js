const reservationData = [
  {
    reservationId: "R-001",

    guestEmail: "sofiachen@gmail.com",

    guestName: "Sofia Chen",
    email: "sofiachen@gmail.com",
    phone: "0125678901",

    date: "2026-10-25",
    time: "17:30",

    partySize: 3,

    servicePeriod: "dinner",

    diningOption: "alacarte",

    selectedDishes: [
      {
        id: "M-013",
        name: "Hinoki Forest Cooler",
        price: 16
      },
      {
        id: "M-014",
        name: "Smoked Birch Potato Mousseline",
        price: 20
      }
    ],

    tastingMenu: "",
    beveragePairing: false,
    packageName: "",
    table: "T04",
    specialRequests: "",

    status: "Pending"
  },

  {
    reservationId: "R-002",

    guestEmail: "sofiachen@gmail.com",

    guestName: "Sofia Chen",
    email: "sofiachen@gmail.com",
    phone: "0125678901",

    date: "2026-10-22",
    time: "17:30",

    partySize: 2,

    servicePeriod: "dinner",

    diningOption: "alacarte",

    selectedDishes: [
      {
        id: "tasting-5-course",
        name: "5-Course Prelude Tasting Menu",
        price: 125
      },
      {
        id: "M-010",
        name: "Hardanger Fjord Trout",
        price: 26
      },
      {
        id: "M-009",
        name: "Koji Fermented Maitake",
        price: 24
      }
    ],

    tastingMenu: "",
    beveragePairing: false,
    packageName: "",
    table: "T01",
    specialRequests: "",

    status: "Completed"
  }
];

module.exports = reservationData;