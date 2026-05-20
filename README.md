# EduNexus - School Report Management System (SRMS)

A comprehensive, full-stack application for managing student reports, subject marks, school branding, and generating dynamic, print-ready PDF report cards. EduNexus is designed to support both standard grading systems and component-based evaluations for lower classes.

## Project Structure

```
res-try/
├── apps/
│   ├── client/          # React + Vite frontend (TailwindCSS, React Router)
│   ├── server/          # Node.js + Express backend (Mongoose, Puppeteer)
├── packages/
│   ├── shared/          # Shared TypeScript utilities & types across workspaces
├── docs/                # Architecture, API, and Database documentation
├── .github/workflows/   # Automated CI/CD pipelines
```

## Key Features

### 🎓 Dual-Tier Evaluation System
- **Standard Classes (e.g., 1st - 12th)**: Supports traditional Term 1 & Term 2 structures (Periodic Test, Notebook, Subject Enrichment, Half-Yearly/Yearly Exams). Includes Co-Scholastic grading.
- **Lower Classes (e.g., NC, LKG, UKG)**: Fully dynamic, component-based subject evaluations (e.g., Oral, Written, Recitation) seamlessly integrated into a vibrant, colorful report card layout tailored for early education.

### 📝 Comprehensive Marks Entry
- Dedicated workflows for entering Scholastic, Co-Scholastic, and Term Remarks (including Attendance and Result status).
- Intuitive, auto-saving data grids.
- Role-based separation: Admins configure the system, while Teachers use a streamlined portal to input marks.

### 🖨️ Print-Ready PDF Generation
- Pixel-perfect, automated PDF report card generation utilizing `puppeteer`.
- Polished, responsive templates engineered for single-page A4 printing.
- Dynamic branding including school logo and authorized signature overlays.

### 🚀 Automated CI/CD & Deployment
- Built-in GitHub Actions pipeline (`auto-deploy.yml`).
- Automatically triggers production builds, runs strict TypeScript validation, deploys the frontend to Vercel, triggers Render for the backend, and creates automated GitHub Releases with generated release notes.

## Prerequisites

- **Node.js** (v20+ recommended)
- **npm** (v9+)
- **MongoDB** (Local instance or MongoDB Atlas)
- **Google Chrome / Chromium** (Required by Puppeteer for PDF generation)

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

**Server (`apps/server/.env`):**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/srms
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
CLIENT_URL=http://localhost:5173
SCHOOL_NAME="Your School Name"
ACADEMIC_SESSION="2026-27"
```

**Client (`apps/client/.env`) - Optional if running on non-standard port:**
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Database Seeding
Quickly populate your local MongoDB with demo data (classes, students, teachers, marks):
```bash
npm run seed --workspace=apps/server
```

## Running Locally

Run both the server and client concurrently from the root directory:
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

*(Alternatively, run `npm run dev:server` and `npm run dev:client` in separate terminals).*

## Building for Production

Compile TypeScript and build the production bundles:
```bash
npm run build
```
This triggers the root build script which progressively builds the `shared` package, compiles the `server`, copies EJS templates, and bundles the Vite `client`.

## Deployment Architecture

EduNexus is configured for a decoupled, modern cloud deployment:
- **Frontend**: Deployed via **Vercel**
- **Backend API**: Deployed via **Render** (Must utilize a Docker environment or a native runtime that supports Chromium installation for PDF generation).
- **Database**: **MongoDB Atlas**
- **Pipeline**: **GitHub Actions** handles continuous deployment on push to the `main` branch. 

*Ensure `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and `RENDER_API_KEY` are configured in your GitHub Repository Secrets to enable the CI/CD pipeline.*

## Troubleshooting

- **PDF Generation Fails / 500 Error**: Ensure `PUPPETEER_EXECUTABLE_PATH` is pointing to a valid Chrome/Chromium executable on your system. 
  - *Windows*: `C:\Program Files\Google\Chrome\Application\chrome.exe`
  - *Mac*: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
  - *Linux*: `/usr/bin/google-chrome`
- **HTTP 403 on GitHub Actions**: Ensure your repository settings allow `GITHUB_TOKEN` to possess **Read and Write permissions** (required for creating automated releases).

## Documentation

For deep dives into the technical stack, review the `/docs/` directory:
- [Architecture Diagram & Concepts](docs/Architecture.md)
- [API Route Specifications](docs/API.md)
- [Database Data Models](docs/DataModel.md)

## License
Proprietary — EduNexus Project
