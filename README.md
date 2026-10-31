# ShopNest-MERN 🛍️

A full-stack e-commerce application built using the MERN stack (MongoDB, Express.js, React.js, and Node.js).

## Features

- User registration and login with JWT authentication
- Role-based admin access
- Product management (Create, Read, Update, Delete)
- Product search, sorting, and category filtering
- Dynamic product categories
- Shopping cart
- Checkout and order management
- Admin dashboard
- AI-powered product description generation using Google Gemini
- MongoDB Atlas database integration
- Responsive user interface

## Tech Stack

**Frontend**
- React.js
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- Google Gemini API

## Project Structure

```text
ShopNest-MERN/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── services/
│
└── README.md
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/KhadijaMurtaza3104/ShopNest-MERN.git
cd ShopNest-MERN
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment variables

Create a `.env` file inside the `backend` folder.

Configure the required values using `backend/.env.example` as a reference.

Never commit real credentials or API keys.

### 4. Start the backend

```bash
npm run dev
```

### 5. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

## Environment Variables

Configure the MongoDB connection string, JWT secret, and Gemini API key in the backend environment file. Use the example environment file as a reference.

## Project Purpose

ShopNest-MERN is a portfolio project demonstrating full-stack development, REST API design, authentication, database integration, and e-commerce functionality.

## Author

**Khadija Murtaza**

GitHub: [KhadijaMurtaza3104](https://github.com/KhadijaMurtaza3104)
