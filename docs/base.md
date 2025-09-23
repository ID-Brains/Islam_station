# Project Plan: The Islamic Guidance Station

## A Unified Web Application

**The Development Team:**
Khaled Alam (Backend Engineer , project lead)
Youssef Iskandron (Database Engineer)
Gassor (Frontend Developer , ui/ux designer)
September 22, 2025

## Contents

1. [Project Vision & Executive Summary](#1-project-vision--executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [MVP Development Plan](#3-mvp-development-plan)
   - 3.1 [Phase 1 (Core MVP): The Quranic Verse Explorer](#31-phase-1-core-mvp-the-quranic-verse-explorer)
   - 3.2 [Phase 2: MasjidConnect Integration](#32-phase-2-masjidconnect-integration)
   - 3.3 [Phase 3: Daily Dhikr & Dua Companion](#33-phase-3-daily-dhikr--dua-companion)

---

## 1. Project Vision & Executive Summary

The Islamic Guidance Hub is a comprehensive, modern web application designed to serve the daily spiritual needs of the Muslim community. This project merges three core functionalities into a single, seamless platform: a powerful Quranic search engine, localized mosque prayer times and events, and a personal daily dhikr and dua companion.

Our goal is to build a high-performance, user-friendly application that showcases our team's capabilities in backend development with FastAPI, database engineering with PostgreSQL, and frontend development with Astro.js. This document outlines the development plan, technology stack, and division of responsibilities for a 1-2 week MVP build, incorporating UI/UX prototyping and data validation phases.

## 2. Technology Stack

### Backend

- **Framework:** FastAPI
- **Server:** Uvicorn with Gunicorn for production
- **Data Validation:** Pydantic v2
- **ORM/Database:** SQLAlchemy 2.0, Alembic (migrations), psycopg2-binary
- **API Calls:** httpx, aiohttp
- **Caching:** Redis with aioredis
- **Configuration:** python-decouple, pydantic-settings
- **Logging:** structlog, python-json-logger
- **Testing:** pytest, pytest-asyncio, httpx (for async testing)
- **CORS:** FastAPI built-in CORSMiddleware
- **Rate Limiting:** slowapi
- **Background Tasks:** Celery with Redis broker

### Database

- **System:** PostgreSQL 15+
- **Extensions:** PostGIS, pg_trgm (trigram matching), unaccent
- **Features:** Full-Text Search, JSONB support, GIN indexes
- **Connection Pooling:** asyncpg, SQLAlchemy connection pooling
- **Migration:** Alembic
- **Monitoring:** pg_stat_statements

### Frontend

- **Framework:** Astro.js 4.0+
- **Styling:** Tailwind CSS, HeadlessUI
- **Interactivity:** Preact or SolidJS (for Astro islands)
- **Icons:** Lucide React, Heroicons
- **Forms:** React Hook Form (in islands)
- **HTTP Client:** Axios, SWR for data fetching
- **State Management:** Zustand (for complex islands)
- **Animations:** Framer Motion, Lottie
- **PWA:** @vite-pwa/astro
- **SEO:** Astro SEO, sitemap generation
- **Development:** TypeScript, ESLint, Prettier
- **Testing:** Vitest, Playwright

### DevOps & Tools (Later stages)

- **Containerization:** Docker, Docker Compose
- **Process Management:** PM2 or systemd
- **Reverse Proxy:** Nginx
- **SSL/TLS:** Let's Encrypt with Certbot
- **Monitoring:** Sentry (error tracking), Prometheus + Grafana
- **Environment:** Poetry (Python dependencies), pnpm (Node.js)
- **Git Hooks:** pre-commit, husky
- **API Documentation:** FastAPI automatic OpenAPI/Swagger

### External APIs

- **Prayer Times:** Al Adhan API, IslamicFinder API
- **Geolocation:** OpenStreetMap Nominatim, ipapi
- **Maps:** Leaflet with OpenStreetMap tiles
- **Push Notifications:** Web Push API, FCM

## 3. MVP Development Plan

The project will be developed in five phases over 1-2 weeks, incorporating UI/UX prototyping and data validation upfront, with prioritized core features to ensure a functional MVP. Non-core features (e.g., audio players, push notifications) are deferred to post-MVP iterations.

### 3.1 Phase 0: Planning, Prototyping & Data Validation (1-2 days)

**Goal:** Establish solid foundations with validated data and user-centered design.

**UI/UX Designer "Gassor":**

- Create wireframes and mockups for the Quran search interface, prayer times widget, and dhikr/dua components.
- Design responsive layouts with proper Arabic typography (Uthmani script) and accessibility considerations.
- Prototype user flows for search, results display, and daily spiritual content.

**Database Engineer "Youssef Iskandron":**

- Implement data validation processes for Islamic content authenticity.
- Review and validate Quran, dhikr, and dua data sources with scholarly input.
- Set up initial database schema and migration scripts.

**Backend Engineer "Khaled Alam":**

- Assist with data validation scripting and API integration testing.
- Set up basic project structure and environment.
- Prayer and adhan implmentation

### 3.2 Phase 1 (Core MVP): The Quranic Verse Explorer (3-4 days)

**Goal:** To build a robust and fast search engine for the Holy Quran (prioritizing core search and display functionality).

**Backend Engineer "Khaled Alam":**

- Design and implement a REST API endpoint (e.g., `/api/quran/search?q=...`) that accepts a search query.
- Write the business logic to query the database using the search term and return a structured JSON response containing the matching verses, Surah names, verse numbers, and translations.
- Implement an endpoint to fetch a full Surah (e.g., `/api/quran/surah/2`).
- Ensure proper error handling and input validation.
- Implement rate limiting to prevent abuse.
- Set up logging for monitoring search queries and performance.
- Write unit and integration tests for the API endpoints.

**Database Engineer "Youssef Iskandron":**

- Design a schema to store the entire Quranic text, verse by verse, including Arabic, transliteration, and at least one English translation.
- Structure tables to link verses to their respective Surahs.
- Implement and configure PostgreSQL's Full-Text Search capabilities on the translation and transliteration fields to enable efficient keyword searching.
- Write scripts to populate the database with the required data (using validated sources from Phase 0).

**Frontend Developer "Gassor":**

- Build a clean and intuitive user interface with a prominent search bar based on Phase 0 prototypes.
- Develop the search results page to beautifully display the Arabic text alongside its translation, clearly highlighting the Surah and verse number.
- Utilize Astro's static site generation (SSG) for pages displaying full Surahs for maximum performance and SEO benefits.
- Implement client-side fetching of search results using Axios or SWR.
- Create a Quran rendering component with proper typography for Arabic text (Uthmani).
- Ensure the design is responsive and accessible.

### 3.3 Phase 2: MasjidConnect Integration (2-3 days)

**Goal:** To integrate local prayer times and mosque information, starting with Kafr El-Sheikh.

**Backend Engineer "Khaled Alam":**

- Integrate with a public prayer time API (e.g., Al Adhan API) to fetch daily prayer times based on city/coordinates.
- Create a new API endpoint (e.g., `/api/prayertimes?city=KafrElSheikh`) to serve this data.
- Implement a caching mechanism to avoid hitting the external API on every request, improving speed and reliability.

**Database Engineer "Youssef Iskandron":**

- Extend the database schema with a 'mosques' table, including fields for name, address, and a 'geography' type column using PostGIS for location data.
- (Optional Challenge) Design a simple 'events' table linked to the 'mosques' table.

**Frontend Developer "Gassor":**

- Design and build a new section or widget on the homepage to display the daily prayer times for the user's location, based on Phase 0 prototypes.
- Make this component dynamic, fetching data from the backend API on the client-side.

### 3.4 Phase 3: Daily Dhikr & Dua Companion (2 days)

**Goal:** To add an interactive, personal tool for daily spiritual remembrance.

**Backend Engineer "Khaled Alam":**

- Create API endpoints to serve a "Dua of the Day" and a "Dhikr of the Day" (e.g., `/api/daily/dhikr`). The logic can be as simple as returning a random entry or one based on the date.

**Database Engineer "Youssef Iskandron":**

- Design and populate tables for 'duas' and 'dhikr', including the text (Arabic/translation) and possibly categories (using validated data from Phase 0).

**Frontend Developer "Gassor":**

- Build a new interactive component to display the daily spiritual content, based on Phase 0 prototypes.
- Implement a digital "Tasbeeh" counter using an Astro island for client-side interactivity.
- Use browser localStorage to save the user's count and streak, providing a persistent experience without requiring user accounts for the MVP.

### 3.5 Phase 4: Testing, Integration & Refinement (1-2 days)

**Goal:** Ensure quality and polish for MVP launch.

**Backend Engineer "Khaled Alam":**

- Conduct integration testing across all phases.
- Fix bugs and optimize backend performance.

**Database Engineer "Youssef Iskandron":**

- Validate data integrity and performance.
- Assist with deployment preparation.

**Frontend Developer "Gassor":**

- Perform user acceptance testing with sample users.
- Refine UI/UX based on feedback.
- Implement PWA features using @vite-pwa/astro for offline functionality and app-like experience.
- Prepare deployment and documentation.
