from rest_framework import viewsets, filters
from core.permissions import ReadOnlyOrStaff
from .models import Stock
from .serializers import StockSerializer
from django_filters.rest_framework import DjangoFilterBackend


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.select_related('medicine').all()
    serializer_class = StockSerializer
    permission_classes = [ReadOnlyOrStaff]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['expiry_date', 'quantity']
    filterset_fields = {
        'medicine': ['exact'],
        'quantity': ['gt', 'gte', 'lt', 'lte', 'exact'],
        'expiry_date': ['gte', 'lte', 'exact'],
    }



