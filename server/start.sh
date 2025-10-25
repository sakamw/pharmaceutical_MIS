#!/bin/bash

# Production Startup Script for Pharma MIS
# This script starts all necessary services for production deployment

echo "🚀 Starting Pharma MIS Production Environment..."
echo "=================================================="

# Set production environment
export ENVIRONMENT=production

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Docker is available (preferred method)
if command_exists docker && command_exists docker-compose; then
    echo "🐳 Using Docker deployment..."

    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        echo "❌ Error: .env.production file not found!"
        echo "   Please copy .env.template to .env.production and configure it."
        exit 1
    fi

    # Start services with Docker Compose
    echo "📦 Starting services with Docker Compose..."
    docker-compose up -d --build

    # Wait for services to be ready
    echo "⏳ Waiting for services to start..."
    sleep 10

    # Run database migrations
    echo "🗄️ Running database migrations..."
    docker-compose exec web python manage.py migrate

    # Collect static files
    echo "📁 Collecting static files..."
    docker-compose exec web python manage.py collectstatic --noinput

    echo "✅ Docker deployment completed!"
    echo "🌐 Application available at: http://localhost"
    echo "🔍 Health check: http://localhost/health/"

# Manual deployment (fallback)
elif command_exists gunicorn; then
    echo "🔧 Using manual deployment..."

    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        echo "❌ Error: .env.production file not found!"
        echo "   Please copy .env.template to .env.production and configure it."
        exit 1
    fi

    # Load environment variables
    set -a
    source .env.production
    set +a

    # Create necessary directories
    mkdir -p staticfiles media logs

    # Run database migrations
    echo "🗄️ Running database migrations..."
    python manage.py migrate

    # Collect static files
    echo "📁 Collecting static files..."
    python manage.py collectstatic --noinput

    # Start Gunicorn
    echo "🚀 Starting Gunicorn server..."
    nohup gunicorn pharma_backend.wsgi:application \
        --bind 0.0.0.0:8000 \
        --config gunicorn.conf.py \
        --log-file logs/gunicorn.log \
        --pid /tmp/gunicorn.pid \
        --daemon

    echo "✅ Manual deployment completed!"
    echo "🌐 Application available at: http://localhost:8000"
    echo "🔍 Health check: http://localhost:8000/health/"

else
    echo "❌ Error: Neither Docker nor Gunicorn found!"
    echo "   Please install Docker and docker-compose, or install Gunicorn."
    exit 1
fi

echo ""
echo "📊 To check logs:"
if command_exists docker; then
    echo "   docker-compose logs -f web"
else
    echo "   tail -f logs/gunicorn.log"
fi

echo ""
echo "🛑 To stop the application:"
if command_exists docker; then
    echo "   docker-compose down"
else
    echo "   pkill -f gunicorn"
fi

echo ""
echo "🎉 Deployment completed successfully!"
