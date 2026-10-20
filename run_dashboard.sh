#!/bin/bash
# FinSense Frontend Dashboard Launcher
cd "$(dirname "$0")/app/frontend"
echo "✨ Starting FinSense Cockpit UI on http://localhost:5173 ..."
npm run dev
