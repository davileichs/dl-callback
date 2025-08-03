#!/bin/bash

SCRIPT="webhook.py"

start_webhook() {
    echo "Starting webhook server..."
    pkill -f "$SCRIPT"
    
    sleep 2

    nohup python3 "./$SCRIPT" >> logs/server.log 2>&1
    
    echo "Server started and running in background."
}

restart_webhook() {
    echo "Restarting webhook Docker container..."
    
    docker-compose restart
    
    echo "Docker container restarted successfully."
}

if [ "$1" = "restart" ]; then
    restart_webhook
else
    start_webhook
fi
