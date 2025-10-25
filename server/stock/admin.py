import random
import string
from django.contrib import admin
from django.contrib import messages
from django.utils.html import format_html
from django import forms
from django.utils import timezone
from django.urls import path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Stock


def generate_batch_number(prefix='BATCH', length=6):
    """Generate a random batch number with optional prefix and length"""
    # Generate random alphanumeric characters
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choice(chars) for _ in range(length))

    # Add current year for better organization
    from datetime import datetime
    year = str(datetime.now().year)[-2:]  # Last 2 digits of year

    return f"{prefix}{year}{random_part}"


class StockForm(forms.ModelForm):
    """Custom form for Stock model with batch number generation"""

    class Meta:
        model = Stock
        fields = '__all__'
        widgets = {
            'batch_number': forms.TextInput(attrs={
                'placeholder': 'Click "Generate Batch Number" button or enter manually',
                'style': 'width: 300px;'
            })
        }

    def clean_batch_number(self):
        batch_number = self.cleaned_data.get('batch_number')

        if not batch_number:
            raise forms.ValidationError("Batch number is required. Click 'Generate Batch Number' button or enter one manually.")

        return batch_number


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    form = StockForm
    change_form_template = 'admin/stock/stock_change_form.html'
    list_display = ('id', 'medicine', 'batch_number', 'expiry_date', 'quantity', 'purchase_price', 'days_until_expiry')
    list_filter = ('expiry_date', 'medicine')
    search_fields = ('batch_number', 'medicine__name')
    actions = ['generate_random_batch_numbers']

    fieldsets = (
        ('Basic Information', {
            'fields': ('medicine', 'batch_number', 'generate_batch_button')
        }),
        ('Stock Details', {
            'fields': ('quantity', 'purchase_price', 'expiry_date')
        }),
    )

    readonly_fields = ('generate_batch_button',)

    def generate_batch_button(self, obj=None):
        """Display a button to generate batch number"""
        if obj and obj.batch_number:
            return format_html(
                '<button type="button" onclick="generateBatchNumber()" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">🔄 Regenerate</button>'
            )
        else:
            return format_html(
                '<button type="button" onclick="generateBatchNumber()" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">🎲 Generate Batch Number</button>'
            )
    generate_batch_button.short_description = 'Generate Batch Number'

    def get_urls(self):
        """Add custom URL for batch number generation"""
        urls = super().get_urls()
        custom_urls = [
            path('generate-batch/', self.admin_site.admin_view(csrf_exempt(self.generate_batch_view)), name='stock_stock_generate_batch'),
        ]
        return custom_urls + urls

    def generate_batch_view(self, request):
        """AJAX view to generate a batch number"""
        if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            batch_number = generate_batch_number()
            while Stock.objects.filter(batch_number=batch_number).exists():
                batch_number = generate_batch_number()

            return JsonResponse({'batch_number': batch_number})
        return JsonResponse({'error': 'Invalid request'}, status=400)

    def changelist_view(self, request, extra_context=None):
        """Add custom JavaScript to the change list view"""
        extra_context = extra_context or {}
        extra_context['title'] = 'Stock Management'
        return super().changelist_view(request, extra_context)

    class Media:
        js = ('https://code.jquery.com/jquery-3.6.0.min.js',)

    def save_model(self, request, obj, form, change):
        """Override save to handle batch number generation"""
        super().save_model(request, obj, form, change)

    def days_until_expiry(self, obj):
        """Display days until expiry with color coding"""
        days = obj.days_until_expiry
        if days < 0:
            return format_html('<span style="color: red; font-weight: bold;">EXPIRED</span>')
        elif days <= 30:
            return format_html('<span style="color: orange; font-weight: bold;">{} days</span>', days)
        elif days <= 90:
            return format_html('<span style="color: #ff6600; font-weight: bold;">{} days</span>', days)
        else:
            return format_html('<span style="color: green;">{} days</span>', days)
    days_until_expiry.short_description = 'Days to Expiry'

    def generate_random_batch_numbers(self, request, queryset):
        """Generate random batch numbers for selected stock items"""
        updated = 0
        for stock in queryset:
            # Generate a unique batch number (ensure no duplicates)
            batch_number = generate_batch_number()
            while Stock.objects.filter(batch_number=batch_number).exists():
                batch_number = generate_batch_number()

            stock.batch_number = batch_number
            stock.save()
            updated += 1

        if updated == 1:
            messages.success(request, f"Generated random batch number for 1 stock item.")
        else:
            messages.success(request, f"Generated random batch numbers for {updated} stock items.")
    generate_random_batch_numbers.short_description = "Generate random batch numbers for selected items"



