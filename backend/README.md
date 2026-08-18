# Ayurvedic Diet Recommendation System - Backend

A Node.js backend server implementing Ayurvedic dietary recommendation logic using traditional dosha principles.

## 🏗️ Architecture

```
backend/
├── src/
│   ├── server.js              # HTTP server entry point
│   ├── router.js              # Route definitions
│   ├── lib/                   # Core utilities
│   │   ├── db.js             # MongoDB connection
│   │   ├── auth.js           # JWT authentication
│   │   ├── cors.js           # CORS middleware
│   │   ├── parseBody.js      # JSON body parser
│   │   ├── respond.js        # HTTP response helper
│   │   └── validate.js       # Zod schema validation
│   ├── models/               # Database models
│   │   ├── users.js          # User collection
│   │   ├── foods.js          # Food database
│   │   ├── plans.js          # Diet plans
│   │   └── rules.js          # Scoring rules
│   ├── controllers/          # Request handlers
│   │   ├── authController.js # User auth
│   │   ├── quizController.js # Dosha quiz
│   │   ├── foodsController.js # Food queries
│   │   └── planController.js # Plan generation
│   ├── services/             # Business logic
│   │   ├── ruleEngine.js     # Ayurvedic scoring engine
│   │   └── nutrition.js      # Calorie & macro calculation
│   └── tests/
│       └── ruleEngine.test.js # Unit tests
├── scripts/
│   └── seedDatabase.js       # Load foods_mapped.csv
├── data/                      # Shared with Python validation
│   ├── foods_mapped.csv      # 300 foods with Ayurvedic properties
│   ├── rule_matrix.csv       # 31 scoring rules
│   └── *.json schemas
├── .env                       # Environment configuration
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB running on `localhost:27017`
- Python 3.x (for data validation)

### Installation

```bash
cd backend
npm install
```

### Environment Setup

Edit `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/ayurveda
JWT_SECRET=your_super_secret_jwt_key
PORT=8080
```

### Database Seeding

Load the 300 foods from CSV into MongoDB:
```bash
npm run seed
```

### Run Server

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

### Run Tests

```bash
npm test
```

## 📡 API Endpoints

### Public Endpoints

#### Register User
```http
POST /users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}

Response:
{
  "token": "jwt_token_here",
  "user": { "id": "...", "name": "John Doe", "email": "..." }
}
```

#### Dosha Quiz
```http
POST /quiz/prakriti
Content-Type: application/json

{
  "answers": [
    { "qId": "1", "vata": 3, "pitta": 1, "kapha": 0 },
    { "qId": "2", "vata": 2, "pitta": 2, "kapha": 1 }
  ]
}

Response:
{
  "dosha_result": "Vata",
  "score": { "vata": 5, "pitta": 3, "kapha": 1 }
}
```

#### Query Foods
```http
GET /foods?dosha=Pitta&season=summer&page=1&limit=20

Response:
{
  "items": [...],
  "page": 1
}
```

### Protected Endpoints (Requires JWT)

#### Generate Diet Plan
```http
POST /dietplan/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "profile": {
    "dosha_result": "Pitta",
    "age_years": 30,
    "sex": "M",
    "height_cm": 175,
    "weight_kg": 75,
    "activity_level": "moderate",
    "health_goals": ["weight_loss"],
    "allergies": ["peanuts"],
    "preferences": {
      "liked": ["rice", "dal"],
      "disliked": ["bitter_gourd"]
    }
  },
  "plan_type": "daily",
  "target_calories": 2000
}

Response:
{
  "id": "plan_id",
  "meals": [
    {
      "meal_type": "breakfast",
      "items": [
        {
          "food_id": "f_016",
          "name": "Basmati Rice",
          "portion": "120g",
          "grams": 120,
          "macros": { "calories": 427, "protein": 9.5, "carbs": 93.9, "fats": 0.6 }
        }
      ],
      "explanations": ["Balances Pitta • Tastes: sweet • Cooling energy"],
      "total_calories": 427
    }
  ],
  "total_calories": 1950,
  "target_calories": 2000,
  "dosha_target": "Pitta",
  "season": "winter",
  "macros": { "protein": 20, "carbs": 55, "fats": 25 },
  "explanation_logs": [...]
}
```

#### Get User's Diet Plans
```http
GET /dietplan/list
Authorization: Bearer <jwt_token>

