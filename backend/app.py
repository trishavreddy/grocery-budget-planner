from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt

app = Flask(__name__)
CORS(app)  # Allows all origins (for dev; restrict in prod!)
# Configure PostgreSQL connection (adjust URI as needed)

import getpass
username = getpass.getuser()
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f'postgresql://trishareddy@localhost:5432/grocery_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')

db = SQLAlchemy(app)
jwt = JWTManager(app)

# Association table for many-to-many: Meal <-> Ingredient
meal_ingredients = db.Table('meal_ingredients',
    db.Column('meal_id', db.Integer, db.ForeignKey('meal.id'), primary_key=True),
    db.Column('ingredient_id', db.Integer, db.ForeignKey('ingredient.id'), primary_key=True)
)

class Ingredient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    price = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), nullable=False)  # e.g., 'lb', 'oz', 'each'

class Meal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    ingredients = db.relationship('Ingredient', secondary=meal_ingredients, lazy='subquery',
                                  backref=db.backref('meals', lazy=True))

class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    period = db.Column(db.String(20), nullable=False)  # e.g., 'weekly', 'monthly'

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

@app.route("/")
def hello():
    return "Hello, Grocery Budget Planner!"

# --- Auth Endpoints ---
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not all(k in data for k in ('email', 'password')):
        return jsonify({'error': 'Email and password required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400

    password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = User(email=data['email'], password_hash=password_hash)
    db.session.add(user)
    db.session.commit()

    return jsonify({'success': True, 'message': 'User registered successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not all(k in data for k in ('email', 'password')):
        return jsonify({'error': 'Email and password required'}), 400

    user = User.query.filter_by(email=data['email']).first()
    if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid email or password'}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': access_token, 'user': {'id': user.id, 'email': user.email}})

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'id': user.id, 'email': user.email})

# --- Ingredient CRUD Endpoints ---
@app.route('/api/ingredients', methods=['GET'])
@jwt_required()
def get_ingredients():
    ingredients = Ingredient.query.all()
    return jsonify([
        {'id': ing.id, 'name': ing.name, 'price': ing.price, 'unit': ing.unit}
        for ing in ingredients
    ])

@app.route('/api/ingredients', methods=['POST'])
@jwt_required()
def add_ingredient():
    data = request.get_json()
    if not all(k in data for k in ('name','price','unit')):
        return jsonify({'error': 'Missing required fields'}), 400
    if Ingredient.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Ingredient already exists'}), 400
    ing = Ingredient(name=data['name'], price=float(data['price']), unit=data['unit'])
    db.session.add(ing)
    db.session.commit()
    return jsonify({'success': True, 'id': ing.id})

@app.route('/api/ingredients/<int:id>', methods=['GET'])
@jwt_required()
def get_ingredient(id):
    ing = Ingredient.query.get(id)
    if not ing:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'id': ing.id, 'name': ing.name, 'price': ing.price, 'unit': ing.unit})

@app.route('/api/ingredients/<int:id>', methods=['PUT'])
@jwt_required()
def update_ingredient(id):
    ing = Ingredient.query.get(id)
    if not ing:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    if 'name' in data:
        existing = Ingredient.query.filter_by(name=data['name']).first()
        if existing and existing.id != id:
            return jsonify({'error': 'Ingredient with this name already exists'}), 400
        ing.name = data['name']
    if 'price' in data:
        ing.price = float(data['price'])
    if 'unit' in data:
        ing.unit = data['unit']
    db.session.commit()
    return jsonify({'success': True, 'id': ing.id, 'name': ing.name, 'price': ing.price, 'unit': ing.unit})

@app.route('/api/ingredients/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_ingredient(id):
    ing = Ingredient.query.get(id)
    if not ing:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(ing)
    db.session.commit()
    return jsonify({'success': True})

# --- Meal CRUD Endpoints ---
@app.route('/api/meals', methods=['GET'])
@jwt_required()
def get_meals():
    meals = Meal.query.all()
    def serialize_meal(meal):
        return {
            'id': meal.id,
            'name': meal.name,
            'ingredients': [
                {'id': ing.id, 'name': ing.name, 'price': ing.price, 'unit': ing.unit}
                for ing in meal.ingredients
            ]
        }
    return jsonify([serialize_meal(m) for m in meals])

@app.route('/api/meals', methods=['POST'])
@jwt_required()
def add_meal():
    data = request.get_json()
    if 'name' not in data or 'ingredient_ids' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    if Meal.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Meal already exists'}), 400
    meal = Meal(name=data['name'])
    # Link meal to ingredient IDs
    meal.ingredients = Ingredient.query.filter(Ingredient.id.in_(data['ingredient_ids'])).all()
    db.session.add(meal)
    db.session.commit()
    return jsonify({'success': True, 'id': meal.id})

@app.route('/api/meals/<int:id>', methods=['GET'])
@jwt_required()
def get_meal(id):
    meal = Meal.query.get(id)
    if not meal:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({
        'id': meal.id,
        'name': meal.name,
        'ingredients': [
            {'id': ing.id, 'name': ing.name, 'price': ing.price, 'unit': ing.unit}
            for ing in meal.ingredients
        ]
    })

@app.route('/api/meals/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_meal(id):
    meal = Meal.query.get(id)
    if not meal:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(meal)
    db.session.commit()
    return jsonify({'success': True})

# --- Budget CRUD Endpoints ---
@app.route('/api/budgets', methods=['GET'])
@jwt_required()
def get_budgets():
    budgets = Budget.query.all()
    return jsonify([
        {'id': b.id, 'amount': b.amount, 'period': b.period}
        for b in budgets
    ])

@app.route('/api/budgets', methods=['POST'])
@jwt_required()
def add_budget():
    data = request.get_json()
    if not all(k in data for k in ('amount', 'period')):
        return jsonify({'error': 'Missing required fields'}), 400
    budget = Budget(amount=float(data['amount']), period=data['period'])
    db.session.add(budget)
    db.session.commit()
    return jsonify({'success': True, 'id': budget.id})

@app.route('/api/budgets/<int:id>', methods=['GET'])
@jwt_required()
def get_budget(id):
    b = Budget.query.get(id)
    if not b:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'id': b.id, 'amount': b.amount, 'period': b.period})

@app.route('/api/budgets/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_budget(id):
    b = Budget.query.get(id)
    if not b:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(b)
    db.session.commit()
    return jsonify({'success': True})

if __name__ == "__main__":
    app.run(debug=True)
