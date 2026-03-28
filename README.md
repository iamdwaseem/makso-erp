# WareFlow - Warehouse ERP & Inventory Management System

A comprehensive Warehouse ERP system built with a modern tech stack to manage products, suppliers, customers, and real-time inventory tracking with QR code integration.

## 🚀 Features

- **Inventory Management**: Real-time tracking of stock levels and historical ledger logs.
- **QR Code Scanning**: Built-in support for scanning items at stock entry and exit stations.
- **Product & Variant Tracking**: Manage products with multiple variants (colors, styles, etc.) and unique SKUs.
- **Supplier & Customer Management**: Keep track of third-party vendors and clients.
- **Purchase & Sales Records**: Detailed logging of all transactions impacting stock.
- **Dashboard Analytics**: Overview of key warehouse metrics and recent activities.

## 🛠 Tech Stack

### Backend
- **Framework**: Express.js (Node.js)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Security**: Helmet, CORS
- **Logging**: Morgan

### Frontend
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS, PostCSS
- **State Management**: React Hook Form
- **Routing**: React Router DOM (v7)
- **Utilities**: Axios, HTML5 QR Code Scanner, QR Code Generator

## 📁 Project Structure

```text
side-gig/
├── backend/            # Express API & Prisma Schema
│   ├── prisma/         # Database schema and migrations
│   ├── src/            # Source code (routes, controllers, services)
│   └── .env            # Environment variables
├── frontend/           # React SPA
│   ├── src/            # Components, Pages, and Assets
│   └── vite.config.ts  # Vite configuration
└── .gitignore          # Root Git ignore rules
```

## ⚙️ Setup & Installation

### Prerequistes
- **Node.js**: v18+ recommended
- **PostgreSQL**: Local instance running

### 1. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/erpdb"
```
Run migrations and start the server:
```bash
npx prisma migrate dev
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

## 🐳 Production (Docker)

Use **Docker Compose** to run PostgreSQL, the API, and an Nginx front (SPA + `/api` proxy). See **[DEPLOY.md](./DEPLOY.md)** for full steps.

```bash
cp env.deploy.example .env   # then edit secrets
npm run deploy:up
```

## 📜 Available Scripts

### Backend
- `npm run dev`: Starts the server using `tsx watch`
- `npm run prisma:generate`: Generates the Prisma client
- `npm run prisma:migrate`: Runs database migrations

### Frontend
- `npm run dev`: Starts the Vite development server
- `npm run build`: Compiles the project for production
- `npm run lint`: Runs ESLint for code quality
- `npm run preview`: Previews the production build locally

### Root (monorepo)
- `npm run deploy:up`: Build and start the production Docker stack (`docker-compose.prod.yml`, requires `.env`)
- `npm run deploy:down`: Stop the production stack
- `npm run deploy:logs`: Follow container logs

## 🛡 License
This project is licensed under the ISC License.