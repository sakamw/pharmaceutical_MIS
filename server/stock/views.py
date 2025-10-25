from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import CanManageStock
from .models import Stock
from .serializers import StockSerializer
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, F
from django.db import models
from django.utils import timezone
from medicines.models import Medicine


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.select_related('medicine').all()
    serializer_class = StockSerializer
    permission_classes = [CanManageStock]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['expiry_date', 'quantity']
    filterset_fields = {
        'medicine': ['exact'],
        'quantity': ['gt', 'gte', 'lt', 'lte', 'exact'],
        'expiry_date': ['gte', 'lte', 'exact'],
    }

    @action(detail=False, methods=['get'])
    def low_stock_alerts(self, request):
        """Get medicines with low stock levels"""
        today = timezone.now().date()
        
        # Get medicines with total stock below reorder level
        low_stock_medicines = Medicine.objects.annotate(
            total_stock=Sum('stocks__quantity', filter=Q(stocks__expiry_date__gte=today))
        ).filter(
            Q(total_stock__lt=F('reorder_level')) | Q(total_stock__isnull=True)
        ).exclude(reorder_level=0)
        
        alerts = []
        for medicine in low_stock_medicines:
            total_stock = medicine.total_stock or 0
            alerts.append({
                'medicine_id': medicine.id,
                'medicine_name': medicine.name,
                'current_stock': total_stock,
                'reorder_level': medicine.reorder_level,
                'unit_price': float(medicine.unit_price),
                'urgency': 'critical' if total_stock == 0 else 'low'
            })
        
        return Response(alerts)

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get stock batches expiring within specified days (default 30)"""
        days = int(request.query_params.get('days', 30))
        cutoff_date = timezone.now().date() + timezone.timedelta(days=days)
        
        expiring_stocks = Stock.objects.filter(
            expiry_date__lte=cutoff_date,
            expiry_date__gte=timezone.now().date(),
            quantity__gt=0
        ).select_related('medicine')
        
        serializer = self.get_serializer(expiring_stocks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Get expired stock batches"""
        today = timezone.now().date()
        expired_stocks = Stock.objects.filter(
            expiry_date__lt=today,
            quantity__gt=0
        ).select_related('medicine')
        
        serializer = self.get_serializer(expired_stocks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get stock summary statistics"""
        today = timezone.now().date()
        
        total_medicines = Medicine.objects.count()
        total_stock_value = Stock.objects.filter(
            expiry_date__gte=today
        ).aggregate(
            total_value=models.Sum(F('quantity') * F('purchase_price'))
        )['total_value'] or 0
        
        low_stock_count = Medicine.objects.annotate(
            total_stock=Sum('stocks__quantity', filter=Q(stocks__expiry_date__gte=today))
        ).filter(
            Q(total_stock__lt=F('reorder_level')) | Q(total_stock__isnull=True)
        ).exclude(reorder_level=0).count()
        
        expiring_count = Stock.objects.filter(
            expiry_date__lte=today + timezone.timedelta(days=30),
            expiry_date__gte=today,
            quantity__gt=0
        ).count()
        
        expired_count = Stock.objects.filter(
            expiry_date__lt=today,
            quantity__gt=0
        ).count()
        
        return Response({
            'total_medicines': total_medicines,
            'total_stock_value': float(total_stock_value),
            'low_stock_count': low_stock_count,
            'expiring_count': expiring_count,
            'expired_count': expired_count
        })



