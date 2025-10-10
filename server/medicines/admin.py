from django.contrib import admin
from .models import Medicine
from stock.models import Stock
from django import forms
from django.urls import path
from django.shortcuts import render, redirect
from django.contrib import messages
from django.db import transaction
from suppliers.models import Supplier
import csv
import io
import os
from decimal import Decimal


class MedicineUploadForm(forms.Form):
    file = forms.FileField(help_text="Upload a CSV file with medicine and stock data.")
    use_ai_enrichment = forms.BooleanField(
        required=False,
        initial=True,
        label="Use AI enrichment for missing fields",
        help_text="If enabled, missing category, generic name, unit price, and reorder level will be inferred from the medicine name."
    )


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'generic_name', 'unit_price', 'reorder_level')
    search_fields = ('name', 'category', 'generic_name')

    class StockInline(admin.TabularInline):
        model = Stock
        extra = 0
        fields = ('batch_number', 'expiry_date', 'quantity', 'purchase_price')

    inlines = [StockInline]

    change_list_template = "admin/medicines/medicine_change_list.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('upload/', self.admin_site.admin_view(self.upload_view), name='medicines_medicine_upload'),
        ]
        return custom_urls + urls

    def _ai_map_headers(self, headers):
        """
        Optionally use OpenAI to map arbitrary headers to expected keys if API key is present.
        Returns a dict mapping expected_key -> actual_header
        """
        expected = {
            'name': ['name', 'medicine', 'product_name'],
            'category': ['category', 'class'],
            'generic_name': ['generic_name', 'generic'],
            'description': ['description', 'desc', 'details'],
            'manufacturer': ['manufacturer', 'maker', 'brand'],
            'dosage_form': ['dosage_form', 'form', 'dosage'],
            'barcode': ['barcode', 'sku', 'code'],
            'unit_price': ['unit_price', 'price', 'selling_price'],
            'reorder_level': ['reorder_level', 'reorder', 'min_stock'],
            'supplier': ['supplier', 'vendor'],
            'batch_number': ['batch_number', 'batch', 'lot'],
            'expiry_date': ['expiry_date', 'expires', 'expiry', 'expiration_date'],
            'quantity': ['quantity', 'qty', 'stock'],
            'purchase_price': ['purchase_price', 'buy_price', 'cost'],
        }

        headers_lower = [h.strip().lower() for h in headers]

        # Heuristic first: simple fuzzy by inclusion
        mapping = {}
        for key, candidates in expected.items():
            for cand in candidates:
                for h in headers_lower:
                    if cand == h or cand in h:
                        mapping[key] = headers[headers_lower.index(h)]
                        break
                if key in mapping:
                    break

        # If API key present, attempt LLM refinement for unmapped keys
        if any(k not in mapping for k in expected.keys()) and os.getenv('OPENAI_API_KEY'):
            try:
                # Lazy import to avoid hard dependency if not used
                from openai import OpenAI
                client = OpenAI()
                prompt = {
                    'headers': headers,
                    'expected_keys': list(expected.keys()),
                    'current_mapping': mapping,
                }
                completion = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "Map CSV headers to expected keys for a pharmacy dataset. Respond with a JSON object mapping expected_key to header string if present; omit keys not confidently mapped."},
                        {"role": "user", "content": str(prompt)},
                    ],
                    temperature=0
                )
                import json
                llm_text = completion.choices[0].message.content
                llm_map = json.loads(llm_text)
                for k, v in llm_map.items():
                    if k in expected and v in headers:
                        mapping[k] = v
            except Exception:
                # Fail silently; heuristics may be enough
                pass

        return mapping

    def _ai_enrich_medicine(self, name: str):
        """
        If OPENAI_API_KEY is present, request suggested metadata for a medicine name.
        Expected JSON keys: category, generic_name, unit_price, reorder_level.
        Return a dict with any subset of those keys.
        """
        if not os.getenv('OPENAI_API_KEY') or not name:
            return {}
        try:
            from openai import OpenAI
            client = OpenAI()
            system = (
                "You enrich pharmacy inventory data. Given a medicine brand or product name, "
                "infer a likely category, generic_name, a typical unit_price in USD (number), "
                "and a sensible reorder_level (integer). Respond ONLY with compact JSON containing "
                "keys among: category, generic_name, unit_price, reorder_level."
            )
            user = f"Name: {name}"
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0
            )
            import json
            content = completion.choices[0].message.content
            data = json.loads(content)
            result = {}
            if isinstance(data, dict):
                if 'category' in data and isinstance(data['category'], str):
                    result['category'] = data['category'].strip()
                if 'generic_name' in data and isinstance(data['generic_name'], str):
                    result['generic_name'] = data['generic_name'].strip()
                if 'unit_price' in data:
                    try:
                        result['unit_price'] = Decimal(str(data['unit_price']))
                    except Exception:
                        pass
                if 'reorder_level' in data:
                    try:
                        rl = int(float(data['reorder_level']))
                        if rl >= 0:
                            result['reorder_level'] = rl
                    except Exception:
                        pass
            return result
        except Exception:
            return {}

    @transaction.atomic
    def upload_view(self, request):
        if request.method == 'POST':
            form = MedicineUploadForm(request.POST, request.FILES)
            if form.is_valid():
                f = form.cleaned_data['file']
                use_ai = bool(form.cleaned_data.get('use_ai_enrichment'))
                name = f.name.lower()
                if not name.endswith('.csv'):
                    messages.error(request, 'Only CSV files are supported at this time.')
                    return redirect('admin:medicines_medicine_upload')

                try:
                    data = f.read()
                    text = data.decode('utf-8-sig')
                    buf = io.StringIO(text)
                    reader = csv.DictReader(buf)
                    headers = reader.fieldnames or []
                    if not headers:
                        messages.error(request, 'No headers found in the CSV file.')
                        return redirect('admin:medicines_medicine_upload')

                    header_map = self._ai_map_headers(headers)

                    created_meds = 0
                    updated_meds = 0
                    created_stocks = 0

                    for row in reader:
                        def get(key, default=""):
                            actual = header_map.get(key)
                            return (row.get(actual) if actual else None) or default

                        # Supplier
                        supplier_name = get('supplier', '').strip()
                        supplier = None
                        if supplier_name:
                            supplier, _ = Supplier.objects.get_or_create(name=supplier_name)

                        # Medicine
                        med_name = get('name').strip()
                        if not med_name:
                            # Skip invalid row
                            continue

                        med_defaults = {
                            'category': get('category', '').strip(),
                            'generic_name': get('generic_name', '').strip(),
                            'description': get('description', '').strip(),
                            'manufacturer': get('manufacturer', '').strip(),
                            'dosage_form': (get('dosage_form', '').strip() or Medicine.DosageForm.TABLET),
                            'barcode': get('barcode', '').strip(),
                            'supplier': supplier,
                        }

                        # Parse numeric fields with defaults
                        unit_price_raw = (get('unit_price', '').strip())
                        try:
                            med_defaults['unit_price'] = Decimal(unit_price_raw) if unit_price_raw else Decimal('0')
                        except Exception:
                            med_defaults['unit_price'] = Decimal('0')

                        rl_raw = (get('reorder_level', '').strip())
                        try:
                            med_defaults['reorder_level'] = int(float(rl_raw)) if rl_raw else 0
                        except Exception:
                            med_defaults['reorder_level'] = 0

                        # If key metadata missing, try AI enrichment
                        need_enrich = use_ai and (
                            not med_defaults['category']
                            or not med_defaults['generic_name']
                            or med_defaults['unit_price'] == 0
                            or med_defaults['reorder_level'] == 0
                        )
                        if need_enrich:
                            enrich = self._ai_enrich_medicine(med_name)
                            if enrich:
                                if not med_defaults['category'] and enrich.get('category'):
                                    med_defaults['category'] = enrich['category']
                                if not med_defaults['generic_name'] and enrich.get('generic_name'):
                                    med_defaults['generic_name'] = enrich['generic_name']
                                if med_defaults['unit_price'] == 0 and enrich.get('unit_price') is not None:
                                    med_defaults['unit_price'] = enrich['unit_price']
                                if med_defaults['reorder_level'] == 0 and enrich.get('reorder_level') is not None:
                                    med_defaults['reorder_level'] = enrich['reorder_level']

                        medicine, created = Medicine.objects.update_or_create(
                            name=med_name,
                            defaults=med_defaults
                        )
                        if created:
                            created_meds += 1
                        else:
                            updated_meds += 1

                        # Stock
                        batch_number = get('batch_number', '').strip()
                        expiry_date = get('expiry_date', '').strip()
                        quantity = get('quantity', '').strip()
                        purchase_price = get('purchase_price', '').strip()

                        if batch_number and expiry_date and quantity:
                            # Parse date in common formats
                            from datetime import datetime
                            parsed_date = None
                            for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y'):
                                try:
                                    parsed_date = datetime.strptime(expiry_date, fmt).date()
                                    break
                                except ValueError:
                                    continue
                            if not parsed_date:
                                # Skip bad date
                                continue

                            try:
                                qty_int = int(float(quantity))
                            except ValueError:
                                qty_int = 0
                            if qty_int <= 0:
                                continue

                            try:
                                pp = float(purchase_price or 0)
                            except ValueError:
                                pp = 0

                            Stock.objects.create(
                                medicine=medicine,
                                batch_number=batch_number,
                                expiry_date=parsed_date,
                                quantity=qty_int,
                                purchase_price=pp,
                            )
                            created_stocks += 1

                    messages.success(
                        request,
                        f"Upload processed. Medicines created: {created_meds}, updated: {updated_meds}. Stock entries added: {created_stocks}."
                    )
                    return redirect('admin:medicines_medicine_changelist')
                except Exception as e:
                    messages.error(request, f"Failed to process file: {e}")
                    return redirect('admin:medicines_medicine_upload')
        else:
            form = MedicineUploadForm()

        context = {
            **self.admin_site.each_context(request),
            'opts': self.model._meta,
            'form': form,
            'title': 'Upload Medicine Data',
        }
        return render(request, 'admin/medicines/upload.html', context)
