#!/bin/bash
cd "/media/hackerhalt/5FC99AF54C6CA6002/Web Application Lab"
source .venv/bin/activate

echo "Starting OWASP Web Application Lab..."
echo "Waiting for server to start..."

# Open the browser in the background after 2 seconds
(sleep 2 && xdg-open http://127.0.0.1:5000) &

# Start the Flask app
python3 app.py