Response:
{
  "plans": [...]
}
```

#### Get Specific Plan
```http
GET /dietplan/<plan_id>
Authorization: Bearer <jwt_token>
```

## 🧠 Rule Engine Logic

The rule engine implements Ayurvedic principles from `../data/rule_matrix.csv`:

### Scoring Factors

1. **Dosha Alignment** (Weight: 3.0)
   - Foods marked "Balancing" get +1 bonus
   - Foods that aggravate user's dosha get -1 penalty
   - Taste effects (Rasa):
     - Pitta: sweet/bitter/astringent (+1), pungent/sour/salty (-1)
     - Kapha: pungent/bitter/astringent (+1), sweet/sour/salty (-1)
     - Vata: sweet/sour/salty (+1), pungent/bitter/astringent (-1)
   - Quality effects (Guna):
     - Vata: heavy/unctuous (+1), dry/light (-1)
     - Kapha: light/dry (+1), heavy/unctuous (-1)
   - Energy effects (Virya):
     - Pitta: cooling (+1), heating (-1)
     - Vata/Kapha: heating preferred

2. **Seasonal Alignment** (Weight: 1.5)
   - Foods in season get +1
   - Off-season foods get -0.5

3. **Nutritional Quality** (Weight: 1.0)
   - High protein (>10g/100g) for weight loss
   - Calorie density matching goals

4. **Preferences** (Weight: 2.0)
   - Disliked foods penalized
   - Allergies completely excluded

### Meal Assembly

- Breakfast: 25% of daily calories
- Lunch: 35%
- Snack: 10%
- Dinner: 30%

Foods selected greedily by score, respecting:
- Meal type preferences (grain+fruit for breakfast, etc.)
- Portion sizes (50-200g per food)
- Macro balance

## 🧪 Testing

The test suite validates:
- ✓ Plan generation with realistic data
- ✓ Dosha-specific scoring (Pitta vs Vata vs Kapha)
- ✓ Calorie calculation (TDEE with activity multipliers)
- ✓ Macro distribution (protein/carbs/fats sum to 100%)
- ✓ Preferences and allergy exclusions

Run: `npm test`

## 📊 Data Integration

### Python → Node.js Bridge

The backend uses the same `foods_mapped.csv` validated by Python:

```bash
# Validate data (Python)
cd ..
python validation.py  # Outputs validation_checks.md

# Seed database (Node.js)
cd backend
npm run seed  # Loads CSV into MongoDB
```

### Food Data Structure

Each food in MongoDB has:
- `food_id`: Unique identifier (f_001, etc.)
- `name`: Display name
- `dosha_impact`: "Vata,Pitta,Kapha,Balancing"
- `tastes`: "sweet, astringent, ..."
- `qualities`: "light, dry, ..."
- `energy`: "heating" or "cooling"
- `season`: "spring,summer,autumn,winter,monsoon,all"
- `calories_100g`, `protein_100g`, `carbs_100g`, `fat_100g`
- `type`: grain, legume, vegetable, fruit, etc.

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiration
- CORS enabled for cross-origin requests
- Input validation with Zod schemas
- MongoDB injection protection via driver

## 🐛 Troubleshooting

**MongoDB connection fails:**
```bash
# Check MongoDB is running
mongosh mongodb://localhost:27017

# Start MongoDB service
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
```

**No foods in database:**
```bash
npm run seed
```

**Tests failing:**
```bash
# Ensure dependencies installed
npm install

# Run with verbose output
node src/tests/ruleEngine.test.js
```

## 📚 Tech Stack

- **Runtime**: Node.js 18+ (ES Modules)
- **Database**: MongoDB 7.0
- **Validation**: Zod 4.x
- **Auth**: JWT (jsonwebtoken)
- **Crypto**: bcryptjs

## 🔄 Development Workflow

1. Make changes to business logic in `src/services/`
2. Run tests: `npm test`
3. Seed fresh data if needed: `npm run seed`
4. Start dev server: `npm run dev`
5. Test endpoints with curl/Postman/Thunder Client

## 📝 Notes

- The rule engine mirrors `../rule_engine.py` logic for consistency
- All data validated against JSON schemas in `../data/`
- Calories calculated using Mifflin-St Jeor equation
- Activity factors: sedentary (1.2), moderate (1.55), active (1.725)
