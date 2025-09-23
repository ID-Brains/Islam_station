# Makefile for The Islamic Guidance Station
# Common development commands

.PHONY: help install install-backend install-frontend dev dev-backend dev-frontend build build-frontend test test-backend test-frontend clean lint format docker-up docker-down

# Default target
help:
	@echo "Available commands:"
	@echo "  install         - Install all dependencies"
	@echo "  install-backend - Install Python dependencies"
	@echo "  install-frontend- Install Node.js dependencies"
	@echo "  dev             - Start development servers"
	@echo "  dev-backend     - Start backend dev server"
	@echo "  dev-frontend    - Start frontend dev server"
	@echo "  build           - Build for production"
	@echo "  build-frontend  - Build frontend"
	@echo "  test            - Run all tests"
	@echo "  test-backend    - Run backend tests"
	@echo "  test-frontend   - Run frontend tests"
	@echo "  clean           - Clean build artifacts"
	@echo "  lint            - Run linting"
	@echo "  format          - Format code"
	@echo "  docker-up       - Start Docker services"
	@echo "  docker-down     - Stop Docker services"

# Installation
install: install-backend install-frontend

install-backend:
	cd backend && pip install -r requirements.txt

install-frontend:
	npm install

# Development
dev:
	@echo "Starting development servers..."
	@make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	npm run dev

# Building
build: build-frontend

build-frontend:
	npm run build

# Testing
test: test-backend test-frontend

test-backend:
	cd backend && pytest tests/ -v

test-frontend:
	npm run test

# Code quality
lint:
	cd backend && flake8 app/ tests/
	npm run lint

format:
	cd backend && black app/ tests/ && isort app/ tests/
	npm run format

# Cleanup
clean:
	rm -rf frontend/dist/
	rm -rf backend/__pycache__/
	rm -rf backend/**/*.pyc
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Docker
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

# Database operations
db-init:
	cd backend && python -c "from app.database import create_database_pool; import asyncio; asyncio.run(create_database_pool())"

db-migrate:
	@echo "Run database migrations (implement in alembic)"

# Deployment helpers
deploy-prep: build
	@echo "Frontend built. Ready for deployment."

# Health checks
health-backend:
	curl -f http://localhost:8000/health || echo "Backend not healthy"

health-frontend:
	curl -f http://localhost:4321/ || echo "Frontend not healthy"
