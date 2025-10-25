from rest_framework import serializers
from .models import Sale


class SaleSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    batch_number = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = ['id', 'medicine', 'medicine_name', 'stock', 'batch_number', 'quantity_sold', 'sale_date', 'sale_price']

    def get_batch_number(self, obj):
        return obj.stock.batch_number if obj.stock else None



