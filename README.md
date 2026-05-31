# ShopSphere — E-Commerce Platform

Full-stack e-commerce application with OTP-based JWT authentication, product browsing, cart management, and a protected user dashboard. Built with **Flask** (backend) and **React + Vite** (frontend).

---

## Live Deployment

| Service  | URL |
|----------|-----|
| **Frontend** | [https://ecommerce-frontend-rym2.onrender.com](https://ecommerce-frontend-rym2.onrender.com) |
| **Backend API** | [https://ecommerce-backend-2-3bla.onrender.com](https://ecommerce-backend-2-3bla.onrender.com) |
| **API Base URL** | `https://ecommerce-backend-2-3bla.onrender.com/api` |


## Features

### Authentication (Week 18 — JWT in Frontend)
- Username/password login with **OTP email verification**
- JWT **access token** and **refresh token** issued after OTP verification
- Tokens stored in `localStorage` via React Context
- **Protected routes** for products (home) and dashboard
- **Logout** clears server session and local tokens
- Axios **automatic token refresh** on 401 responses
- Session invalidation on logout (single active session per user)

### E-Commerce
- Product listing with search, category filter, and price range
- Pagination
- Category management
- Cart and checkout (API)
- Order history (API)
- Product image upload (local storage or AWS S3)

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, React Router, Axios, Vite |
| **Backend** | Flask, Flask-JWT-Extended, Flask-SQLAlchemy, Flask-CORS |
| **Database** | SQLite (local) / PostgreSQL (production) |
| **Deployment** | Render (backend web service + frontend static site) |

---

## Project Structure

```
Assignment18/
├── app.py                      # Flask entry point
├── requirements.txt            # Python dependencies
├── procfile                    # Render start command
├── render.yaml                 # Render deployment config
├── ecommerce_app/
│   ├── auth.py                 # Auth routes (login, OTP, refresh, logout)
│   ├── routes.py               # Shop API (products, cart, orders)
│   ├── models.py               # SQLAlchemy models
│   ├── middleware.py           # Session & role guards
│   └── config.py               # App configuration
└── ecommerce-frontend/
    ├── src/
    │   ├── auth/               # AuthContext, ProtectedRoute, authService
    │   ├── api/axios.js        # Axios instance + refresh interceptor
    │   ├── pages/              # Login, Home, Dashboard
    │   └── components/         # Navbar, ProductList, Filters, etc.
    └── .env.production         # Production API URL
```

---

## Authentication Flow

1. User submits **username** and **password** → backend sends OTP to email.
2. User enters **OTP** → backend returns `access_token`, `refresh_token`, and `role`.
3. Frontend stores tokens and redirects to **Dashboard**.
4. Protected pages require a valid access token.
5. If the access token expires, Axios calls `POST /api/auth/refresh` and retries the request.
6. **Logout** blacklists the token, clears `active_session_token`, and removes local storage.

### Frontend Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Login and OTP verification |
| `/` | Protected | Product catalog (home) |
| `/dashboard` | Protected | User dashboard |

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Validate credentials and send OTP |
| POST | `/verify-otp` | Verify OTP and receive JWT tokens |
| POST | `/refresh` | Refresh access token (requires refresh token) |
| POST | `/logout` | Logout and invalidate session |
| POST | `/forgot-password` | Send password reset OTP |
| POST | `/reset-password` | Reset password with OTP |

### Shop (`/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products (search, filter, paginate) |
| GET | `/products/:id` | Get product details |
| GET | `/categories` | List categories |
| GET | `/cart` | Get user cart |
| POST | `/cart/items` | Add item to cart |
| POST | `/checkout` | Place order |
| GET | `/orders` | Get user orders |

> Admin/vendor routes for creating products and categories require appropriate roles and JWT authentication.

---

## Local Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm

### Backend

```bash
# From project root
pip install -r requirements.txt

# Optional: create a .env file with secrets (see Environment Variables)
python app.py
```

Backend runs at `http://127.0.0.1:5000`.

### Frontend

```bash
cd ecommerce-frontend
npm install

# Create .env.local (optional for local dev)
# VITE_API_BASE_URL=http://127.0.0.1:5000/api

npm run dev
```

Frontend runs at `http://localhost:5173` (Vite default).

### Production Build (Frontend)

```bash
cd ecommerce-frontend
npm run build
npm run preview
```

---

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Flask secret key |
| `JWT_SECRET_KEY` | JWT signing key |
| `DATABASE_URL` | Database connection string |
| `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP for OTP emails |
| `OTP_EXPIRES_MINUTES` | OTP validity (default: 5) |
| `AWS_*` | Optional S3 configuration for image storage |

### Frontend (`.env` / `.env.production`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `https://ecommerce-backend-2-3bla.onrender.com/api`) |

---

## Deployment

Both services are configured for **Render** via `render.yaml`:

- **Backend:** Python web service using Gunicorn (`gunicorn app:app`)
- **Frontend:** Static site built with `npm run build`, served from `dist/`

CORS on the backend allows requests from the deployed frontend origin.

---

## Testing with Postman

A Postman collection is included: `Ecommerce1.postman_collection.json`

Use it to test auth, products, cart, and order endpoints against the deployed or local backend.

---

## License

Educational project — Assignment 18 (JWT Authentication in Frontend).
