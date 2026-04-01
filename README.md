# AssessmentEngine

AssessmentEngine is a lightweight MERN assessment platform for SidLabs screening workflows.

Brand line:

`This research is powered by SidLabs LLP`

## Current Project State

The current application includes two working experiences:

- candidate assessment flow
- admin evaluator workspace

Implemented today:

- candidate login with environment-configured credentials
- candidate intake form with consent gate
- JSON-driven assessment instructions
- timed MCQ assessment engine
- submission validation and MongoDB storage
- thank-you completion flow
- admin login with Mongo-backed hashed password
- admin dashboard with summary metrics
- admin submissions table with search and pagination
- admin password change flow
- shared SidLabs branding, footer, and responsive UI

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB with Mongoose
- Auth: JWT cookie-based sessions
- Testing: Vitest on client, Node test runner on server

## Architecture Summary

### Frontend

- `client/src/pages` contains route-level screens
- `client/src/components` contains shared layout/UI pieces
- `client/src/context` contains auth and assessment session state
- `client/src/data` contains the current assessment JSON
- `client/src/services/api.js` contains all frontend API calls

### Backend

- `server/src/routes` defines API endpoints
- `server/src/controllers` handles request/response logic
- `server/src/services` contains validation and domain logic
- `server/src/models` contains MongoDB models
- `server/src/config` contains env, auth, DB, and assessment config

## Main Flows

### Candidate Flow

1. Candidate logs in.
2. Candidate fills identification details.
3. Candidate accepts the consent prompt.
4. Candidate reviews instructions.
5. Candidate takes the timed MCQ assessment.
6. Submission is validated server-side and stored in MongoDB.
7. Candidate sees the thank-you page.

### Admin Flow

1. Evaluator logs in.
2. Evaluator lands on the admin dashboard.
3. Evaluator reviews metrics and recent activity.
4. Evaluator inspects paginated submission records.
5. Evaluator can change the admin password securely.

## Folder Structure

```text
.
├── .env.example
├── package.json
├── README.md
├── client/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── AppRoutes.jsx
│       ├── components/
│       ├── config/
│       ├── context/
│       ├── data/
│       ├── pages/
│       ├── services/
│       ├── test/
│       ├── utils/
│       ├── index.css
│       └── theme.css
└── server/
    ├── index.js
    ├── package.json
    └── src/
        ├── app.js
        ├── server.js
        ├── config/
        ├── controllers/
        ├── middleware/
        ├── models/
        ├── routes/
        ├── services/
        └── tests/
```

## Environment Setup

Copy the template:

```bash
cp .env.example .env
```

Required variables:

```env
VITE_API_BASE_URL=http://localhost:5001

PORT=5001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017/assessment-engine
JWT_SECRET=replace-with-a-long-random-string

ADMIN_EMAIL=evaluator@sidlabs.net
ADMIN_INITIAL_PASSWORD=replace-with-a-strong-admin-password

DEMO_USER_EMAIL=candidate@sidlabs.com
DEMO_USER_PASSWORD=SidLabs@2026
```

Notes:

- the backend reads the repo root `.env`
- the candidate login uses `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD`
- the admin login uses `ADMIN_EMAIL`
- the admin password is seeded from `ADMIN_INITIAL_PASSWORD` only when the admin record does not already exist in MongoDB

## Correct Login Credentials

### Candidate

- Email: `candidate@sidlabs.com`
- Password: `SidLabs@2026`

These are the current values in the local project env and the backend accepts them.

### Admin

- Email: `evaluator@sidlabs.net`
- Password: value currently set in `ADMIN_INITIAL_PASSWORD`

If admin login fails even with the correct password, check whether the admin user already exists in MongoDB with an older password hash.

## Local Setup

Install dependencies:

```bash
npm install --prefix client
npm install --prefix server
```

Start the backend:

```bash
npm run dev:server
```

Start the frontend:

```bash
npm run dev:client
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`
- Health: `http://localhost:5001/api/health`

## Build, Test, Lint

From repo root:

```bash
npm test
npm run lint
npm run build
```

## API Summary

### Auth

- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `POST /api/auth/admin/login`
- `GET /api/auth/admin/session`
- `POST /api/auth/admin/password`

### Candidate

- `POST /api/candidate-details/validate`
- `POST /api/submissions`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/submissions`

### Utility

- `GET /api/health`

## MongoDB Notes

- MongoDB is the active persistence layer
- assessment submissions are stored in MongoDB
- admin accounts are stored in MongoDB
- the server can start without MongoDB, but persistence-backed features will degrade

Atlas example:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/assessment-engine?retryWrites=true&w=majority
```

## Login Troubleshooting

If candidate login fails:

1. Confirm the backend is running on `http://localhost:5001`
2. Confirm `.env` still contains:
   - `DEMO_USER_EMAIL=candidate@sidlabs.com`
   - `DEMO_USER_PASSWORD=SidLabs@2026`
3. Restart the backend after any `.env` change
4. Open `http://localhost:5001/api/health`
5. Test the API directly:

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"candidate@sidlabs.com","password":"SidLabs@2026"}'
```

Expected result:

- HTTP `200`
- response message `Login successful.`

If the frontend cannot reach the backend, the login page now shows a server-connection error instead of a misleading credential error.

## Branding Notes

The frontend currently uses:

- the exact SidLabs square logo in shared branding
- a shared footer with SidLabs contact details
- responsive CSS for candidate and admin experiences

## Assumptions

- one active assessment JSON is sufficient for the current product scope
- candidate auth remains environment-configured for now
- admin auth is Mongo-backed and role-protected
- Google Sheets is not part of the active current implementation

## Future Enhancements

- persisted candidate accounts instead of env-based candidate login
- submission review detail page
- export tools for admin reporting
- rate limiting for login endpoints
- richer audit logging
- multi-assessment management
