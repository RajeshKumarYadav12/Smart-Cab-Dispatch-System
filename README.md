# 🚖 ApnaRide: Smart Cab & Vehicle Dispatch System

**A full-stack, real-time fleet management and intelligent vehicle dispatch platform built for corporate events, conferences, airport transfers, and large-scale transportation logistics.**

---

# 🎯 Overview

| Aspect                      | Details                                    |
| --------------------------- | ------------------------------------------ |
| **Architecture**            | Monorepo with npm Workspaces               |
| **Backend**                 | Node.js + Express.js                       |
| **Frontend**                | React + Vite + Tailwind CSS                |
| **Database**                | MongoDB + Mongoose                         |
| **Real-Time Communication** | Socket.io                                  |
| **Maps & Navigation**       | Google Maps API                            |
| **Authentication**          | JWT + Role-Based Access Control            |
| **Dispatch Optimization**   | Greedy Cost Function + Hungarian Algorithm |
| **Deployment**              | Docker + Docker Compose                    |
| **System Type**             | Real-Time Event-Driven Platform            |

---

# ⚙️ Local Development

## Prerequisites

Before running the application, make sure the following are installed:

* Node.js v18+
* npm
* Docker
* Docker Compose
* MongoDB
* Google Maps API Key *(Optional)*

---

# 📥 Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the project directory:

```bash
cd smart-cab-dispatch-system
```

Install all workspace dependencies:

```bash
npm install
```

The project uses **npm Workspaces** to manage the backend, guest application, admin portal, and shared modules from a single monorepo.

---

# 🔐 Configure Environment Variables

Create a `.env` file inside:

```text
packages/server/.env
```

Add the following configuration:

```env
PORT=5000

MONGO_URI=mongodb://localhost:27017/apnaride

JWT_SECRET=your_secret_key

GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Google Maps Configuration

The Google Maps API key is optional.

If the API key is unavailable, the application can fall back to:

* Haversine distance calculations
* Direct route visualization
* Basic distance-based dispatch calculations

---

# 🚀 Run the Application

Start the complete application using:

```bash
npm run start
```

This starts the complete ApnaRide environment, including:

* MongoDB
* Backend API
* Guest Application
* Admin / Driver Portal

---

# 🏗️ Production Build

Build all frontend applications for production:

```bash
npm run build
```

This generates optimized production builds for the frontend applications.

---

# 🌐 Application URLs

## Backend API

```text
http://127.0.0.1:5000
```

## Guest Application

```text
http://localhost:5174
```

## Admin / Driver Portal

```text
http://localhost:5175
```

---

# ✨ Key Features

* 🚖 Intelligent Driver Dispatch Engine
* ⚡ Real-Time Driver Tracking
* 🔄 Socket.io Real-Time Communication
* 📍 Google Maps Integration
* 🗺️ Live ETA Calculation
* 👥 Smart Ride Pooling
* 🧠 Hungarian Algorithm for Batch Dispatch
* ⚙️ Greedy Cost Function for Instant Requests
* 🔄 Automatic Trip Re-optimization
* 🔐 JWT Authentication
* 👤 Role-Based Access Control
* 📱 Separate Guest & Driver Interfaces
* 📊 Fleet Monitoring Dashboard
* 🚦 Live Driver Status Management
* 🐳 Docker & Docker Compose Support
* 📦 Monorepo Architecture
* 🚀 Scalable Event-Driven Architecture

---

# 🏗️ System Architecture

ApnaRide follows a modular monorepo architecture where the backend, guest application, driver/admin portal, and shared resources are maintained within a single repository.

```text
                         ┌─────────────────────┐
                         │      Guest App      │
                         │   React + Vite      │
                         └──────────┬──────────┘
                                    │
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     Backend API     │
                         │ Node.js + Express   │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
        │   MongoDB      │ │   Socket.io    │ │ Dispatch Engine│
        │   Database     │ │ Real-Time Data │ │ Optimization   │
        └────────────────┘ └────────────────┘ └───────┬────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │ Driver / Admin  │
                                             │     Portal      │
                                             └─────────────────┘
