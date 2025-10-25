from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, F, Count, Avg
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from medicines.models import Medicine
from stock.models import Stock
from sales.models import Sale
from suppliers.models import Supplier
from django.db.models.functions import TruncMonth


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_trends(request):
    """Get sales trends over time"""
    days = int(request.query_params.get('days', 90))
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)

    # Monthly sales aggregation
    monthly_sales = (
        Sale.objects.filter(sale_date__gte=start_date, sale_date__lte=end_date)
        .annotate(month=TruncMonth('sale_date'))
        .values('month')
        .annotate(
            total_quantity=Sum('quantity_sold'),
            total_revenue=Sum(F('quantity_sold') * F('sale_price')),
            transaction_count=Count('id')
        )
        .order_by('month')
    )

    # Daily sales for the last 30 days
    daily_sales = (
        Sale.objects.filter(sale_date__gte=start_date, sale_date__lte=end_date)
        .values('sale_date')
        .annotate(
            total_quantity=Sum('quantity_sold'),
            total_revenue=Sum(F('quantity_sold') * F('sale_price')),
            transaction_count=Count('id')
        )
        .order_by('sale_date')
    )

    return Response({
        'monthly_trends': list(monthly_sales),
        'daily_trends': list(daily_sales),
        'period_days': days
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stock_analysis(request):
    """Get detailed stock analysis"""
    today = timezone.now().date()
    thirty_days = today + timedelta(days=30)
    ninety_days = today + timedelta(days=90)

    # Stock value by category
    category_stock = Medicine.objects.values('category').annotate(
        total_value=Sum(F('stocks__quantity') * F('stocks__purchase_price')),
        total_quantity=Sum('stocks__quantity')
    ).exclude(category='')

    # Expiry analysis
    expiring_30 = Stock.objects.filter(
        expiry_date__lte=thirty_days,
        expiry_date__gte=today,
        quantity__gt=0
    ).aggregate(
        total_quantity=Sum('quantity'),
        total_value=Sum(F('quantity') * F('purchase_price'))
    )

    expiring_90 = Stock.objects.filter(
        expiry_date__lte=ninety_days,
        expiry_date__gte=today,
        quantity__gt=0
    ).aggregate(
        total_quantity=Sum('quantity'),
        total_value=Sum(F('quantity') * F('purchase_price'))
    )

    # Top medicines by stock value
    top_by_value = Medicine.objects.annotate(
        stock_value=Sum(F('stocks__quantity') * F('stocks__purchase_price')),
        total_quantity=Sum('stocks__quantity')
    ).filter(stock_value__gt=0).order_by('-stock_value')[:10]

    return Response({
        'stock_by_category': list(category_stock),
        'expiring_30_days': {
            'quantity': expiring_30['total_quantity'] or 0,
            'value': float(expiring_30['total_value'] or 0)
        },
        'expiring_90_days': {
            'quantity': expiring_90['total_quantity'] or 0,
            'value': float(expiring_90['total_value'] or 0)
        },
        'top_medicines_by_value': [{
            'name': med.name,
            'category': med.category,
            'stock_value': float(med.stock_value or 0),
            'total_quantity': med.total_quantity or 0
        } for med in top_by_value]
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def supplier_performance(request):
    """Get supplier performance metrics"""
    suppliers = Supplier.objects.annotate(
        medicines_count=Count('medicine_supplier'),
        avg_reliability=Avg('reliability_rating')
    ).filter(medicines_count__gt=0)

    # Stock value by supplier
    supplier_stock = Medicine.objects.values('supplier__name').annotate(
        total_stock_value=Sum(F('stocks__quantity') * F('stocks__purchase_price')),
        medicines_count=Count('id')
    ).exclude(supplier__isnull=True)

    return Response({
        'supplier_metrics': [{
            'name': sup.name,
            'medicines_count': sup.medicines_count,
            'avg_reliability': float(sup.avg_reliability or 0),
            'contact_info': sup.contact_info,
            'address': sup.address
        } for sup in suppliers],
        'stock_by_supplier': list(supplier_stock)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventory_turnover(request):
    """Calculate inventory turnover rates"""
    today = timezone.now().date()
    six_months_ago = today - timedelta(days=180)

    # Get medicines with sales in the last 6 months
    medicines_with_sales = Sale.objects.filter(
        sale_date__gte=six_months_ago
    ).values('medicine').distinct()

    turnover_data = []
    for med_data in medicines_with_sales:
        med_id = med_data['medicine']
        medicine = Medicine.objects.get(id=med_id)

        # Calculate average stock level
        avg_stock = Stock.objects.filter(
            medicine=medicine,
            expiry_date__gte=today
        ).aggregate(avg=Avg('quantity'))['avg'] or 0

        # Calculate sales rate (units per day)
        total_sold = Sale.objects.filter(
            medicine=medicine,
            sale_date__gte=six_months_ago
        ).aggregate(total=Sum('quantity_sold'))['total'] or 0

        sales_rate = total_sold / 180  # per day
        turnover_rate = (sales_rate / avg_stock) if avg_stock > 0 else 0

        turnover_data.append({
            'medicine_name': medicine.name,
            'category': medicine.category,
            'avg_stock_level': round(avg_stock, 2),
            'total_sold_6months': total_sold,
            'daily_sales_rate': round(sales_rate, 2),
            'turnover_rate': round(turnover_rate, 4)
        })

    # Sort by turnover rate (highest first)
    turnover_data.sort(key=lambda x: x['turnover_rate'], reverse=True)

    return Response({
        'inventory_turnover': turnover_data[:20],  # Top 20
        'calculated_date': today.isoformat()
    })
