from django.db import models
from django.utils import timezone
from medicines.models import Medicine


class Stock(models.Model):
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='stocks')
    batch_number = models.CharField(max_length=100)
    expiry_date = models.DateField()
    quantity = models.PositiveIntegerField()
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def days_until_expiry(self) -> int:
        return (self.expiry_date - timezone.now().date()).days

    def __str__(self) -> str:
        return f"{self.medicine.name} - {self.batch_number}"



