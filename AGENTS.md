# AGENTS.md - Development Guidelines for The Islamic Guidance Station

## Build/Lint/Test Commands

### Backend (Python/FastAPI)

- **Install**: `make install-backend` or `cd backend && pip install -r requirements.txt`
- **Dev server**: `make dev-backend` or `cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- **Test**: `make test-backend` or `cd backend && pytest tests/ -v`
- **Single test**: `cd backend && pytest tests/test_specific.py::test_function -v`
- **Lint**: `cd backend && flake8 app/ tests/`
- **Format**: `cd backend && black app/ tests/ && isort app/ tests/`

### Frontend (Astro/React)

- **Install**: `make install-frontend` or `npm install`
- **Dev server**: `make dev-frontend` or `npm run dev`
- **Build**: `make build-frontend` or `npm run build`
- **Test**: `make test-frontend` or `npm run test`
- **Lint**: `npm run lint`
- **Format**: `npm run format`

### All Commands

- **All tests**: `make test`
- **All lint**: `make lint`
- **All format**: `make format`
- **Full dev**: `make dev` (runs both frontend and backend)

## Code Style Guidelines

### Python (Backend)

- **Imports**: Use `from .module import function` for relative imports, standard library first
- **Formatting**: Black with 88-character line length, isort for import sorting
- **Types**: Use type hints (`dict[str, Any]`, `async def`, `Optional[T]`)
- **Naming**: snake_case for variables/functions, PascalCase for classes
- **Error handling**: Use try/except with specific exceptions, HTTPException for API errors
- **Docstrings**: Triple quotes with description, params, returns

### JavaScript/React (Frontend)

- **Imports**: React hooks first, then local imports, then third-party
- **Components**: PascalCase for components, camelCase for variables/functions
- **State**: Use useState for local state, proper loading/error states
- **Error handling**: try/catch with user-friendly error messages
- **Styling**: Tailwind CSS classes, DaisyUI components
- **Files**: .jsx for React components, .astro for pages/layouts

### General

- **Database**: Use async/await with `execute_query`, `execute_query_single`
- **API routes**: Follow FastAPI patterns with proper HTTP status codes
- **Environment**: Use .env files, never commit secrets
- **Git**: Commit messages should be concise and describe the "why"
