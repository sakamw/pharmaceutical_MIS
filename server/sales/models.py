from django.db import models
from django.utils import timezone
from medicines.models import Medicine
from stock.models import Stock


def get_current_date():
    return timezone.now().date()


class Sale(models.Model):
    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT)
    stock = models.ForeignKey(Stock, on_delete=models.PROTECT)
    quantity_sold = models.PositiveIntegerField()
    sale_date = models.DateField(default=get_current_date)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self) -> str:
        return f"{self.medicine.name} - {self.quantity_sold} units"



