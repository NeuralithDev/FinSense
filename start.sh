#!/bin/bash
# ==============================================================================
# FinSense One-Click Quick Launcher for Presentations
# Starts both FastAPI Backend (port 8000) and Vite React Frontend (port 5173)
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Ensure common binary paths are in PATH
export PATH="/opt/anaconda3/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
export PYTHONPATH="$PROJECT_DIR"

echo "⚡ Starting FinSense..."

# 1. Cleanly terminate any processes occupying port 8000 or 5173
for p in $(lsof -ti:8000 2>/dev/null); do kill -9 $p 2>/dev/null; done
for p in $(lsof -ti:5173 2>/dev/null); do kill -9 $p 2>/dev/null; done
sleep 0.5

# 2. Locate Anaconda Python binary
if [ -x "/opt/anaconda3/bin/python" ]; then
    PYTHON_BIN="/opt/anaconda3/bin/python"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="$(command -v python3)"
else
    echo "❌ Error: Python 3 not found. Please ensure Anaconda or Python is installed."
    exit 1
fi

# 3. Locate NPM binary
if [ -x "/opt/homebrew/bin/npm" ]; then
    NPM_BIN="/opt/homebrew/bin/npm"
elif command -v npm >/dev/null 2>&1; then
    NPM_BIN="$(command -v npm)"
else
    echo "❌ Error: npm not found. Please ensure Node.js is installed."
    exit 1
fi

echo "🔹 Using Python: $PYTHON_BIN"
echo "🔹 Using NPM:    $NPM_BIN"

# 4. Start FastAPI Backend in background
$PYTHON_BIN -B app/main.py > /dev/null 2>&1 &
BACKEND_PID=$!

# 5. Start React Vite Frontend in background
cd "$PROJECT_DIR/app/frontend"
$NPM_BIN run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
cd "$PROJECT_DIR"

# Cleanup on exit
trap "echo ''; echo '🛑 Shutting down FinSense...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; for p in $(lsof -ti:8000 2>/dev/null); do kill -9 $p 2>/dev/null; done; for p in $(lsof -ti:5173 2>/dev/null); do kill -9 $p 2>/dev/null; done; exit 0" SIGINT SIGTERM

echo "⏳ Waiting for servers to initialize..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:8000/ >/dev/null 2>&1 && curl -s http://127.0.0.1:5173/ >/dev/null 2>&1; then
        break
    fi
    sleep 0.5
done

echo ""
echo "=================================================="
echo "🚀 FinSense is LIVE & READY FOR PRESENTATION!"
echo "👉 App Dashboard: http://localhost:5173"
echo "👉 API Docs:      http://localhost:8000/docs"
echo "=================================================="
echo "Press Ctrl+C to stop both servers."
echo ""

# Automatically open in browser on macOS
if command -v open >/dev/null 2>&1; then
    open "http://localhost:5173" 2>/dev/null
fi

wait
