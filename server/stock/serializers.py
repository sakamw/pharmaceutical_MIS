from rest_framework import serializers
from .models import Stock


class StockSerializer(serializers.ModelSerializer):
    days_until_expiry = serializers.IntegerField(read_only=True)
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    medicine_category = serializers.CharField(source='medicine.category', read_only=True)
    supplier_name = serializers.CharField(source='medicine.supplier.name', read_only=True, default=None)

    class Meta:
        model = Stock
        fields = [
            'id', 'medicine', 'medicine_name', 'medicine_category', 'supplier_name',
            'batch_number', 'expiry_date', 'quantity', 'purchase_price', 'days_until_expiry'
        ]



