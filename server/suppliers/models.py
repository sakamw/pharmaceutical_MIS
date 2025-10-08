from django.db import models


class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    reliability_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)

    def __str__(self) -> str:
        return self.name