```

---

# 🚘 Application Modules

## 👤 Guest Application

The Guest Application provides passengers with a simple interface for requesting and tracking rides.

### Features

* Guest Registration
* Guest Authentication
* On-Demand Ride Requests
* Pickup Location Selection
* Drop-Off Location Selection
* Live Ride Tracking
* Real-Time ETA Updates
* Pickup & Drop-Off Maps
* Ride Status Updates

---

# 🚗 Driver Terminal

The Driver Terminal allows drivers to manage their availability and assigned trips.

### Features

* Driver Login
* Online / Offline Status
* Accept Trips
* Reject Trips
* Current Trip Information
* Live Navigation
* Pickup Information
* Drop-Off Information
* Automatic Availability Management
* Real-Time Trip Updates

---

# 🖥️ Operations Dashboard

The Operations Dashboard provides administrators with centralized fleet management.

### Features

* Driver Management
* Guest Management
* Fleet Monitoring
* Live Trip Tracking
* Manual Ride Approval
* Dispatch Alerts
* Driver Status Monitoring
* Trip Management
* Operational Analytics

---

# 🧠 Intelligent Dispatch Engine

The dispatch engine is the core component responsible for assigning available vehicles to ride requests.

The system supports multiple dispatch strategies depending on the request volume and fleet conditions.

---

## ⚡ Streaming Dispatch

For individual or instant ride requests, the system uses a greedy cost-based dispatch strategy.

### Optimization Factors

* Driver ETA
* Driver Distance
* Idle Time
* Passenger Wait Time
* Driver Availability

```text
Ride Request
      │
      ▼
Find Available Drivers
      │
      ▼
Calculate Driver Cost
      │
      ├── ETA
      ├── Distance
      ├── Idle Time
      └── Wait Time
      │
      ▼
Select Lowest-Cost Driver
      │
      ▼
Assign Trip
```

This approach allows the system to respond quickly to individual requests.

---

# 🧮 Batch Dispatch

When multiple ride requests arrive simultaneously, ApnaRide uses the **Hungarian Algorithm** to optimize fleet assignment.

### Batch Optimization

* Multiple drivers
* Multiple ride requests
* Global assignment cost
* Fleet-wide optimization
* Efficient vehicle allocation

```text
             Ride Requests
          ┌───────┬───────┐
          ▼       ▼       ▼
        Ride 1  Ride 2  Ride 3
          │       │       │
          └───────┬───────┘
                  │
                  ▼
          ┌───────────────┐
          │ Cost Matrix   │
          └───────┬───────┘
                  │
                  ▼
          ┌───────────────┐
          │   Hungarian   │
          │   Algorithm   │
          └───────┬───────┘
                  │
                  ▼
          Optimized Driver
             Assignment
```

The goal is to minimize the overall assignment cost across the available fleet.

---

# 🔄 Dynamic Trip Re-optimization

The system continuously monitors active trips and driver conditions.

### Re-optimization capabilities

* Continuous ETA monitoring
* Traffic-aware reassignment
* Automatic trip redistribution
* Driver availability updates
* Fleet utilization optimization
* Dynamic assignment adjustments

```text
Active Trips
     │
     ▼
Monitor ETA / Driver Status
     │
     ▼
Detect Optimization Opportunity
     │
     ▼
Recalculate Assignments
     │
     ▼
Redistribute Trips
     │
     ▼
Optimized Fleet
```

---

# ⚡ Real-Time Communication

ApnaRide uses **Socket.io** to maintain real-time communication between:

* Guest Application
* Driver Terminal
* Operations Dashboard
* Backend Server

Real-time events can be used for:

* Driver location updates
* Ride status changes
* Trip assignments
* Driver availability
* ETA updates
* Dispatch notifications

```text
Guest App
    │
    │
    ▼
Socket.io
    │
    ▼
Backend
    │
    ├──────────────► Driver Terminal
    │
    └──────────────► Operations Dashboard
```

---

# 📍 Maps & Navigation

The platform integrates with Google Maps services for location and navigation functionality.

### Integrations

* Google Maps API
* Distance Matrix API
* Directions API

### Capabilities

* Pickup location visualization
* Drop-off location visualization
* Distance calculation
* Route visualization
* ETA calculation
* Driver navigation support

---

# 🔐 Authentication & Security

The backend uses JWT-based authentication and role-based authorization.

### Supported Roles

* Guest
* Driver
* Administrator

```text
User
 │
 ▼
JWT Authentication
 │
 ▼
