from django.contrib import admin
from .models import Medicine


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'generic_name', 'unit_price', 'reorder_level')
    search_fields = ('name', 'category', 'generic_name')



