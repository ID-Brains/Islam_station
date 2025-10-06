#!/bin/bash

# Bash script to run both backend and frontend for The Islamic Guidance Station

# Kill any existing processes on the ports
echo "Killing any existing processes on ports 8000 and 4321..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:4321 | xargs kill -9 2>/dev/null || true
sleep 1

# Function to cleanup background processes on exit
cleanup() {
    echo "Stopping servers..."
    kill 0
}

# Trap SIGINT (Ctrl+C) to cleanup
trap cleanup SIGINT

# Start the backend server in the background
echo "Starting backend server..."
uv run uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start the frontend development server
echo "Starting frontend development server..."
cd Frontend && npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
