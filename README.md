# Simple Interview

A full-stack interview management platform built with Next.js, React, Tailwind CSS, and a Neon serverless Postgres database. Simple Interview lets hiring teams design rich interview experiences, invite candidates securely, and review deep analytics on every response.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running Locally](#running-locally)
  - [Available Scripts](#available-scripts)
- [Sample Accounts](#sample-accounts)
- [Email & File Storage Integrations](#email--file-storage-integrations)
- [Deployment Notes](#deployment-notes)
- [Project Structure](#project-structure)
- [Roadmap & TODOs](#roadmap--todos)

## Overview
Simple Interview combines a modern admin workspace with a guided candidate experience. Recruiters can author interviews that mix multiple question formats (text, coding, video, file upload, and multiple choice), distribute them through secure tokens or email invitations, and review session-by-session analytics such as completion times, keystroke metrics, and attachment downloads.

The application ships with a seeded demo organization, users, interviews, and questions so you can explore the product immediately after connecting your Neon database.

## Features
### Interview authoring & management
- Create and edit interviews with question-level settings, custom instructions, and thank-you messaging.
- Support for text prompts, coding exercises, multiple choice questions with answer keys, video responses, and file uploads.
- Manage interview lifecycle states (draft, active, completed) and remove interviews that are no longer needed.

### Candidate experience
- Candidate-specific login with device setup guidance before entering an interview.
- Timed question navigation, with responses saved as candidates progress through the assessment, plus support for recording video answers in the browser.
- Secure one-time access tokens that can be shared via direct links or emailed invitations.

### Analytics & reporting
- Real-time dashboards highlighting response counts, completion rates, average times, and abandonment metrics.
- Detailed session drill-downs with keystroke analysis (total keystrokes, typing speed, paste events, backspace ratio, focus changes) and attachment previews.
- CSV export of interview sessions for offline reporting or archiving.

### Sharing & collaboration
- Built-in email invitations powered by Resend with customizable content.
- Shareable access links that automatically respect the configured application URL for local and deployed environments.
- Admin user management tools to review and maintain your organization’s staff.

### Storage & uploads
- Video answers and uploaded files are streamed to Vercel Blob storage with public read access for review.
- File metadata (size, MIME type, storage path, provider) is persisted alongside candidate responses for auditability.

## Tech Stack
- **Framework:** Next.js 15 (App Router) with React 19 and TypeScript
- **Styling:** Tailwind CSS, shadcn/ui, Radix UI primitives, and Lucide icons
- **Database:** Neon serverless Postgres accessed through the `@neondatabase/serverless` driver
- **Storage:** Vercel Blob for large video and file uploads
- **Email:** Resend transactional email API for invitation delivery
- **Tooling:** pnpm, ESLint, TypeScript, and Vercel deployment automation

## Screenshots
> Replace the placeholder images below with fresh captures from your deployment.

![Admin dashboard placeholder](public/admin-dashboard.png)
![Admin create interview](public/create_interview.png)

## Getting Started
### Prerequisites
- Node.js 18.18+ (required by Next.js 15)
- pnpm 9+ (recommended) or npm 10+
- Accounts for Neon (Postgres), Vercel (Blob storage), and Resend (email)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/DenizS4/SimpleInterview.git
   cd simple-interview
   ```
2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```

### Environment Variables
Create a `.env.local` file in the project root and supply the following keys:

| Name | Required | Description |
| --- | :---: | --- |
| `DATABASE_URL` | ✅ | Neon Postgres connection string. Use the pooled connection string (e.g. `postgresql://user:pass@ep-example-pooler.neon.tech/neondb?sslmode=require`). |
| `NEXT_PUBLIC_APP_URL` | ✅ | Base URL used when generating public interview links. Set to `http://localhost:3000` for local development and your Vercel domain in production. |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Vercel Blob read/write token with `blob.write` scope so candidates can upload videos and files. Generate this from the Vercel dashboard and keep it secret. |
| `RESEND_API_KEY` | ✅ | Resend API key for sending invitation emails. Make sure the sending domain you use is verified in Resend. |

> **Note:** The email sender address is currently hard-coded as `onboarding@yourdomain.com` inside [`app/api/send-email/route.ts`](app/api/send-email/route.ts). Update this value or refactor it to read from an environment variable that matches your verified Resend domain.

### Database Setup
Simple Interview expects the tables defined in the `scripts` directory. You have two options:

1. **Automatic bootstrapping:** The application runs an initialization routine on demand that will create core tables and seed demo content if they are missing. This happens the first time you load the admin dashboard.
2. **Manual SQL scripts (recommended for production):**
   ```bash
   # Create tables
   psql "$DATABASE_URL" -f scripts/01-create-tables.sql

   # Seed demo organization, users, interview, and questions
   psql "$DATABASE_URL" -f scripts/02-seed-sample-data.sql

   # Additional maintenance scripts live in scripts/03-*.sql if you need them.
   ```

### Running Locally
Start the development server:
```bash
pnpm dev
# or
npm run dev
```
Visit [`http://localhost:3000`](http://localhost:3000) and log in with the demo credentials listed below. The development server automatically reloads when you edit files.

### Available Scripts
- `pnpm dev` – run the Next.js development server
- `pnpm build` – create an optimized production build
- `pnpm start` – run the production server (after `pnpm build`)
- `pnpm lint` – lint the project with ESLint

## Sample Accounts
The seed data provisions the following demo users:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `admin123` |
| Candidate | `candidate@example.com` | `admin123` |

Update or remove these accounts once you connect a production database.

## Email & File Storage Integrations
- **Resend:** Verify your sending domain, update the `from` email address, and optionally customize the email template returned by the `/api/send-email` route.
- **Vercel Blob:** Upload tokens grant public read access by default. Review retention policies and switch to private buckets if required for compliance.
- **Share Links:** The share page uses `NEXT_PUBLIC_APP_URL` to build invite URLs. Double-check this value after deploying to Vercel so candidates receive valid links.

## Deployment Notes
- The application is optimized for Vercel. Configure the same environment variables (`DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`) in your Vercel project settings.
- Ensure your Neon database allows connections from Vercel. Use the pooled connection string for best cold-start performance.
- If you plan to stream large videos, monitor Vercel Blob storage quotas and upgrade plans as needed.

## Project Structure
```
app/                # App Router routes for admin, interviews, and APIs
components/         # Reusable UI primitives (buttons, forms, charts)
hooks/              # Client-side hooks for timers, tracking, and state
lib/                # Database access, blob utilities, helpers, analytics
scripts/            # SQL migrations and seed data for Neon/Postgres
styles/             # Tailwind base styles and theme configuration
