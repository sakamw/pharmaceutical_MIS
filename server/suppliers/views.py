from rest_framework import viewsets
from core.permissions import IsStaffOrReadOnly
from .models import Supplier
from .serializers import SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    permission_classes = [IsStaffOrReadOnly]



