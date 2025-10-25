from django.db import models


class Medicine(models.Model):
    name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    manufacturer = models.CharField(max_length=255, blank=True)
    class DosageForm(models.TextChoices):
        TABLET = 'tablet', 'Tablet'
        CAPSULE = 'capsule', 'Capsule'
        SYRUP = 'syrup', 'Syrup'
        INJECTION = 'injection', 'Injection'
        CREAM = 'cream', 'Cream'
        DROPS = 'drops', 'Drops'
        INHALER = 'inhaler', 'Inhaler'
        POWDER = 'powder', 'Powder'
        OTHER = 'other', 'Other'
    dosage_form = models.CharField(max_length=20, choices=DosageForm.choices, default=DosageForm.TABLET)
    barcode = models.CharField(max_length=255, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    reorder_level = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return self.name



