from django.contrib import admin
from .models import Stock


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('id', 'medicine', 'batch_number', 'expiry_date', 'quantity', 'purchase_price')
    list_filter = ('expiry_date',)



