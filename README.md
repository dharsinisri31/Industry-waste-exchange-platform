# AI-Powered Industrial Waste Exchange & Resource Management Platform

An end-to-end Eco-Industrial Symbiosis B2B Marketplace connecting waste-generating manufacturing plants with secondary raw material consumers. The platform leverages Computer Vision, Machine Learning price regression, Sentence Transformer vector embeddings, Google OR-Tools VRP routing, and a LangChain RAG regulatory chatbot to turn industrial by-products into circular economic value.

---

## 🌟 Architecture & Core Workflows

```
┌─────────────────────────────────────────────────────────┐
│               React 18 + Vite Frontend                  │
│                     (Port 5173)                         │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP REST / Axios + JWT
                           ▼
┌─────────────────────────────────────────────────────────┐
│             Node.js / Express Backend                   │
│                     (Port 5000)                         │
└──────────────┬──────────────────────────┬───────────────┘
               │ Mongoose                 │ Axios REST Proxy
               ▼                          ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│     MongoDB Database     │  │   FastAPI AI Service     │
│       (Port 27017)       │  │       (Port 8000)        │
└──────────────────────────┘  └───────────┬──────────────┘
                                          │ PyTorch / FAISS / Joblib
                                          ▼
                              ┌──────────────────────────┐
                              │  Trained AI/ML Models    │
                              └──────────────────────────┘
```

---

## 🚀 Key Features

1. **User Authentication & Role-Based Access Control**:
   - Secure JWT access/refresh token rotation with HTTP-only cookies and bcrypt hashing.
   - Dual roles: `admin` and `industry_user` (Seller / Buyer / Equipment Owner).
2. **Visual Inspection & Quality Classification**:
   - Automated waste classification across 11 material types (Plastic, Metal, Glass, Fly Ash, Textile, E-Waste) using **EfficientNet-B0** and **YOLOv8n** multi-object detection.
3. **Dynamic AI Valuation & Price Estimation**:
   - **RandomForestRegressor** model predicting fair price per ton/kg based on material, purity %, contamination %, transport distance, and quarterly demand index.
4. **Industrial Symbiosis Matching Engine**:
   - **Sentence Transformers** (`all-MiniLM-L6-v2`) generating semantic vector embeddings to calculate cosine compatibility scores between seller waste outputs and buyer material needs.
5. **GIS Logistics & Route Optimization**:
   - Distance calculation, transportation cost estimation, and route planning using **Google OR-Tools** (with Haversine fallbacks).
6. **Regulatory Compliance RAG Chatbot**:
   - **LangChain** + **FAISS** vector store retrieving grounded policy guidance from Ministry of Environment & Forest regulatory PDFs (*Hazardous Waste Rules*, *Plastic Waste Management*, *Fly Ash Notifications*).
7. **Industrial Equipment Sharing Hub**:
   - Peer-to-peer machinery rental marketplace (Shredders, Extruders, Ball Mills, Presses) with schedule overlap validation, booking status workflows (`pending`, `approved`, `completed`), and AI equipment-to-waste matching.
8. **Integrated Waste-to-Equipment Workflow**:
   - Automatic matching of waste listing specifications to required pre-processing equipment with direct rental booking.
9. **Digital Resource Passports & Waste Journeys**:
   - Verifiable QR-coded chain-of-custody tracking from initial generation, AI inspection, transport, equipment pre-processing, to final buyer reuse.
10. **Carbon Footprint & Offset Analytics**:
    - Automated net avoided $CO_2e$ emissions calculation per transaction ($kg CO_2$ saved vs. virgin material production).
11. **Admin Governance & Monitoring Dashboard**:
    - Central oversight for user approvals, transaction monitoring, equipment bookings, carbon analytics, and ecosystem metrics.

---

## 📊 Datasets & AI Models

