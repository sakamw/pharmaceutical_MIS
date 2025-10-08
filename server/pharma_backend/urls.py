from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'name': 'Pharm MIS API',
    })


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
]
