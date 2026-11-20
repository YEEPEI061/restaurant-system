# Restaurant Management and Reservation System

A full-stack restaurant management and reservation system built using:

- **Frontend:** Angular
- **Backend:** Node.js / Express
- **Database:** MongoDB
- **Real-time Communication:** WebSockets
- **Containerisation:** Docker & Docker Compose

## Main Features

### Customer
- Register and log in
- Browse restaurant menu
- View table availability
- Make table reservations
- View reservation status

### Admin
- Admin login
- Manage menu items
- Manage tables
- Manage reservations
- Receive real-time reservation updates

## Project Structure

```text
restaurant-system/
├── frontend/          # Angular frontend
├── backend/           # Node.js / Express backend
├── docker-compose.yml # Docker configuration
└── README.md
```

## Getting Started

There are two ways to run this project:

1. Local Development
2. Docker Deployment

### Prerequisites

For local development:
- Node.js and npm
- MongoDB

For Docker deployment:
- Docker Desktop
- Docker Compose

---

## 1. Local Development

### Step 1: Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd restaurant-system
```

### Step 2: Install backend dependencies

```bash
cd backend
npm install
```

### Step 3: Configure backend environment variables

Create a `.env` file inside the `backend/` directory:

```env
PORT=3000

MONGO_URI=mongodb://127.0.0.1:27017/aurelia_restaurant
MONGO_TEST_URI=mongodb://localhost:27017/aurelia_test

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```

Make sure MongoDB is running before starting the backend.

### Step 4: Start the backend

```bash
npm start
```

The backend will run at:

```text
http://localhost:3000
```

### Step 5: Install frontend dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### Step 6: Start the frontend

```bash
npm start
```

Open the application at:

```text
http://localhost:4200
```

---

## 2. Docker Deployment

Docker Compose starts the frontend, backend and MongoDB containers together.

### Step 1: Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd restaurant-system
```

### Step 2: Configure environment variables

Use the provided `.env.example` file as a reference to create your own `.env` file in the project root directory (the same directory as `docker-compose.yml`).

Update the required MongoDB credentials, database configuration and other environment variables.

To generate a secure JWT secret, run the following command in PowerShell:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the generated value and replace `JWT_SECRET` in your `.env` file.


### Step 3: Build and start the containers

```bash
docker compose up -d --build
```

### Step 4: Check container status

```bash
docker compose ps
```

### Step 5: View application logs

```bash
docker compose logs -f
```

### Step 6: Stop the containers

```bash
docker compose down
```

To stop the containers and remove the MongoDB data volume as well:

```bash
docker compose down -v
```

**Note:** The `-v` option deletes the associated persistent database volume and its stored data. Use it with caution.

---

## Application URLs

| Service | URL |
|---|---|
| Angular Frontend | http://localhost:4200 |
| Express Backend | http://localhost:3000 |
| MongoDB | localhost:27017 |

---

## Demo Login Credentials

The following sample accounts are provided for testing the Customer and Admin functionalities.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@aurelia.com` | `Admin123!` |
| Customer | `sofiachen@gmail.com` | `Password123!` |

**Note:**
- Both accounts are preconfigured with active status.
- Use the Admin account to access administrative features.
- Use the Customer account to explore menu browsing and reservation functionalities.
- These credentials are intended for demonstration and testing purposes only.

---
  
## Testing

### Backend Tests

Run the backend automated tests using Mocha:

```bash
cd backend
npm test
```

### Frontend Tests

Run the frontend automated tests using Angular's test runner:

```bash
cd frontend
npm test
```