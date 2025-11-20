# Crypto Trading Backend — Market Order Implementation

This project implements a **crypto order execution engine** that processes **market orders** with:

* Real-time WebSocket status updates
* DEX routing between **Raydium** & **Meteora**
* Queue-based execution (BullMQ + Redis)
* Order persistence (PostgreSQL)
* Mock DEX simulation with realistic delays

Architecture and expected behavior is fully aligned with the official assignment description.

---

# 📌 Why I Chose *Market Orders*

I chose **market orders** because they are the simplest and most common execution type, allowing me to focus on:

* DEX routing
* Real-time WebSocket streaming
* Queue concurrency
* Proper architecture

### How to extend to other types

* **Limit orders**: Add a price-trigger evaluation before routing.
* **Sniper orders**: Add launch-event detection and auto-execute when liquidity appears.

---

# 🧠 System Overview

## 1. **Order Submission**

✔ User sends:

```
POST /api/orders/execute
```

✔ Request is validated
✔ A unique `orderId` is returned
✔ Order is queued for background processing
✔ Same client then connects via WebSocket for updates


---

## 2. **DEX Routing Logic**

The engine fetches mock quotes from:

* **Raydium**
* **Meteora**

Then:

* Compares quotes
* Chooses best execution venue
* Logs routing decision

Quotes are simulated with:

* 200ms delay
* 2–5% random variance


---

## 3. **Execution Lifecycle (WebSocket)**

Once connected to:

```
/api/orders/ws
```

The engine streams these statuses in real time:

| Status        | Meaning                           |
| ------------- | --------------------------------- |
| **pending**   | Order received & queued           |
| **routing**   | Fetching Raydium + Meteora quotes |
| **building**  | Creating transaction              |
| **submitted** | Sending to network                |
| **confirmed** | Executed (txHash, executed price) |
| **failed**    | Any error                         |

All required statuses implemented.


---

## 4. **Transaction Settlement (Mock)**

* Simulates 2–3 seconds execution
* Generates txHash
* Applies slippage simulation
* Stores execution price and result



---

# 🛠 Tech Stack

* **Node.js + TypeScript**
* **Fastify** (WebSocket support)
* **Redis + BullMQ** (queue processing up to 10 concurrent jobs)
* **PostgreSQL** (order + status persistence)
* **Mock DEX Router** (Raydium/Meteora simulation)


---

# ⚙ Features Implemented (Assignment Requirements)

✔ Single order type (Market)
✔ DEX routing with comparison
✔ WebSocket lifecycle streaming
✔ Queue concurrency (BullMQ with Redis)
✔ Exponential retry (≤3 attempts)
✔ DB persistence (orders + status events)
✔ Mock DEX with latency + random price variance
✔ Clean logs for routing decisions
✔ Deployable with Docker / Render
✔ Clean folder structure & modular code

---

# 📡 API Documentation

### ▶ **POST /api/orders/execute**

**Request:**

```json
{
  "type": "market",
  "side": "buy",
  "baseAsset": "SOL",
  "quoteAsset": "USDC",
  "amount": 1
}
```

**Response:**

```json
{
  "orderId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

---

### ▶ **WebSocket: /api/orders/ws**

1. Connect to:

```
ws://localhost:3000/api/orders/ws
```

or on Render:

```
wss://<your-app-name>.onrender.com/api/orders/ws
```

2. Then send:

```json
{ "orderId": "<your-order-id>" }
```

3. Receive updates:

```
pending → routing → building → submitted → confirmed
```

---

# 🗄 Database Schema

### **orders**

| Field          | Type        |
| -------------- | ----------- |
| order_id       | TEXT        |
| payload        | JSONB       |
| status         | TEXT        |
| chosen_dex     | TEXT        |
| executed_price | NUMERIC     |
| tx_hash        | TEXT        |
| failure_reason | TEXT        |
| created_at     | TIMESTAMPTZ |
| updated_at     | TIMESTAMPTZ |

### **order_statuses**

| Field    | Type        |
| -------- | ----------- |
| id       | SERIAL      |
| order_id | TEXT (FK)   |
| status   | TEXT        |
| meta     | JSONB       |
| ts       | TIMESTAMPTZ |

---

# 🚀 Running Locally (Docker)

```
docker-compose up --build
```

Backend runs on:

```
http://localhost:3000
```

---

# 🌐 Deployment URL

*(https://crypto-trading-ll4e.onrender.com)*

---

# 🎥 Demo Video


# 🧪 Tests

≥10 tests cover:

* DEX routing logic
* Queue behavior
* Retry logic
* WebSocket message lifecycle
* Order persistence

(Include your test folder path here.)

---

# 📁 Project Structure

```
src/
 ├── index.ts
 ├── wsManager.ts
 ├── queue/
 ├── processor.ts
 ├── services/
 ├── db.ts
 └── utils/
```


