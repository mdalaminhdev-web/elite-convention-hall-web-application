# Elite Convention Hall — Web Application

A web application for Elite Convention Hall featuring a public-facing website, an administrative content management system (CMS), a REST API, and a MySQL database.

The application allows visitors to explore venue information, browse gallery albums, review facilities and vendors, view the inquiry calendar, and submit event inquiries. Administrators can manage website content and review submitted inquiries through the admin dashboard.

## Live Demo

**Live Website:** https://elite-convention-hall-web-applicati-gamma.vercel.app/

The deployed website provides a preview of the Elite Convention Hall public-facing web application.

For local development, setup instructions, database configuration, and testing procedures, refer to the sections below.

## Project Structure

```text
frontend/
├── public-website/       # Public-facing website
└── admin-dashboard/      # Admin dashboard and CMS

backend/                  # Node.js and Express REST API

database/
├── migrations/           # Database migration scripts
├── Elite_Convention_Hall_Full_Initial_MySQL_Setup.sql
├── ERD.mmd               # Database relationship diagram
├── DATABASE_DESIGN.md    # Database structure and field reference
├── verify_installation.sql
└── calendar_option_a_test.sql

backend/tests/            # API and integration tests
e2e/                      # Browser end-to-end tests

docs/
├── requirements/         # Approved project requirements
├── phase_history/        # Development documentation
└── PHASE*_ACCEPTANCE*.md # Phase acceptance checklists

playwright.config.mjs
```

## Technology Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express
- **Database:** MySQL 8.0.16 or later
- **Testing:** API tests, integration tests, Playwright
- **Development environment:** Windows, VS Code, MySQL Workbench

## Application Features

### Public Website

The website includes the following sections:

- Homepage and venue introduction
- Gallery albums, album details, and image lightbox
- Event inquiry form
- Inquiry calendar
- Venue facilities
- Event service vendors
- Client reviews
- Frequently asked questions
- Contact information
- Footer and branding content

### Admin Dashboard

The protected administration panel provides tools to manage:

- Dashboard overview
- Event inquiries
- Calendar inquiry counts
- Gallery albums and images
- Facilities
- Vendors
- Client reviews
- FAQs
- Contact information
- Homepage hero and About sections
- Footer content
- Website branding

### Event Inquiry Calendar

The calendar supports three display modes:

- **MANUAL:** Displays manually entered counts. Dates without a count record remain blank, while an explicitly entered zero is displayed as `0`.
- **REAL:** Displays counts derived from submitted inquiry records.
- **HIDDEN:** Hides inquiry counts.

Submitting an inquiry does not create a booking, reserve a date, or block the venue calendar. The application does not include confirmed booking management or payment processing.

## Requirements

Install the following software before starting development:

- Node.js `>=22.12`
- npm `>=10`
- MySQL `>=8.0.16`
- MySQL Workbench

MySQL 8.4 LTS is recommended for a new installation.

## Installation and Setup

### 1. Set Up the Database

1. Start MySQL and open MySQL Workbench.
2. Connect using a database account with permission to create the required database.
3. Open `database/Elite_Convention_Hall_Full_Initial_MySQL_Setup.sql`.
4. Execute the script against a new database installation.
5. Run `database/verify_installation.sql` to verify the schema.

The expected installation contains migration records `000` through `010`, 25 application tables, and one migration tracking table.

**Important:** The initial setup script is intended for a new database named `elite_convention_hall`. Do not run it over an existing populated database without first reviewing the script and creating a verified backup.

The SQL setup creates the database structure and initial settings. It does not restore existing customer records, submitted inquiries, uploaded media, or administrator accounts.

For security, create a dedicated MySQL account for the application and grant only the privileges it requires.

### 2. Install Dependencies

Open PowerShell in the project root directory and run:

```powershell
npm install
```

Create the backend environment file:

```powershell
Copy-Item backend/.env.example backend/.env
```

Open `backend/.env` and configure the following variables:

```dotenv
DB_HOST=
DB_PORT=
DB_NAME=elite_convention_hall
DB_USER=
DB_PASSWORD=
ADMIN_ALLOWED_ORIGINS=
SESSION_SECRET=
```

Use the actual values for your local environment. Generate a secure session secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copy the generated value into `SESSION_SECRET`.

Keep `.env` out of version control. Do not share database credentials or session secrets.

### 3. Verify the Database and Create an Administrator

Run these commands from the project root:

```powershell
npm run db:check
npm run admin:create
```

Follow the interactive prompts to create the initial administrator account. Choose a strong password.

### 4. Start the Applications

Run each command in a separate PowerShell terminal from the project root.

**Terminal 1 — Backend API**

```powershell
npm run dev:api
```

**Terminal 2 — Public Website**

```powershell
npm run dev:public
```

**Terminal 3 — Admin Dashboard**

```powershell
npm run dev:admin
```

Once the services are running, open the relevant local URLs.

| Service | Local URL |
|---|---|
| Public website | http://127.0.0.1:5173/ |
| Gallery | http://127.0.0.1:5173/gallery |
| Event inquiry | http://127.0.0.1:5173/inquiry |
| Admin login | http://127.0.0.1:5174/login |
| API health check | http://127.0.0.1:4000/api/v1/health |

## Testing and Verification

Run the available checks from the project root:

```powershell
npm run check:contracts
npm run check:api-syntax
npm run test:api
npm run test:integration
npm run build
npm run db:check
```

Install the Playwright Chromium browser if it is not already available:

```powershell
npx playwright install chromium
```

Then run the end-to-end tests:

```powershell
npm run test:e2e
```

The current browser tests use mock API fixtures. A successful browser test run alone does not verify database transactions, production API behavior, or real media uploads. Those areas require testing against a correctly configured environment.

Refer to `docs/PHASE12_ACCEPTANCE.md` for the current acceptance criteria and outstanding verification requirements.

## Database Documentation

The `database/` directory contains the initial schema, ordered migrations, installation verification scripts, calendar-specific tests, an entity relationship diagram, and a database design reference.

For further details, review:

- `database/README.md`
- `database/DATABASE_DESIGN.md`
- `database/ERD.mmd`
- `database/verify_installation.sql`

## Project Scope

This repository covers the public website, administrative CMS, backend API, and supporting database structure for the approved Elite Convention Hall website project.

The application is designed for venue presentation and event inquiry collection. It is not a separate internal operations or venue management platform.

The following are outside the current scope:

- Confirmed booking and reservation management
- Payment processing
- Payroll and employee management
- Petty cash and hall cash management
- A separate CRM application

## Current Development Status

The source code includes development work through Phase 12. This does not mean that all acceptance tests have passed or that the application is ready for production deployment.

The following work remains to be completed or verified:

- Full dependency installation and production builds
- Integration testing against a configured MySQL database
- Live API and database transaction verification
- End-to-end browser testing
- Real image and media upload verification
- Security, SEO, and performance hardening
- Deployment and final handover

These remaining items correspond to the planned work for Phases 13–15.

Temporary preview images and reference assets should be replaced with approved venue photography and branding before release. No fictitious customer reviews, vendors, inquiries, or customer records should be used as real production content.

## Deployment and Handover Notes

The repository does not include installed npm dependencies, environment secrets, live uploaded media, or existing production database records.

Before migrating from another project copy:

1. Back up the existing database.
2. Preserve the current environment configuration.
3. Keep uploaded media and related files intact.
4. Verify the database migrations and application configuration.
5. Run the required tests before deployment.

Do not overwrite a populated database with the initial setup script.

For phase-specific implementation details, review the relevant acceptance checklist and the documentation under `docs/phase_history/`.
