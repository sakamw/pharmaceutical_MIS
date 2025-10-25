#!/bin/bash

# Production Deployment Script for Pharma MIS
# Run this script to deploy the application to production

echo "🚀 Starting Pharma MIS Production Deployment..."

# Set environment
export ENVIRONMENT=production

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Create necessary directories
echo "📂 Creating necessary directories..."
mkdir -p staticfiles media logs

# Set proper permissions
echo "🔒 Setting permissions..."
chmod 755 staticfiles
chmod 755 media
chmod 644 .env.production

# Run tests (optional)
# echo "🧪 Running tests..."
# python manage.py test

echo "✅ Deployment completed successfully!"
echo "🌐 You can now start the application with:"
echo "   gunicorn pharma_backend.wsgi:application --bind 0.0.0.0:8000 --workers 4"
