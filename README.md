# Ticket Booking System — MVP

## Prerequisites
- Node.js 20+
- Docker and Docker Compose

## Setup

1. Clone the repo
2. Start Postgres and Redis:
   ```
   docker-compose up -d
   ```
3. Backend setup:
   ```
   cd backend
   cp .env.example .env
   npm install
   npm run migrate
   npm run seed
   npm start
   ```
   On Windows, run backend commands from WSL or use `npm start` from PowerShell after dependencies were installed in WSL; the start script forwards execution to WSL so native bcrypt is loaded correctly.
4. Frontend setup:
   ```
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
5. Open http://localhost:5173

## Test credentials
- Customer: user@test.com / Test1234
- Admin: admin@test.com / Admin1234

## User stories covered (Assignment 1)
- FR-01: User registration ✓
- FR-02: User login ✓
- FR-03: Browse events ✓
- FR-04: Search and filter events ✓
- FR-05: Book tickets ✓
- FR-06: View booking history ✓
