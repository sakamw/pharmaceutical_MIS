# Generated manually for Django migration

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('medicines', '0002_medicine_barcode_medicine_description_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='medicine',
            name='category',
        ),
        migrations.RemoveField(
            model_name='medicine',
            name='supplier',
        ),
    ]
