# Omega Tracker

Omega Tracker is a personal finance tracker web app built with React, Express, and MongoDB. It lets users create an account, sign in, track income and expenses, manage invoices, view wallet balances, and see a working capital chart based on their real transactions.

## What The App Does

- Creates user accounts and signs users in with JWT authentication.
- Stores user data in MongoDB.
- Lets users add, edit, and delete transactions.
- Calculates dashboard totals from real user transactions.
- Displays a working capital line chart from income and expense history.
- Lets users create invoices, update invoice status, and delete invoices.
- Shows wallet balance based on income minus expenses.
- Provides responsive desktop and mobile layouts.

## Tech Stack

- Frontend: React, React Router, Axios, CSS
- Backend: Node.js, Express.js, Mongoose
- Database: MongoDB
- Authentication: JSON Web Tokens

## Project Structure

```text
FinanceTracker/
  Backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      utils/
      index.js
    .env
    package.json

  frontend/
    public/
    src/
      components/
      pages/
      services/
      App.js
      index.js
    package.json
```

## Main Features

### Authentication

Users can register and sign in. After login, the frontend stores the JWT in `localStorage`. Axios attaches that token to protected API requests.

Email verification code exists in the backend, but the verification requirement is currently disabled so users can sign up and access the dashboard immediately.

### Dashboard

The dashboard shows:

- Total balance
- Total spending
- Total saved
- Working capital line graph
- Recent transactions
- Wallet preview
- Scheduled transfer area based on actual transactions

The totals are calculated from transactions:

```text
Total balance = income - expenses
Total spending = all expense transactions
Total saved = positive remaining balance
```

### Transactions

Users can:

- Add income or expense transactions
- Edit amount, category, description, and date
- Delete transactions after confirmation
- Search transactions

Transaction data is saved in MongoDB.

### Invoices

Users can:

- Create invoices
- View invoice details
- Mark invoices as paid or unpaid
- Delete invoices
- Download invoice text files

Invoice placeholders were removed, so the invoice list only shows invoices created by the user.

### Wallets

The wallet page reflects the user's real transaction balance. The My Payments section uses actual transaction records instead of placeholder payment data.

## Environment Variables

Create this file:

```text
Backend/.env
```

Example:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/financial_tracker
JWT_SECRET=replace_this_with_a_real_secret
CLIENT_URL=http://localhost:3001
```

Optional email variables for future verification support:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

## Running Locally

### 1. Start MongoDB

Make sure MongoDB is running locally, or use a MongoDB Atlas connection string in `Backend/.env`.

### 2. Install Backend Dependencies

```bash
cd Backend
npm install
```

### 3. Start Backend

```bash
npm start
```

Backend runs at:

```text
http://localhost:3000
```

### 4. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 5. Start Frontend

```bash
npm start
```

Frontend runs at:

```text
http://localhost:3001
```

If React asks to use another port, choose `3001` or update the API URL if needed.

## API Overview

All protected routes require:

```http
Authorization: Bearer <token>
```

### Auth / Users

```http
POST /api/users/register
POST /api/users/login
GET  /api/users/me
PUT  /api/users/me
```

### Transactions

```http
GET    /api/transactions
POST   /api/transactions
GET    /api/transactions/:id
PUT    /api/transactions/:id
DELETE /api/transactions/:id
```

Transaction schema:

```js
{
  user: ObjectId,
  type: "income" | "expense",
  amount: Number,
  category: String,
  description: String,
  date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Invoices

```http
GET    /api/invoices
POST   /api/invoices
PUT    /api/invoices/:id
DELETE /api/invoices/:id
```

### Wallets

```http
GET /api/wallets
PUT /api/wallets
```

## How Data Flows

1. User signs in.
2. Backend returns a JWT.
3. Frontend stores the token in `localStorage`.
4. Axios sends the token with API requests.
5. Backend verifies the token and loads the user.
6. MongoDB queries are scoped to that user's ID.
7. Frontend updates the UI from API responses.

## Mobile Behavior

The app includes mobile-specific layouts:

- Bottom transparent navigation bar
- Single-column content
- Mobile card layouts for tables
- Compact invoice and transaction controls
- Responsive auth pages

## Deployment Notes

Recommended deployment:

- Frontend: Vercel
- Backend: Render, Railway, or Fly.io
- Database: MongoDB Atlas

For production, replace local values:

```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=long_random_secret
CLIENT_URL=https://your-frontend-domain.vercel.app
```

The frontend API base URL should point to the deployed backend instead of `localhost`.

## Build And Test

Frontend production build:

```bash
cd frontend
npm run build
```

Backend syntax can be checked with:

```bash
cd Backend
node --check src/index.js
```

## Current Notes

- Email verification is currently disabled, but supporting backend code is present for later use.
- Placeholder invoice, transaction, and payment data has been removed.
- Dashboard totals are calculated from real transaction data only.

