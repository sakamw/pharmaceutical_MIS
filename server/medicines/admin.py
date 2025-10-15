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
import logging
import re


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
            path('delete-all/', self.admin_site.admin_view(self.delete_all_view), name='medicines_medicine_delete_all'),
            path('enrich-missing/', self.admin_site.admin_view(self.enrich_missing_view), name='medicines_medicine_enrich_missing'),
        ]
        return custom_urls + urls

    def _ai_map_headers(self, headers):
        """
        Optionally use GenAI to map arbitrary headers to expected keys if API key is present.
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
        if any(k not in mapping for k in expected.keys()) and os.getenv('GENAI_API_KEY'):
            try:
                # Lazy import to avoid hard dependency if not used
                import google.generativeai as genai
                genai.configure(api_key=os.getenv('GENAI_API_KEY'))
                model = genai.GenerativeModel(os.getenv('GENAI_MODEL', 'gemini-1.5-flash'))
                prompt = {
                    'headers': headers,
                    'expected_keys': list(expected.keys()),
                    'current_mapping': mapping,
                }
                completion = model.generate_content([
                    {"role": "user", "parts": [
                        "Map CSV headers to expected keys for a pharmacy dataset. Respond with a JSON object mapping expected_key to header string if present; omit keys not confidently mapped.",
                        str(prompt)
                    ]}
                ])
                import json
                llm_text = completion.text
                llm_map = json.loads(llm_text)
                for k, v in llm_map.items():
                    if k in expected and v in headers:
                        mapping[k] = v
            except Exception as e:
                # Log but continue; heuristics may be enough
                logging.exception("Header mapping enrichment failed: %s", e)

        return mapping

    def _ai_enrich_medicine(self, name: str):
        """
        Enhanced AI enrichment for medicine data with better prompts and validation.
        Generates: category, generic_name, description, manufacturer, dosage_form, unit_price, reorder_level
        """
        if not os.getenv('GENAI_API_KEY') or not name:
            return {}
        try:
            import google.generativeai as genai
            genai.configure(api_key=os.getenv('GENAI_API_KEY'))
            model = genai.GenerativeModel(os.getenv('GENAI_MODEL', 'gemini-1.5-flash'))
            system = (
                "You are a pharmaceutical expert helping to enrich medicine inventory data. "
                "Given a medicine brand or product name, provide comprehensive information. "
                "Respond with ONLY a JSON object containing these keys (omit any you cannot determine):\n"
                "- category: Medical category (e.g., 'Antibiotic', 'Pain Relief', 'Cardiovascular')\n"
                "- generic_name: Generic drug name (e.g., 'Acetaminophen', 'Ibuprofen')\n"
                "- description: Brief description of the medicine's purpose\n"
                "- manufacturer: Pharmaceutical company name\n"
                "- dosage_form: One of: tablet, capsule, syrup, injection, cream, drops, inhaler, powder, other\n"
                "- unit_price: Typical retail price in USD (number, e.g., 15.99)\n"
                "- reorder_level: Suggested minimum stock level (integer, e.g., 50)\n\n"
                "Be accurate and conservative. If uncertain about any field, omit it from the response."
            )
            user = f"Medicine name: {name}"
            completion = model.generate_content([
                {"role": "user", "parts": [system, user]}
            ])
            import json
            content = completion.text or ""
            
            # Extract JSON from response
            fenced = content.strip()
            if fenced.startswith("```"):
                fenced = re.sub(r"^```[a-zA-Z]*\n?|```$", "", fenced).strip()
            
            # Find JSON object
            m = re.search(r"\{[\s\S]*\}", fenced)
            json_text = m.group(0) if m else fenced
            
            data = json.loads(json_text)
            result = {}
            
            if isinstance(data, dict):
                # Validate and clean each field
                if 'category' in data and isinstance(data['category'], str) and data['category'].strip():
                    result['category'] = data['category'].strip()[:255]
                
                if 'generic_name' in data and isinstance(data['generic_name'], str) and data['generic_name'].strip():
                    result['generic_name'] = data['generic_name'].strip()[:255]
                
                if 'description' in data and isinstance(data['description'], str) and data['description'].strip():
                    result['description'] = data['description'].strip()[:1000]
                
                if 'manufacturer' in data and isinstance(data['manufacturer'], str) and data['manufacturer'].strip():
                    result['manufacturer'] = data['manufacturer'].strip()[:255]
                
                if 'dosage_form' in data and isinstance(data['dosage_form'], str):
                    dosage_form = data['dosage_form'].strip().lower()
                    valid_forms = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'powder', 'other']
                    if dosage_form in valid_forms:
                        result['dosage_form'] = dosage_form
                
                if 'unit_price' in data:
                    try:
                        price = float(data['unit_price'])
                        if 0.01 <= price <= 10000:  # Reasonable price range
                            result['unit_price'] = Decimal(str(price))
                    except (ValueError, TypeError):
                        pass
                
                if 'reorder_level' in data:
                    try:
                        rl = int(float(data['reorder_level']))
                        if 0 <= rl <= 10000:  # Reasonable reorder level
                            result['reorder_level'] = rl
                    except (ValueError, TypeError):
                        pass
            
            return result
        except Exception as e:
            logging.exception("Medicine enrichment failed for '%s': %s", name, e)
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
                    enriched_rows = 0
                    enrichment_skipped_no_api = False
                    enrichment_attempted = False

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

                        # Enhanced AI enrichment for missing fields
                        need_enrich = use_ai and (
                            not med_defaults['category']
                            or not med_defaults['generic_name']
                            or not med_defaults['description']
                            or not med_defaults['manufacturer']
                            or med_defaults['dosage_form'] == Medicine.DosageForm.TABLET  # Default value
                            or med_defaults['unit_price'] == 0
                            or med_defaults['reorder_level'] == 0
                        )
                        if need_enrich:
                            if not os.getenv('GENAI_API_KEY'):
                                enrichment_skipped_no_api = True
                            else:
                                enrichment_attempted = True
                                enrich = self._ai_enrich_medicine(med_name)
                                if enrich:
                                    changed = False
                                    # Apply AI-generated fields only if CSV data is missing
                                    if not med_defaults['category'] and enrich.get('category'):
                                        med_defaults['category'] = enrich['category']
                                        changed = True
                                    if not med_defaults['generic_name'] and enrich.get('generic_name'):
                                        med_defaults['generic_name'] = enrich['generic_name']
                                        changed = True
                                    if not med_defaults['description'] and enrich.get('description'):
                                        med_defaults['description'] = enrich['description']
                                        changed = True
                                    if not med_defaults['manufacturer'] and enrich.get('manufacturer'):
                                        med_defaults['manufacturer'] = enrich['manufacturer']
                                        changed = True
                                    if med_defaults['dosage_form'] == Medicine.DosageForm.TABLET and enrich.get('dosage_form'):
                                        med_defaults['dosage_form'] = enrich['dosage_form']
                                        changed = True
                                    if med_defaults['unit_price'] == 0 and enrich.get('unit_price') is not None:
                                        med_defaults['unit_price'] = enrich['unit_price']
                                        changed = True
                                    if med_defaults['reorder_level'] == 0 and enrich.get('reorder_level') is not None:
                                        med_defaults['reorder_level'] = enrich['reorder_level']
                                        changed = True
                                    if changed:
                                        enriched_rows += 1

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
                        f"Upload processed. Medicines created: {created_meds}, updated: {updated_meds}. Stock entries added: {created_stocks}. AI-enriched rows: {enriched_rows}."
                    )
                    if use_ai and enrichment_skipped_no_api:
                        messages.warning(request, 'AI enrichment was requested but GENAI_API_KEY is not configured; fields remained default. Set GENAI_API_KEY and retry.')
                    if use_ai and not enrichment_skipped_no_api and enrichment_attempted and enriched_rows == 0:
                        messages.warning(request, 'AI enrichment was enabled, but no rows were enriched. Ensure the "google-generativeai" Python package is installed, the server has internet access, and your API key has access to the specified model.')
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

    @transaction.atomic
    def delete_all_view(self, request):
        """Dangerous: Deletes ALL medicines and cascades related stocks. Shows confirm page first."""
        from django.contrib.admin.views.main import ERROR_FLAG
        from sales.models import Sale
        opts = self.model._meta
        if request.method == 'POST':
            # Permission check: user must have delete permission on Medicine
            if not self.has_delete_permission(request):
                messages.error(request, 'You do not have permission to delete medicines.')
                return redirect('admin:medicines_medicine_changelist')
            try:
                sales_count = Sale.objects.count()
                if sales_count > 0:
                    messages.error(request, f"Cannot delete medicines because there are {sales_count} sales records referencing medicines/stocks. Delete sales first.")
                    return redirect('admin:medicines_medicine_changelist')
                count = Medicine.objects.count()
                Medicine.objects.all().delete()
                messages.success(request, f"Deleted ALL medicines (count: {count}). Related stock entries were also removed.")
                return redirect('admin:medicines_medicine_changelist')
            except Exception as e:
                messages.error(request, f"Failed to delete all medicines: {e}")
                return redirect('admin:medicines_medicine_changelist')

        # Show counts on confirm page
        from sales.models import Sale
        from stock.models import Stock as StockModel
        context = {
            **self.admin_site.each_context(request),
            'opts': opts,
            'title': 'Confirm delete ALL medicines',
            'med_count': Medicine.objects.count(),
            'stock_count': StockModel.objects.count(),
            'sale_count': Sale.objects.count(),
        }
        return render(request, 'admin/medicines/confirm_delete_all.html', context)

    @transaction.atomic
    def enrich_missing_view(self, request):
        """Bulk AI enrichment for all medicines with missing category/generic or zero price/reorder."""
        from django.db.models import Q

        # Identify candidates for enrichment
        candidates = Medicine.objects.filter(
            Q(category__isnull=True) | Q(category__exact='') |
            Q(generic_name__isnull=True) | Q(generic_name__exact='') |
            Q(description__isnull=True) | Q(description__exact='') |
            Q(manufacturer__isnull=True) | Q(manufacturer__exact='') |
            Q(dosage_form='tablet') |  # Default value indicates missing data
            Q(unit_price=0) |
            Q(reorder_level=0)
        )

        if request.method == 'POST':
            use_ai = True
            if not os.getenv('GENAI_API_KEY'):
                messages.warning(request, 'GENAI_API_KEY is not configured; cannot perform AI enrichment.')
                return redirect('admin:medicines_medicine_changelist')

            enriched = 0
            checked = 0
            for med in candidates.iterator():
                checked += 1
                need = (
                    not med.category or not med.generic_name or not med.description or 
                    not med.manufacturer or med.dosage_form == 'tablet' or 
                    med.unit_price == 0 or med.reorder_level == 0
                )
                if not need:
                    continue
                enrich = self._ai_enrich_medicine(med.name)
                changed = False
                update_fields = []
                
                if not med.category and enrich.get('category'):
                    med.category = enrich['category']
                    update_fields.append('category')
                    changed = True
                if not med.generic_name and enrich.get('generic_name'):
                    med.generic_name = enrich['generic_name']
                    update_fields.append('generic_name')
                    changed = True
                if not med.description and enrich.get('description'):
                    med.description = enrich['description']
                    update_fields.append('description')
                    changed = True
                if not med.manufacturer and enrich.get('manufacturer'):
                    med.manufacturer = enrich['manufacturer']
                    update_fields.append('manufacturer')
                    changed = True
                if med.dosage_form == 'tablet' and enrich.get('dosage_form'):
                    med.dosage_form = enrich['dosage_form']
                    update_fields.append('dosage_form')
                    changed = True
                if med.unit_price == 0 and enrich.get('unit_price') is not None:
                    med.unit_price = enrich['unit_price']
                    update_fields.append('unit_price')
                    changed = True
                if med.reorder_level == 0 and enrich.get('reorder_level') is not None:
                    med.reorder_level = enrich['reorder_level']
                    update_fields.append('reorder_level')
                    changed = True
                
                if changed:
                    med.save(update_fields=update_fields)
                    enriched += 1

            messages.success(request, f"AI enrichment completed. Checked: {checked}, Enriched: {enriched}.")
            return redirect('admin:medicines_medicine_changelist')

        context = {
            **self.admin_site.each_context(request),
            'opts': self.model._meta,
            'title': 'AI Enrich Missing Medicine Fields',
            'candidates_count': candidates.count(),
        }
        return render(request, 'admin/medicines/confirm_enrich_missing.html', context)
