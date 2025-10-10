from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        MANAGER = 'MANAGER', 'Manager'
        STAFF = 'STAFF', 'Staff'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STAFF)
    # WARNING: Storing plaintext passwords is insecure. This is added per request
    # to allow admins to view the initially set password. Consider clearing it
    # after first login or after a set period.
    initial_password = models.CharField(max_length=128, blank=True, null=True)
