# Ticket Booking System

Web-based event ticket booking platform built with React, Node.js, PostgreSQL, and Redis.

## Prerequisites
- Node.js 20+
- Docker and Docker Compose

## Setup

1. Clone the repo
2. Start Postgres and Redis:
   ```
   docker-compose up -d
   ```
3. Backend:
   ```
   cd backend
   cp .env.example .env
   npm install
   npm run migrate
   npm run seed
   npm start
   ```
4. Frontend:
   ```
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
5. Open http://localhost:5173

## Test accounts
| Role | Email | Password |
|------|-------|----------|
| Customer | user@test.com | Test1234 |
| Event Manager | manager@test.com | Manager1234 |
| Admin | admin@test.com | Admin1234 |

## User stories (Assignment 1 traceability)
| ID | Story | Status |
|----|-------|--------|
| FR-01 | User registration | ✓ Implemented |
| FR-02 | User login | ✓ Implemented |
| FR-03 | Browse events | ✓ Implemented |
| FR-04 | Search and filter | ✓ Implemented |
| FR-05 | Book tickets | ✓ Implemented |
| FR-06 | Booking history | ✓ Implemented |
| FR-07 | Admin event management | ✓ Implemented |
| NFR-01 | Performance <300ms P95 | ✓ Redis cache |
| NFR-02 | Booking ≤5 steps | ✓ Enforced by design |
| NFR-03 | Password hashing | ✓ bcrypt |
| NFR-04 | 95% uptime target | ✓ Health endpoint + graceful errors |
| NFR-05 | 100 concurrent users | ✓ Node cluster + connection pool |

## Architecture
- Frontend: React 18 + Vite + React Query
- Backend: Node.js 20 + Express 5 (cluster mode)
- Database: PostgreSQL 15 (row-level locking for reservations)
- Cache: Redis 7 (seat availability TTL 30s, refresh tokens TTL 7d)

## API
Health check: GET /api/health
Full API: see /backend/src/routes/
