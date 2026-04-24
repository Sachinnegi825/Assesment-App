# AssessmentEngine

AssessmentEngine is a lightweight, secure MERN assessment platform for SidLabs screening workflows, now featuring AI-powered proctoring and advanced exam integrity controls.

Brand line:

`This research is powered by SidLabs LLP`

## Current Project State

The application provides a high-integrity evaluation environment with two core experiences:

- **Candidate Assessment Flow**: A locked-down, proctored environment for taking assessments.
- **Admin Evaluator Workspace**: A dashboard for reviewing results and integrity reports.

### Key Features Implemented:

- **AI Proctoring**: Real-time face detection using TensorFlow.js (BlazeFace) to detect missing or multiple faces.
- **Exam Integrity Hooks**: Comprehensive browser lockdown including full-screen enforcement, tab-switch detection, and clipboard protection.
- **Security Violation System**: Real-time candidate alerts and automated logging of security incidents.
- **Candidate Intake**: Form with consent gate and environment-configured credentials.
- **Timed MCQ Engine**: JSON-driven assessment with auto-save and auto-expiry logic.
- **Integrity Reporting**: Detailed violation logs stored in MongoDB for evaluator review.
- **Admin Dashboard**: Summary metrics and paginated submission table with search/filtering.
- **Secure Auth**: JWT cookie-based sessions with hashed password management.

## Stack

- **Frontend**: React + Vite, TensorFlow.js (AI Proctoring)
- **Backend**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **Auth**: JWT cookie-based sessions
- **Security**: Page Visibility API, Fullscreen API, BlazeFace Detection
- **Testing**: Vitest (Client), Node test runner (Server)

## Architecture Summary

### Frontend

- `client/src/hooks/useSecurityHooks.js`: Core logic for environment lockdown and incident detection.
- `client/src/components/FaceProctor.jsx`: AI monitoring component using webcam and BlazeFace.
- `client/src/components/ViolationModal.jsx`: Real-time feedback UI for candidate security alerts.
- `client/src/context/AssessmentContext.jsx`: Orchestrates session state, violations, and sync.
- `client/src/services/api.js`: Handles communication with the backend.

### Backend

- `server/src/models/assessmentSubmissionModel.js`: Stores assessment data along with a detailed `integrityReport`.
- `server/src/services/submissionService.js`: Handles secure submission and violation logging.
- `server/src/services/adminSubmissionTableService.js`: Processes submission data for evaluator review.

## Main Flows

### Candidate Flow (High Integrity)

1. **Login & Intake**: Candidate enters credentials and provides identification details.
2. **Consent & Instructions**: Reviewing rules and accepting the proctoring consent.
3. **Environment Lock**: The assessment enters full-screen mode and activates AI monitoring.
4. **Assessment**: Candidate completes MCQ questions while the system monitors for:
   - Tab switching / Window minimizing
   - Full-screen exit
   - Copy/Paste or Context Menu attempts
   - Face missing or multiple people detected
5. **Submission**: Results are saved along with an integrity report to MongoDB.

### Admin Flow

1. **Evaluator Login**: Secure access to the admin workspace.
2. **Dashboard**: High-level overview of candidate activity.
3. **Submission Review**: Detailed table view including completion status (e.g., "Terminated: Security violations" or "Partial: Tab switched").
4. **Account Management**: Secure password update for admin credentials.

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
│       ├── components/      # UI components (FaceProctor, ViolationModal, etc.)
│       ├── hooks/           # useSecurityHooks for lockdown logic
│       ├── context/         # Auth and Assessment state management
│       ├── pages/           # Route-level screens
│       └── services/        # API client
└── server/
    ├── index.js
    └── src/
        ├── models/          # MongoDB schemas (with IntegrityReport)
        ├── routes/          # API endpoints
        ├── services/        # Business logic and validation
        └── middleware/      # Auth and logging
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

- Email: `candidate@gmail.com`
- Password: `Candidate@2026`

These are the current values in the local project env and the backend accepts them.

### Admin

- Email: `evaluator@sidlabs.net`
- Password: value currently set in `ADMIN_INITIAL_PASSWORD`

- Email: `evaluatormain1@sidlabs.net`
- Password: `Evaluatormain1@sidlabs.net`

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
