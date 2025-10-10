from rest_framework import viewsets, permissions, filters
from .models import Medicine
from .serializers import MedicineSerializer
from core.permissions import IsStaffOrReadOnly


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all().order_by('name')
    serializer_class = MedicineSerializer
    permission_classes = [IsStaffOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category', 'generic_name']
    ordering_fields = ['name', 'unit_price']



