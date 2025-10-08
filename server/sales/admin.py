from django.contrib import admin
from .models import Sale


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('id', 'medicine', 'stock', 'quantity_sold', 'sale_date', 'sale_price')
    list_filter = ('sale_date',)



