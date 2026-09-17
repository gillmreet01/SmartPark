<div align="center">

# 🅿️ SmartPark

### IoT-Based Smart Parking Management System

Real-time parking occupancy, gate automation, reservations and analytics — powered by a live IoT sensor stream.

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![WebSocket](https://img.shields.io/badge/Realtime-STOMP%2FWebSocket-8A2BE2)
![License](https://img.shields.io/badge/License-MIT-64748b)

</div>

---

## Overview

**SmartPark** is a full-stack platform that manages a multi-floor parking facility in real time. Every bay is monitored by an IoT occupancy sensor; as vehicles arrive and leave, the live map, KPIs and analytics update instantly across all connected clients over WebSocket.

It ships as two independent modules:

| Module | Stack | Responsibility |
| --- | --- | --- |
| `backend/` | Java 17 · Spring Boot 3 · Spring Data MongoDB · Spring Security (JWT) · WebSocket/STOMP | REST API, real-time hub, billing, and the IoT device simulator |
| `frontend/` | React 18 · TypeScript · Vite · Tailwind CSS · Recharts | Operator console: live map, gate control, reservations, analytics |

> **On the IoT layer — honest note:** there is no physical hardware in this repo. A built-in **device simulator** produces realistic sensor readings and drives the exact same code path that real hardware would. In production, `SimulatorService` is replaced by an MQTT listener consuming ESP32/ultrasonic readings — nothing else in the system changes. The architecture is real; the sensors are emulated.

---

## Features

- 🗺️ **Live floor map** — every bay rendered on a grid, colour-coded by status, updating in real time as sensors fire.
- 📡 **Real-time sensor feed** — a streaming log of `OCCUPIED` / `VACATED` / `HEARTBEAT` / `FAULT` events over STOMP WebSocket.
- 🚦 **Automated gate flow** — check-in auto-assigns the nearest free bay; check-out computes a duration-based fee (with an EV surcharge).
- 📅 **Reservations** — pre-book a specific bay for a time window with overlap detection; the bay is held automatically.
- 📊 **Analytics** — hourly traffic, 7-day revenue, vehicles/day, live occupancy mix, average stay and ticket size.
- 🔐 **JWT auth** — public read-only dashboard; operator sign-in unlocks all mutating actions.
- 🌱 **Zero-setup demo data** — a 3-floor lot, a week of history, and live occupancy are seeded on first run.

---

## Architecture

```mermaid
flowchart LR
  subgraph Devices["IoT layer (simulated)"]
    S["Occupancy sensors\nSimulatorService"]
  end
  subgraph Backend["Spring Boot"]
    API["REST API"]
    WS["STOMP WebSocket hub"]
    SVC["Domain services\nParking · Session · Reservation · Stats"]
    DB[("MongoDB")]
  end
  subgraph Client["React console"]
    UI["Live map · Gate · Reservations · Analytics"]
  end

  S -->|sensor events| SVC
  UI <-->|REST /api| API
  UI <-->|/topic/*| WS
  API --> SVC
  SVC --> DB
  SVC -->|broadcast| WS
```

---

## Quick start (dev — no database install needed)

**Prerequisites:** JDK 17+ and Node 18+. That's it — the `dev` profile boots an **embedded MongoDB** automatically (a `mongod` binary is downloaded on first run), so you don't need MongoDB, Docker or an Atlas account.

### 1. Backend

```bash
cd backend
# Windows PowerShell: set JAVA_HOME if it isn't already
#   $env:JAVA_HOME = "C:\Path\To\jdk-17"
./mvnw spring-boot:run
```

API comes up on **http://localhost:8080**. On first boot it seeds the lot, seven days of history, and ~40% live occupancy, then the simulator starts breathing traffic in and out.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The dashboard is live immediately (public read access). To use the gates, reservations and bay overrides, sign in:

```
username: admin
password: admin123
```

---

## Production run (real MongoDB via Docker)

The whole stack — MongoDB, API, and the built React app — comes up with one command:

```bash
docker compose up --build
```

Then open **http://localhost:8088**. The backend runs under the `prod` profile against the `mongo` container.

To point at **MongoDB Atlas** (free M0 tier, no card required) or any external Mongo instead, run the backend with:

```bash
SPRING_PROFILES_ACTIVE=prod MONGODB_URI="mongodb+srv://user:pass@cluster/smartpark" ./mvnw spring-boot:run
```

---

## Configuration

All settings have sensible defaults and can be overridden by environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | `dev` | `dev` = embedded Mongo, `prod` = external Mongo |
| `MONGODB_URI` | `mongodb://localhost:27017/smartpark` | Connection string (prod profile) |
| `SMARTPARK_JWT_SECRET` | *(dev default)* | HMAC signing key — **set your own in prod** |
| `SMARTPARK_ADMIN_USER` / `SMARTPARK_ADMIN_PASS` | `admin` / `admin123` | Seeded operator credentials |
| `SMARTPARK_SIM_ENABLED` | `true` | Toggle the IoT simulator |
| `SMARTPARK_SIM_INTERVAL_MS` | `3500` | Simulator tick cadence |
| `SMARTPARK_RATE_PER_HOUR` | `40.0` | Billing rate |
| `SMARTPARK_CURRENCY` | `INR` | Currency code (`₹`, `$`, `€`, `£` supported in UI) |
| `SMARTPARK_CORS_ORIGINS` | `http://localhost:5173,...` | Allowed frontend origins |

---

## API reference

Read endpoints (`GET`) are public; everything that mutates state requires a `Bearer` token.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Sign in, returns a JWT |
| `GET` | `/api/slots` | All bays |
| `PATCH` | `/api/slots/{id}/status` | Override a bay's status 🔒 |
| `GET` | `/api/stats/dashboard` | Live KPI snapshot |
| `GET` | `/api/stats/analytics` | Time-series analytics |
| `GET` | `/api/sessions/active` | Currently parked vehicles |
| `POST` | `/api/sessions/checkin` | Admit a vehicle 🔒 |
| `POST` | `/api/sessions/checkout` | Release & bill a vehicle 🔒 |
| `GET` | `/api/reservations` | All reservations |
| `POST` | `/api/reservations` | Create a reservation 🔒 |
| `POST` | `/api/reservations/{id}/cancel` | Cancel a reservation 🔒 |
| `GET` | `/api/events/recent` | Recent sensor events |
| WS | `/ws` → `/topic/slots`, `/topic/events`, `/topic/stats` | Real-time streams |

---

## Project structure

```
SmartPark/
├── backend/                 # Spring Boot service
│   └── src/main/java/com/smartpark/
│       ├── model/           # Mongo documents (Slot, Session, Reservation, SensorEvent, User)
│       ├── repository/      # Spring Data repositories
│       ├── service/         # Domain logic + IoT SimulatorService
│       ├── web/             # REST controllers + error handling
│       ├── security/        # JWT filter, config, token service
│       ├── realtime/        # STOMP broadcaster
│       └── bootstrap/       # Demo data seeder
├── frontend/                # React + TypeScript console
│   └── src/
│       ├── pages/           # Dashboard, ParkingMap, Sessions, Reservations, Analytics
│       ├── components/      # Layout, KPI cards, live feed
│       ├── store/           # Auth + live-data (WebSocket) providers
│       └── api/             # Typed API client + models
├── docker-compose.yml       # Full stack in one command
└── README.md
```

---

## Roadmap

- MQTT ingestion (Eclipse Mosquitto) to swap the simulator for real ESP32 sensors
- License-plate recognition at the gate (ANPR)
- Dynamic/surge pricing and monthly-pass billing
- Multi-facility tenancy and role-based operator permissions
- Push notifications when a reserved window is about to start

---

<div align="center">
<sub>Built as a portfolio project — a production-shaped reference for full-stack IoT systems.</sub>
</div>
