#!/usr/bin/env python
"""
Production readiness check script
Run this before deploying to production
"""
import os
import sys
import subprocess
from pathlib import Path


def run_command(command, description):
    """Run a command and return success status"""
    print(f"🔍 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} - PASSED")
            return True
        else:
            print(f"❌ {description} - FAILED")
            print(f"   Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} - FAILED")
        print(f"   Error: {str(e)}")
        return False


def check_environment_variables():
    """Check required environment variables"""
    print("\n🔐 Checking environment variables...")

    required_vars = [
        'DJANGO_SECRET_KEY',
        'POSTGRES_DB',
        'POSTGRES_USER',
        'POSTGRES_PASSWORD',
        'POSTGRES_HOST',
    ]

    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        return False
    else:
        print("✅ All required environment variables are set")
        return True


def check_production_settings():
    """Check if production settings are properly configured"""
    print("\n⚙️ Checking production settings...")

    # Check if DEBUG is False in production
    debug = os.getenv('DJANGO_DEBUG', '1') == '1'
    if debug:
        print("⚠️ WARNING: DEBUG is set to True. Consider setting DJANGO_DEBUG=0 for production")

    # Check if SECRET_KEY is not default
    secret_key = os.getenv('DJANGO_SECRET_KEY', '')
    if secret_key == 'dev-secret-key' or len(secret_key) < 50:
        print("❌ WARNING: DJANGO_SECRET_KEY should be a long, random string for production")
        return False

    # Check ALLOWED_HOSTS
    allowed_hosts = os.getenv('DJANGO_ALLOWED_HOSTS', '')
    if not allowed_hosts or allowed_hosts == 'localhost,127.0.0.1':
        print("⚠️ WARNING: Consider setting DJANGO_ALLOWED_HOSTS for your production domain")

    print("✅ Production settings check completed")
    return True


def main():
    """Main production readiness check"""
    print("🚀 Pharma MIS Production Readiness Check")
    print("=" * 50)

    # Set production environment
    os.environ.setdefault('ENVIRONMENT', 'production')

    checks_passed = 0
    total_checks = 4

    # Check if we're in a git repository
    if run_command("git status", "Git repository check"):
        checks_passed += 1

    # Check Python dependencies
    if run_command("python -c 'import django, psycopg2; print(\"Dependencies OK\")'", "Python dependencies check"):
        checks_passed += 1

    # Check environment variables
    if check_environment_variables():
        checks_passed += 1

    # Check production settings
    if check_production_settings():
        checks_passed += 1

    print("\n" + "=" * 50)
    print(f"📊 Check Results: {checks_passed}/{total_checks} checks passed")

    if checks_passed == total_checks:
        print("🎉 Production readiness check PASSED!")
        print("\n💡 Next steps:")
        print("   1. Run: python manage.py migrate")
        print("   2. Run: python manage.py collectstatic --noinput")
        print("   3. Start the application: gunicorn pharma_backend.wsgi:application --config gunicorn.conf.py")
        return 0
    else:
        print("❌ Production readiness check FAILED!")
        print("   Please fix the issues above before deploying to production.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
