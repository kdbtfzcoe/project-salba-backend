# Project SALBA — Backend API & Telemetry Engine

**Project SALBA** is an IoT-driven community flood monitoring and early warning system. This Node.js/Express backend handles real-time telemetry processing from hardware nodes, Exponential Moving Average (EMA) flood trend filtering, geo-haversine threat evaluations, and automated emergency SMS alert dispatching.

## 🚀 Key Responsibilities & Features

* **Telemetry Ingestion & Processing:** Receives and logs real-time ultrasonic water level readings from field sensors.
* **Predictive EMA Engine:** Implements Exponential Moving Average filtering (`utils/emafilter.js`) to smooth signal noise and project short-term flood trends.
* **Threat Evaluation Engine:** Evaluates water level changes against Barangay Dela Paz threshold levels (Gutter, Knee, Waist, Chest) and triggers alerts via `services/threatEngine.js`.
* **Geo-Radius Subscriber Dispatch:** Uses Haversine distance calculations (`utils/haversine.js`) to target residents within designated flood zones.
* **SMS Alerting Integration:** Dispatches automated emergency SMS notifications via `services/smsService.js`.
* **Serverless Deployment Ready:** Pre-configured with `vercel.json` for rapid deployment.

## 💻 Local Setup Guide

Follow these steps to set up and run the backend server locally:

### 1. Install Dependencies
Open your terminal in the root project directory and run:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (never commit this file to GitHub):
```env
PORT=5000
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_service_role_key_here
SEMAPHORE_API_KEY=your_sms_gateway_api_key
```

### 3. Run Development Server
```bash
npm run dev
# or
node server.js
```
The server will start at `http://localhost:5000`.

## 📄 License & Demonstration Notice

*Project SALBA Node System © 2026. Designed and developed for Barangay Dela Paz, Biñan City.*
