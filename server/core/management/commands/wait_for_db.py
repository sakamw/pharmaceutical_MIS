#!/usr/bin/env python
"""
Management command to wait for database to be ready
"""
import time
import sys
from django.db import connection
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Wait for database to be ready'

    def add_arguments(self, parser):
        parser.add_argument(
            '--timeout',
            default=60,
            type=int,
            help='Maximum time to wait for database (default: 60 seconds)',
        )

    def handle(self, *args, **options):
        timeout = options['timeout']
        start_time = time.time()

        self.stdout.write('Waiting for database...')

        while time.time() - start_time < timeout:
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                self.stdout.write(self.style.SUCCESS('Database is ready!'))
                return
            except Exception as e:
                self.stdout.write(f'Database not ready: {e}')
                time.sleep(1)

        self.stdout.write(
            self.style.ERROR(f'Database not ready after {timeout} seconds')
        )
        sys.exit(1)
