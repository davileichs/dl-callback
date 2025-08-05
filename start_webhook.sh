#!/bin/bash

SCRIPT="webhook.py"
LOG_FILE="logs/server.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check if server is running
is_server_running() {
    pgrep -f "$SCRIPT" > /dev/null
}

# Function to stop server
stop_server() {
    print_status "Stopping webhook server..."
    pkill -f "$SCRIPT"
    sleep 2
    
    if is_server_running; then
        print_warning "Server still running, force killing..."
        pkill -9 -f "$SCRIPT"
        sleep 1
    fi
    
    if ! is_server_running; then
        print_status "Server stopped successfully"
    else
        print_error "Failed to stop server"
        return 1
    fi
}

# Function to rotate logs
rotate_logs() {
    print_status "Rotating logs (keeping last 24 hours)..."
    if [ -f "$LOG_FILE" ]; then
        # Get current timestamp
        CURRENT_TIME=$(date +%s)
        TEMP_FILE="logs/server_temp.log"
        
        # Create temporary file with only logs from last 24 hours
        while IFS= read -r line; do
            # Extract timestamp from log line (assuming format: YYYY-MM-DD HH:MM:SS)
            if [[ $line =~ ([0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}) ]]; then
                LOG_TIME=$(date -d "${BASH_REMATCH[1]}" +%s 2>/dev/null)
                if [ $? -eq 0 ] && [ $((CURRENT_TIME - LOG_TIME)) -lt 86400 ]; then
                    echo "$line" >> "$TEMP_FILE"
                fi
            else
                # If no timestamp found, keep the line (could be error messages, etc.)
                echo "$line" >> "$TEMP_FILE"
            fi
        done < "$LOG_FILE"
        
        # Replace original log file with filtered content
        mv "$TEMP_FILE" "$LOG_FILE"
        echo "$(date): Log rotation completed - kept only last 24 hours" >> "$LOG_FILE"
        print_status "Log rotation completed"
    else
        print_warning "Log file not found, creating new one"
        mkdir -p logs
        echo "$(date): Log file created" >> "$LOG_FILE"
    fi
}

# Function to build the app with versioning
build_app() {
    print_status "Building webhook app with versioning..."
    
    # Touch the app.js file to update its modification time
    touch static/js/app.js
    
    # Get the new modification time as version
    VERSION=$(stat -c %Y static/js/app.js)
    print_status "Built version: $VERSION (based on file modification time)"
    
    # Create backup of original app.js
    cp static/js/app.js static/js/app.js.backup.$(date +%Y%m%d_%H%M%S)
    
    print_status "Build complete! Version: $VERSION"
    print_status "The app.js file has been updated and will be served with version parameter: ?v=$VERSION"
    print_status "This ensures browsers will always fetch the latest version."
}

# Function to start server
start_server() {
    print_header "Starting Webhook Server"
    
    # Stop any existing server first
    if is_server_running; then
        print_warning "Server already running, stopping it first..."
        stop_server
    fi
    
    # Ensure logs directory exists
    mkdir -p logs
    
    # Rotate logs before starting
    rotate_logs
    
    # Build the app with versioning
    build_app
    
    # Start the server
    print_status "Starting webhook server..."
    nohup python3 "./$SCRIPT" >> "$LOG_FILE" 2>&1 &
    
    # Wait a moment and check if server started successfully
    sleep 3
    if is_server_running; then
        print_status "Server started successfully and running in background"
        print_status "Log file: $LOG_FILE"
        print_status "To view logs: tail -f $LOG_FILE"
        print_status "To stop server: $0 stop"
    else
        print_error "Failed to start server. Check logs for details."
        return 1
    fi
}

# Function to restart server
restart_server() {
    print_header "Restarting Webhook Server"
    stop_server
    start_server
}

# Function to show server status
show_status() {
    print_header "Server Status"
    if is_server_running; then
        print_status "Server is RUNNING"
        echo "Process ID: $(pgrep -f "$SCRIPT")"
        echo "Log file: $LOG_FILE"
        echo ""
        print_status "Recent log entries:"
        tail -n 10 "$LOG_FILE" 2>/dev/null || print_warning "No log file found"
    else
        print_warning "Server is NOT RUNNING"
    fi
}


# Function to show logs
show_logs() {
    print_header "Server Logs"
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        print_warning "No log file found"
    fi
}

# Function to setup log rotation cron job
setup_log_rotation() {
    print_status "Setting up automatic log rotation using cron..."
    
    CRON_JOB="0 2 * * * cd $(pwd) && $0 rotate-logs"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "start_webhook.sh.*rotate-logs"; then
        print_warning "Log rotation cron job already exists."
    else
        # Add the cron job
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        print_status "Log rotation cron job added successfully."
    fi
    
    print_status "Log rotation setup complete!"
    print_status "Logs will be automatically rotated daily at 2 AM, keeping only the last 24 hours."
}

# Function to show help
show_help() {
    print_header "Webhook Server Management Script"
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start          Start the webhook server"
    echo "  stop           Stop the webhook server"
    echo "  restart        Restart the webhook server"
    echo "  status         Show server status and recent logs"
    echo "  logs           Show live server logs (tail -f)"
    echo "  build          Build the app with versioning"
    echo "  rotate-logs    Rotate logs (keep last 24 hours)"
    echo "  setup-cron     Setup automatic daily log rotation"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start       # Start the server"
    echo "  $0 restart     # Restart the server"
    echo "  $0 status      # Check server status"
    echo "  $0 logs        # View live logs"
}

# Main script logic
case "${1:-start}" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    build)
        build_app
        ;;
    rotate-logs)
        rotate_logs
        ;;
    setup-cron)
        setup_log_rotation
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

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
