from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, F
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from medicines.models import Medicine
from stock.models import Stock
from sales.models import Sale
from suppliers.models import Supplier


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def summary(request):
    today = timezone.now().date()
    soon = today + timedelta(days=30)
    expiring_soon = Stock.objects.filter(expiry_date__lte=soon, expiry_date__gte=today).count()
    expired = Stock.objects.filter(expiry_date__lt=today).count()

    # Out of stock or below reorder
    meds = Medicine.objects.all()
    below_reorder = 0
    total_stock_value = 0
    for m in meds:
        qty = m.stocks.aggregate(total=Sum('quantity'))['total'] or 0
        value = m.stocks.aggregate(val=Sum(F('quantity') * F('purchase_price')))['val'] or 0
        total_stock_value += float(value)
        if qty <= 0 or qty < m.reorder_level:
            below_reorder += 1

    # Sales performance (last 30 days)
    last_30 = today - timedelta(days=30)
    monthly_sales = Sale.objects.filter(sale_date__gte=last_30).aggregate(total=Sum('quantity_sold'))['total'] or 0

    # Supplier reliability: average rating
    supplier_reliability = float(Supplier.objects.aggregate(avg=Sum('reliability_rating'))['avg'] or 0)

    # Top 5 fast-moving
    top_fast = (
        Sale.objects.filter(sale_date__gte=last_30)
        .values('medicine__name')
        .annotate(total=Sum('quantity_sold'))
        .order_by('-total')[:5]
    )

    return Response({
        'expiring_soon': expiring_soon,
        'expired': expired,
        'below_reorder': below_reorder,
        'total_stock_value': round(total_stock_value, 2),
        'monthly_sales_qty': monthly_sales,
        'supplier_reliability_score': supplier_reliability,
        'top_fast_moving': list(top_fast),
    })



