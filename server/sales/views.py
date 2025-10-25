from rest_framework import viewsets, filters
from core.permissions import CanProcessSales
from .models import Sale
from .serializers import SaleSerializer
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from stock.models import Stock


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related('medicine', 'stock').all()
    serializer_class = SaleSerializer
    permission_classes = [CanProcessSales]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['sale_date', 'quantity_sold']

    def perform_create(self, serializer):
        with transaction.atomic():
            stock = serializer.validated_data.get('stock')
            quantity = serializer.validated_data.get('quantity_sold')

            # If stock is not provided, find an appropriate stock batch
            if not stock:
                medicine = serializer.validated_data.get('medicine')
                # Find the oldest non-expired batch with sufficient quantity
                available_stock = Stock.objects.filter(
                    medicine=medicine,
                    quantity__gte=quantity,
                    expiry_date__gte=timezone.now().date()
                ).order_by('expiry_date').first()

                if not available_stock:
                    raise ValidationError({'stock': 'No available stock for this medicine.'})

                stock = available_stock

            if stock.expiry_date < timezone.now().date():
                raise ValidationError({'stock': 'Selected stock batch is expired.'})

            if stock.quantity < quantity:
                raise ValidationError({'quantity_sold': 'Insufficient stock quantity.'})

            # Deduct quantity
            stock.quantity -= quantity
            stock.save(update_fields=['quantity'])

            serializer.save(stock=stock)



