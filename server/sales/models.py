from django.db import models
from django.utils import timezone
from medicines.models import Medicine
from stock.models import Stock


class Sale(models.Model):
    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT)
    stock = models.ForeignKey(Stock, on_delete=models.PROTECT, null=True, blank=True)
    quantity_sold = models.PositiveIntegerField()
    sale_date = models.DateField(default=timezone.now)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self) -> str:
        return f"{self.medicine.name} - {self.quantity_sold} units"



