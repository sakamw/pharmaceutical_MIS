from rest_framework import viewsets, filters
from core.permissions import CanMakeSales
from .models import Sale
from .serializers import SaleSerializer
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related('medicine', 'stock').all()
    serializer_class = SaleSerializer
    permission_classes = [CanMakeSales]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['sale_date', 'quantity_sold']

    def perform_create(self, serializer):
        with transaction.atomic():
            stock = serializer.validated_data.get('stock')
            quantity = serializer.validated_data.get('quantity_sold')

            if stock.expiry_date < timezone.now().date():
                raise ValidationError({'stock': 'Selected stock batch is expired.'})

            if stock.quantity < quantity:
                raise ValidationError({'quantity_sold': 'Insufficient stock quantity.'})

            # Deduct quantity
            stock.quantity -= quantity
            stock.save(update_fields=['quantity'])

            serializer.save()



