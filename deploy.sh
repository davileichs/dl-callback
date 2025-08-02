#!/bin/bash

# Webhook Callback Viewer Deployment Script

echo "🚀 Starting Webhook Callback Viewer deployment..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t webhook-callback-viewer .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
else
    echo "❌ Docker build failed!"
    exit 1
fi

# Stop and remove existing container if it exists
echo "🛑 Stopping existing container..."
docker stop webhook-callback-viewer 2>/dev/null || true
docker rm webhook-callback-viewer 2>/dev/null || true

# Run the container
echo "🏃 Starting container..."
docker run -d \
    --name webhook-callback-viewer \
    -p 5001:5001 \
    -e FLASK_ENV=production \
    -e PORT=5001 \
    -e SECRET_KEY=your-secret-key-change-in-production \
    --restart unless-stopped \
    webhook-callback-viewer

if [ $? -eq 0 ]; then
    echo "✅ Container started successfully!"
    echo "🌐 Application is running on: http://localhost:5001"
    echo "📊 Health check: http://localhost:5001/"
    echo ""
    echo "📋 Container logs:"
    docker logs webhook-callback-viewer
else
    echo "❌ Failed to start container!"
    exit 1
fi 