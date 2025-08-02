#!/bin/bash

# Define the script names
SCRIPT="webhook.py"

# Kill any existing processes
pkill -f "$SCRIPT"

# Short pause
sleep 2

# Start bots in background with separate logs
nohup python3 "./$SCRIPT" >> logs/webhook.log 2>&1

echo "Server started and running in background."