Role Verification
 │
 ├── Guest
 │
 ├── Driver
 │
 └── Administrator
```

This ensures users can access only the functionality associated with their role.

---

# 🛠️ Technology Stack

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.io
* JWT

---

## Frontend

* React
* Vite
* Tailwind CSS

---

## Algorithms

* Greedy Cost Function
* Hungarian Algorithm
* Haversine Distance Calculation

---

## Integrations

* Google Maps API
* Distance Matrix API
* Directions API

---

## DevOps & Tools

* Docker
* Docker Compose
* npm Workspaces

---

# 📂 Project Structure

```text
smart-cab-dispatch-system/
│
├── packages/
│   │
│   ├── server/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── admin-portal/
│   │   ├── src/
│   │   └── ...
│   │
│   ├── guest-app/
│   │   ├── src/
│   │   └── ...
│   │
│   └── shared/
│       └── ...
│
├── package.json
├── docker-compose.yml
└── README.md
```

---

# 🔄 Request-to-Dispatch Flow

A typical ride request follows the following workflow:

```text
Guest Creates Ride
        │
        ▼
Backend Receives Request
        │
        ▼
Find Available Drivers
        │
        ▼
Calculate Driver Costs
        │
        ├───────────────┐
        │               │
        ▼               ▼
 Single Request     Batch Requests
        │               │
        ▼               ▼
 Greedy Strategy   Hungarian Algorithm
        │               │
        └───────┬───────┘
                │
                ▼
        Driver Assignment
                │
                ▼
        Real-Time Notification
                │
                ▼
         Driver Accepts
                │
                ▼
          Trip Begins
                │
                ▼
       Live Trip Tracking
                │
                ▼
         Trip Completed
                │
                ▼
       Driver Available Again
```

---

# 📊 Fleet Management

The Operations Dashboard provides centralized visibility into the fleet.

Administrators can monitor:

* Available drivers
* Busy drivers
* Offline drivers
* Active trips
* Pending requests
* Driver assignments
* Live trip locations
* Dispatch status

This enables operators to make informed decisions during large-scale transportation operations.

---

# 🧠 Dispatch Optimization Strategy

ApnaRide uses different optimization strategies based on workload.

| Scenario          | Strategy                | Objective                     |
| ----------------- | ----------------------- | ----------------------------- |
| Single Request    | Greedy Cost Function    | Fast Assignment               |
| Multiple Requests | Hungarian Algorithm     | Global Optimization           |
| Active Trips      | Dynamic Re-optimization | Fleet Efficiency              |
| Missing Maps API  | Haversine Distance      | Fallback Distance Calculation |

---

# 🐳 Docker Support

The application is designed to run with Docker and Docker Compose.

Docker can be used to manage:

* MongoDB
* Backend
* Frontend services
* Application environments

Example:

```bash
docker-compose up
```

Stop running containers:

```bash
docker-compose down
```

---

# 📈 Scalability

The platform is designed around a modular architecture that allows individual components to evolve independently.

### Scalability Characteristics

* Monorepo-based modular development
* Event-driven communication
* Real-time Socket.io infrastructure
* Separate frontend applications
* Centralized backend API
* Optimized dispatch algorithms
* MongoDB-based persistence
* Docker-based deployment

---

# 📌 Project Highlights

ApnaRide is designed to be:

* ⚡ Real-Time
* 🚖 Fleet Optimized
* 🧠 Algorithm Driven
* 🔄 Event-Driven
* 📦 Modular
* 🚀 Scalable
* 🔐 Role-Based Secure
* 📍 Location Aware
* 📊 Operations Focused
* 🐳 Docker Ready
* 📱 Responsive
* 🏗️ Production Ready

---

# 🧪 Use Cases

ApnaRide can be used for large-scale transportation scenarios such as:

* 🏢 Corporate Events
* 🎤 Conferences
* ✈️ Airport Transfers
* 🏨 Hotel Transportation
* 🎓 University Events
* 🎪 Large Public Events
* 🚐 Corporate Fleet Operations
* 👥 Group Transportation

---

# 🚀 Status

**Production Ready**

### Stack

**Node.js • Express.js • MongoDB • Mongoose • React • Vite • Tailwind CSS • Socket.io • JWT • Google Maps API • Docker • Docker Compose • npm Workspaces**
