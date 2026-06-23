# Balance-Plate Balance Plate

Balance-Plate is a responsive nutrition planner with HTML/CSS/JavaScript frontend pages and a Node.js/Express backend. User details and app records are stored in an Excel workbook instead of MongoDB.

## Excel Storage

Workbook path:

```text
data/balance-plate-data.xlsx
```

The backend creates this file automatically when the server or seed script runs.

Workbook sheets:

- Users: fullName, username, email, mobileNumber, passwordHash, age, gender, height, weight, healthConditions, role, registrationDate, lastLoginDate, currentDietPlan, currentDietAssignedAt.
- DietPlans: condition diet plans with meal JSON, foods to avoid, water intake, and nutrition JSON.
- HealthConditions: supported condition catalog.
- UserProgress: BMI, weight, water, calories, progress notes.
- DietHistory: previous/current diet assignments and rotation history.
- LoginHistory: login attempts, time, IP, browser/user agent, success flag.

Passwords are never stored as plain text. They are stored as bcrypt hashes in the Users sheet.

## What Was Added

- Registration/login backed by the Excel workbook.
- Secure password hashing with bcrypt and session/JWT authentication.
- User profile persistence with full name, email, mobile number, age, gender, height, weight, health conditions, registration date, and last login date.
- Login history storage in the workbook.
- Expanded diet catalog for 20 health conditions, with 3-4 meal options per meal, foods to avoid, water recommendation, calories, protein, carbohydrates, fat, and fiber.
- Diabetes assessment: Normal, Prediabetes, Type 2 Diabetes, Poorly Controlled Diabetes.
- Blood pressure assessment: Low BP, Normal BP, Elevated BP, Stage 1 Hypertension, Stage 2 Hypertension.
- Diet rotation endpoint that assigns a different plan every 3 months and stores old plans in diet history.
- User dashboard additions for current diet, BMI, water, daily calories, progress, and previous diet plans.
- Admin dashboard at /admin.html for summaries, users, registrations/activity, CSV exports, and Excel workbook download.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
copy .env.example .env
```

3. Seed the Excel workbook:

```bash
npm run seed
```

4. Run locally:

```bash
npm start
```

Open http://localhost:3000.

Development mode:

```bash
npm run dev
```

## Admin Access

Seeded admin account:

- Username/email: admin or admin@balance-plate.com
- Password: value of ADMIN_PASSWORD in .env, default Admin@12345

Admin page: http://localhost:3000/admin.html

## API Summary

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
- GET /api/diets/conditions
- GET /api/diets/plans
- GET /api/diets/dashboard
- POST /api/diets/recommend
- POST /api/diets/assess/diabetes
- POST /api/diets/assess/blood-pressure
- POST /api/diets/rotate
- GET /api/admin/summary
- GET /api/admin/users
- GET /api/admin/registrations
- GET /api/admin/activity
- GET /api/admin/export/users.csv
- GET /api/admin/export/diet-history.csv
- GET /api/admin/workbook
