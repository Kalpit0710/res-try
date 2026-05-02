# EduNexus - School Report Management System (SRMS)

A full-stack application for managing student reports, marks, branding, and co-scholastic assessments.

## Project Structure

```
res-try/
├── apps/
│   ├── client/          # React + Vite frontend
│   ├── server/          # Node.js + Express backend
├── packages/
│   ├── shared/          # Shared TypeScript utilities & types
├── docs/                # Documentation files
```

## Prerequisites

- **Node.js** (v18+)
- **npm** (v9+)
- **MongoDB** (local or Atlas connection string)
- **Chrome/Edge browser** (for Puppeteer PDF generation)

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

#### Server Configuration

Copy `.env.example` to `.env` in `apps/server/`:

```bash
cd apps/server
# PowerShell
Copy-Item .env.example .env
```

Edit `apps/server/.env` with your settings:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/srms
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
CLIENT_URL=http://localhost:5173
SCHOOL_NAME=Your School Name
ACADEMIC_SESSION=2025-26
```

#### Client Configuration (Optional)

If running on a non-standard port, create/update `apps/client/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Start MongoDB

Ensure MongoDB is running locally or update `MONGODB_URI` with your Atlas connection:

```bash
# Windows (if using MongoDB Community Server)
mongod

# Or connect to Atlas by updating MONGODB_URI in .env
```

## Running Locally

### Option 1: Run Both Server & Client Together

```bash
npm run dev
```

This starts:
- **Server** at `http://localhost:5000`
- **Client** at `http://localhost:5173`

If port `5000` is already in use, stop the existing process or change `PORT` in `apps/server/.env` before starting the server.

### Option 2: Run Server & Client Separately

**Terminal 1 — Server:**

```bash
npm run dev --workspace=apps/server
```

Server runs at `http://localhost:5000`

**Terminal 2 — Client:**

```bash
npm run dev --workspace=apps/client
```

Client runs at `http://localhost:5173`

## Building for Production

### Build Both

```bash
npm run build
```

### Build Individually

**Server:**

```bash
npm run build --workspace=apps/server
```

**Client:**

```bash
npm run build --workspace=apps/client
```

## Database Seeding

Populate MongoDB with demo data (classes, students, teachers, marks, logs):

```bash
npm run seed --workspace=apps/server
```

**What gets seeded:**
- 4 classes (10-A, 10-B, 11-Science, etc.)
- 4 teachers
- 12+ students
- Sample marks entries
- Activity logs
- Lock records

**Database**: `srms` (configurable via `MONGODB_URI`)

## Key Features

### Admin Dashboard
- View system statistics
- Manage students, classes, subjects, teachers
- Configure branding (logo, principal/teacher signatures)

### Marks Entry
- Two sections: **Scholastic** (subject marks) + **Co-Scholastic** (areas: Work Education, Art Education, etc.)
- Per-term marks entry (term1/term2)
- Real-time validation

### Report Generation
- PDF report cards with:
  - Student profile
  - Subject-wise marks table
  - Overall assessment (out of 100)
  - Co-scholastic area grades
  - Teacher/principal signatures
  - School logo

### Bulk Upload
- Download CSV template
- Drag-and-drop file upload
- Parse & validate preview
- Selective import with error handling

### Teacher Portal
- Public marks entry (no login required)
- Search students by name/registration/class
- Generate individual report PDFs

## API Routes

### Public Endpoints (No Auth)
- `GET /api/v1/public/classes`
- `GET /api/v1/public/students?classId=&search=`
- `GET /api/v1/public/subjects?classId=`
- `GET /api/v1/public/teachers`
- `POST /api/v1/marks` (public marks entry)
- `GET /api/v1/marks` (query by studentId/subjectId)

### Admin Endpoints (Requires Auth)
- `POST /api/v1/students` — create/update/delete students
- `POST /api/v1/subjects` — manage subjects
- `POST /api/v1/teachers` — manage teachers
- `POST /api/v1/co-scholastic-marks` — manage co-scholastic marks
- `POST /api/v1/settings/branding` — upload logo/signatures
- `GET /api/v1/reports/student/:studentId` — generate PDF report

## Development

### Run Tests

```bash
npm run test
```

### Type Check

```bash
npm run type-check
```

### Lint Code

```bash
npm run lint
```

## Root Scripts

- `npm run dev` - starts server and client together
- `npm run dev:server` - starts only the server workspace
- `npm run dev:client` - starts only the client workspace
- `npm run build` - builds shared, server, then client

## Troubleshooting

### "No browser executable found" Error

Set `PUPPETEER_EXECUTABLE_PATH` to your Chrome/Edge location:

**Windows:**
```env
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

**macOS:**
```env
PUPPETEER_EXECUTABLE_PATH=/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
```

**Linux:**
```env
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

### MongoDB Connection Failed

- Ensure MongoDB is running (`mongod`)
- Check `MONGODB_URI` in `.env`
- For Atlas, use connection string: `mongodb+srv://user:password@cluster.mongodb.net/srms`

### CORS Errors

Verify `CLIENT_URL` in server `.env` matches your client's origin (default: `http://localhost:5173`)

### Port Already in Use

- Server: Change `PORT` in `.env`
- Client: Use `npm run dev --workspace=apps/client -- --port 3000`

## Documentation

See `/docs/` folder for:
- [Architecture](docs/Architecture.md)
- [API Documentation](docs/API.md)
- [Data Model](docs/DataModel.md)
- [Implementation Plan](docs/Implementation-Plan.md)

## License

Proprietary — EduNexus Project