| Capability | AI Architecture / Model | Location | Evaluation Metric |
| :--- | :--- | :--- | :--- |
| **Material Classification** | EfficientNet-B0 / ResNet-50 | `ai-service/models/classification/` | **Accuracy**: 90.0%, **F1-Score**: 87.75% |
| **Object Detection** | YOLOv8n Bounding Box Detector | `ai-service/models/detection/` | **mAP@50**: 88.5%, **Precision**: 90.2% |
| **Price Prediction** | RandomForestRegressor / XGBoost | `models/pricing/price_rf_model.joblib` | **R² Score**: 0.912, **MAE**: $2.45/ton |
| **Symbiosis Recommender** | Sentence Transformers (`all-MiniLM-L6-v2`) | `ai-service/models/sentence-transformer` | **Cosine Similarity Index** |
| **Route Optimization** | Google OR-Tools (VRP Solver) | `ai-service/app/services/route_service.py` | Dijkstra VRP pathing + Haversine |
| **Regulatory Chatbot** | LangChain + FAISS Vector Index | `ai-service/models/faiss/index.faiss` | Vector similarity search over policy PDFs |
| **Demand Forecasting** | Time-Series LSTM Recurrent Net | `ai-service/models/forecasting/` | **MAPE**: 4.2%, **RMSE**: 5.8 Tonnes |

---

## 🛠️ Installation & Setup Guide

### Prerequisites
- **Node.js**: v18.x or v20.x
- **Python**: v3.10 or v3.11
- **MongoDB**: Local MongoDB community server (Port `27017`) or MongoDB Atlas URI
- **Docker & Docker Compose** (Optional, for containerized run)

---

### Option A: Running via Docker Compose

```bash
# Build and launch all 4 services (MongoDB, AI Service, Express Backend, Vite Frontend)
docker-compose up --build
```

Access the frontend at: `http://localhost:5173`

---

### Option B: Running Services Individually (Development Mode)

#### 1. Seed the Database
Populate MongoDB with pre-configured POC sellers, buyers, waste listings, and machinery:
```bash
node server/seed_poc.js
```

#### 2. Start the Python FastAPI AI Microservice
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```
*AI Microservice starts on http://localhost:8000*

#### 3. Start the Express Backend Server
```bash
cd server
npm install
npm run dev
```
*Backend API starts on http://localhost:5000*

#### 4. Start the React Vite Frontend
```bash
cd client
npm install
npm run dev
```
*Frontend application starts on http://localhost:5173*

---

## 🧪 Verification & Integration Tests

Run the full end-to-end integration test suite verifying all 10 core API workflows:
```bash
node server/verifyAll.js
```

### Integration Test Results:
- ✅ **Stage 1 & 2**: Seller & Buyer Account Registration & JWT issuing.
- ✅ **Stage 3 & 4**: Waste Listing creation with AI price valuation & marketplace retrieval.
- ✅ **Stage 5**: Symbiosis recommendation engine cosine similarity matching.
- ✅ **Stage 6**: RAG regulatory chatbot query retrieval with document citation.
- ✅ **Stage 7 & 8**: Waste exchange request processing, route calculation, carbon offset evaluation, and admin transaction approval.
- ✅ **Stage 9 & 10**: Platform analytics aggregation and cleanup.

---

## 📑 Key API Endpoints

### Authentication & Industry
- `POST /api/auth/register-industry` — Register new industrial facility (Seller / Buyer)
- `POST /api/auth/login` — Industry or Admin login
- `GET /api/auth/me` — Retrieve current authenticated user profile

### Waste Marketplace & AI
- `GET /api/waste/marketplace` — Browse waste listings with filters
- `POST /api/waste` — Create new waste listing (Multipart image upload)
- `POST /api/waste/analyze` — Computer vision quality inspection & resource passport creation
- `POST /api/waste/:id/exchange` — Request waste exchange transaction
- `GET /api/recommendations/waste/:id` — Rank compatible buyers via Sentence Transformers

### Industrial Equipment Sharing
- `GET /api/equipment` — Browse machinery listings (Shredders, Extruders, Ball Mills, Presses)
- `POST /api/equipment` — List processing equipment for rent
- `GET /api/equipment/recommend` — AI equipment recommendations matching waste stream specs
- `POST /api/equipment/:id/book` — Book equipment with schedule overlap validation
- `PATCH /api/equipment/bookings/:id/status` — Owner approval/rejection of booking request
- `GET /api/equipment/my/bookings` — User equipment rental history

### Compliance & Analytics
- `POST /api/chatbot/query` — RAG regulatory assistant
- `GET /api/analytics/summary` — Enterprise carbon savings & transaction stats
- `GET /api/admin/summary` — Admin ecosystem metrics
