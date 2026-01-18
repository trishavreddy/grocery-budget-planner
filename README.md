# Grocery Budget Planner

A full-stack application for tracking grocery spending, managing ingredients/meals, and budget planning.

## Features

- User authentication (register/login) with JWT tokens
- Manage ingredients with name, price, and unit
- Create meals from ingredients
- Set and track budgets

## Tech Stack

- **Backend**: Flask + SQLAlchemy + PostgreSQL
- **Frontend**: React 19
- **Auth**: JWT (flask-jwt-extended) + bcrypt

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Database

Requires PostgreSQL with a database named `grocery_db`.

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user (protected)

### Ingredients (protected)
- `GET /api/ingredients` - List all ingredients
- `POST /api/ingredients` - Add ingredient
- `GET /api/ingredients/:id` - Get ingredient
- `DELETE /api/ingredients/:id` - Delete ingredient

### Meals (protected)
- `GET /api/meals` - List all meals
- `POST /api/meals` - Add meal
- `GET /api/meals/:id` - Get meal
- `DELETE /api/meals/:id` - Delete meal

### Budgets (protected)
- `GET /api/budgets` - List all budgets
- `POST /api/budgets` - Add budget
- `GET /api/budgets/:id` - Get budget
- `DELETE /api/budgets/:id` - Delete budget
