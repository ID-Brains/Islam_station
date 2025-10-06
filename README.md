# Islam_station

The Islamic Guidance Station is a comprehensive, modern web application designed to serve as a unified digital companion for the daily spiritual needs of the Muslim community. This innovative platform seamlessly integrates three essential Islamic services into one cohesive, user-friendly experience.

## Project Structure

```
Islam_station/
├── backend/                          # FastAPI backend application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app instance
│   │   ├── config.py                 # Application settings
│   │   ├── database.py               # Database connection pool
│   │   ├── schemas/                  # Database schema loading
│   │   │   ├── __init__.py
│   │   │   ├── schema_loader.py      # Load DB engineer's schema
│   │   │   └── schema.sql            # Schema file from DB engineer
│   │   ├── queries/                  # Optimized queries from DB engineer
│   │   │   ├── __init__.py
│   │   │   ├── quran_queries.py      # Quran query management
│   │   │   ├── prayer_queries.py     # Prayer time queries
│   │   │   ├── mosque_queries.py     # Mosque queries
│   │   │   └── dhikr_queries.py      # Dhikr/Dua queries
│   │   ├── routers/                  # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── quran.py              # Quran API routes
│   │   │   ├── prayer.py             # Prayer API routes
│   │   │   ├── mosque.py             # Mosque API routes
│   │   │   └── dhikr.py              # Dhikr API routes
│   │   ├── services/                 # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── quran_service.py
│   │   │   ├── prayer_service.py
│   │   │   └── data_ingestion.py
│   │   ├── dependencies/             # Middleware and dependencies
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   └── rate_limit.py
│   │   └── utils/                    # Helper utilities
│   │       ├── __init__.py
│   │       └── helpers.py
│   └── tests/                        # Backend tests
│       ├── __init__.py
│       ├── test_quran.py
│       └── test_prayer.py
├── frontend/                         # Astro.js frontend application
│   ├── public/                       # Static assets
│   │   ├── favicon.ico
│   │   └── images/
│   ├── src/
│   │   ├── components/               # Reusable components
│   │   │   ├── QuranSearch.astro
│   │   │   ├── PrayerTimes.astro
│   │   │   ├── DhikrCounter.astro
│   │   │   └── ui/                   # UI components
│   │   ├── layouts/                  # Page layouts
│   │   │   ├── BaseLayout.astro
│   │   │   └── QuranLayout.astro
│   │   ├── pages/                    # Astro pages/routes
│   │   │   ├── index.astro
│   │   │   ├── quran/
│   │   │   │   ├── index.astro
│   │   │   │   └── [surah].astro
│   │   │   └── api/                  # API routes (if needed)
│   │   ├── styles/                   # Global styles
│   │   │   └── global.css
│   │   └── lib/                      # Utilities
│   │       ├── api.ts
│   │       └── types.ts
│   ├── astro.config.mjs
│   ├── tailwind.config.js
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.js
├── database/                         # Database schema and queries
│   ├── schema/                       # DB engineer's optimized schema
│   │   ├── tables.sql
│   │   ├── indexes.sql
│   │   ├── functions.sql
│   │   └── init.sql
│   ├── queries/                      # Pre-optimized query files
│   │   ├── quran/
│   │   │   ├── search.sql
│   │   │   ├── get_surah.sql
│   │   │   └── full_text_search.sql
│   │   ├── prayer/
│   │   │   ├── get_times.sql
│   │   │   └── update_cache.sql
│   │   ├── mosque/
│   │   │   ├── nearby_search.sql
│   │   │   └── spatial_queries.sql
│   │   └── dhikr/
│   │       ├── daily_random.sql
│   │       └── category_filter.sql
│   ├── migrations/                   # Schema evolution scripts
│   └── scripts/                      # Data population scripts
│       ├── populate_quran.py
│       ├── populate_prayer.py
│       └── validate_data.py
├── scripts/                          # Utility scripts
│   ├── data_ingestion/
│   │   ├── quran_scraper.py
│   │   ├── prayer_updater.py
│   │   └── mosque_importer.py
│   └── utils/
│       ├── backup.py
│       └── monitor.py
├── tests/                            # Test suites
│   ├── backend/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── frontend/
│   │   ├── unit/
│   │   └── e2e/
│   └── shared/
│       └── fixtures/
├── docker/                           # Containerization
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   ├── nginx.conf
│   └── docker-compose.yml
├── docs/                             # Documentation
│   ├── base.md                       # Project plan
│   ├── research.md                   # Data sources research
│   └── api.md                        # API documentation
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .gitignore
├── README.md                         # This file
├── requirements.txt                  # Python dependencies
├── package.json                      # Node.js dependencies
├── docker-compose.yml                # Development environment
├── Makefile                          # Common commands
└── pyproject.toml                    # Python project config
```

### Architecture Overview

- **Backend**: FastAPI with raw SQL queries for maximum performance
- **Frontend**: Astro.js with React islands for interactive components
- **Database**: PostgreSQL with PostGIS for spatial mosque queries
- **Caching**: Redis for prayer times and search results
- **Deployment**: Docker containers with nginx reverse proxy

### Development Setup

1. Clone the repository
2. Set up Python environment: `uv sync`
3. Set up Node.js environment: `npm install`
4. Start database: `docker-compose up -d db redis`
5. Run backend: `uv run uvicorn backend.app.main:app --reload`
6. Run frontend: `npm run dev`
7. Access at http://localhost:4321

For detailed setup instructions, see individual component READMEs.
