from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import os


def health_check(request):
    """Comprehensive health check endpoint"""
    health_status = {
        'status': 'ok',
        'name': 'Pharm MIS API',
        'version': '1.0.0',
        'environment': os.getenv('ENVIRONMENT', 'development'),
        'timestamp': connection.cursor().execute('SELECT NOW()').fetchone()[0],
    }

    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            health_status['database'] = 'connected'
    except Exception as e:
        health_status['status'] = 'error'
        health_status['database'] = f'error: {str(e)}'

    # Cache check
    try:
        cache.set('health_check', 'ok', 10)
        if cache.get('health_check') == 'ok':
            health_status['cache'] = 'connected'
        else:
            health_status['cache'] = 'error: write/read failed'
    except Exception as e:
        health_status['cache'] = f'error: {str(e)}'

    # Overall status
    if health_status['status'] == 'error':
        return JsonResponse(health_status, status=500)
    else:
        return JsonResponse(health_status)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('core.urls')),
    path('api/medicines/', include('medicines.urls')),
    path('api/stock/', include('stock.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/suppliers/', include('suppliers.urls')),
    path('api/reports/', include('reports.urls')),
    # Health-check / root endpoint
    path('', health_check),
    path('health/', health_check),
]
