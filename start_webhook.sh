#!/bin/bash

# Define the script names
SCRIPT="webhook.py"

# Function to start the webhook
start_webhook() {
    echo "Starting webhook server..."
    # Kill any existing processes
    pkill -f "$SCRIPT"
    
    # Short pause
    sleep 2
    
    # Start bots in background with separate logs
    nohup python3 "./$SCRIPT" >> logs/server.log 2>&1
    
    echo "Server started and running in background."
}

# Function to restart the webhook
restart_webhook() {
    echo "Restarting webhook Docker container..."
    
    # Restart the Docker container using docker-compose
    docker-compose restart
    
    echo "Docker container restarted successfully."
}

# Check command line arguments
if [ "$1" = "restart" ]; then
    restart_webhook
else
    start_webhook
fi
