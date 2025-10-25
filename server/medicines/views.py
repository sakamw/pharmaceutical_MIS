from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from .models import Medicine
from .serializers import MedicineSerializer
from core.permissions import IsStaffOrReadOnly, IsAdmin
from stock.models import Stock
from stock.serializers import StockSerializer
from django.utils import timezone
from datetime import timedelta
import random
import string


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all().order_by('name')
    serializer_class = MedicineSerializer
    permission_classes = [IsStaffOrReadOnly]  # All users can read, only admin can create/edit/delete
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'generic_name']
    ordering_fields = ['name', 'unit_price']

    def perform_create(self, serializer):
        """Override create to automatically generate initial stock batch"""
        # Save the medicine first
        medicine = serializer.save()

        # Generate automatic stock batch
        self._create_initial_stock_batch(medicine)

        return Response(serializer.data, status=201)

    def _create_initial_stock_batch(self, medicine):
        """Create an initial stock batch for the new medicine"""
        # Generate batch number
        batch_number = self._generate_batch_number()

        # Set default values for initial stock
        initial_quantity = 100  # Default initial stock
        expiry_date = timezone.now().date() + timedelta(days=365)  # 1 year from now
        purchase_price = medicine.unit_price * 0.8  # 20% discount from selling price

        # Create the stock batch
        stock_data = {
            'medicine': medicine.id,
            'batch_number': batch_number,
            'expiry_date': expiry_date,
            'quantity': initial_quantity,
            'purchase_price': purchase_price
        }

        stock_serializer = StockSerializer(data=stock_data)
        if stock_serializer.is_valid():
            stock_serializer.save()

    def _generate_batch_number(self):
        """Generate a unique batch number"""
        # Generate format: BATCH-YYYY-MM-NNNN
        now = timezone.now()
        year = now.year
        month = str(now.month).zfill(2)
        random_num = ''.join(random.choices(string.digits, k=4))

        batch_number = f"BATCH-{year}-{month}-{random_num}"

        # Ensure uniqueness by checking existing batches
        while Stock.objects.filter(batch_number=batch_number).exists():
            random_num = ''.join(random.choices(string.digits, k=4))
            batch_number = f"BATCH-{year}-{month}-{random_num}"

        return batch_number



