from django.contrib import admin
from .models import Medicine
from stock.models import Stock


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'generic_name', 'unit_price', 'reorder_level')
    search_fields = ('name', 'category', 'generic_name')

    class StockInline(admin.TabularInline):
        model = Stock
        extra = 0
        fields = ('batch_number', 'expiry_date', 'quantity', 'purchase_price')

    inlines = [StockInline]



