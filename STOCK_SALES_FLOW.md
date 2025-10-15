# PharmaCare Stock & Sales Management Flow

## Overview

This document outlines the complete flow of how stock and sales are managed in the PharmaCare system, including CSV upload with AI enrichment, stock monitoring, and sales processing.

## 1. CSV Medicine Upload with AI Enhancement

### Process Flow:

```
CSV Upload → Header Mapping → Data Validation → AI Enrichment → Database Storage
```

### Detailed Steps:

#### 1.1 CSV Upload

- **Location**: Django Admin (`/admin/medicines/medicine/upload/`)
- **File Format**: CSV with flexible headers
- **Required Fields**: Medicine name (minimum)
- **Optional Fields**: All other medicine and stock fields

#### 1.2 Header Mapping

- **Automatic Detection**: System maps CSV headers to expected fields
- **AI Enhancement**: Uses Google GenAI to map unknown headers if API key is configured
- **Fallback**: Heuristic matching for common variations

#### 1.3 AI Field Generation

When `use_ai_enrichment` is enabled and `GENAI_API_KEY` is configured:

**Generated Fields:**

- `category`: Medical category (e.g., "Antibiotic", "Pain Relief")
- `generic_name`: Generic drug name (e.g., "Acetaminophen")
- `description`: Brief description of medicine's purpose
- `manufacturer`: Pharmaceutical company name
- `dosage_form`: One of: tablet, capsule, syrup, injection, cream, drops, inhaler, powder, other
- `unit_price`: Typical retail price in USD
- `reorder_level`: Suggested minimum stock level

**AI Prompt**: Specialized pharmaceutical expert prompt with validation
**Validation**: Price ranges (0.01-10000), reasonable reorder levels (0-10000)

#### 1.4 Data Processing

- **Medicine Creation**: Creates or updates medicine records
- **Stock Creation**: Creates stock batches with batch numbers, expiry dates, quantities
- **Supplier Management**: Auto-creates suppliers if not exists
- **Error Handling**: Skips invalid rows, reports success/failure counts

## 2. Stock Management Flow

### 2.1 Stock Monitoring Dashboard

#### Summary Cards:

- **Total Medicines**: Count of unique medicines
- **Stock Value**: Total value of non-expired stock
- **Low Stock Count**: Medicines below reorder level
- **Expiring Count**: Batches expiring within 30 days

#### Stock Tabs:

1. **All Stock**: Complete inventory view with search
2. **Low Stock**: Medicines below reorder level
3. **Expiring Soon**: Batches expiring within 30 days
4. **Expired**: Expired stock batches

### 2.2 Stock Alerts System

#### Low Stock Detection:

```sql
SELECT medicines WHERE total_stock < reorder_level
```

#### Expiry Monitoring:

- **Expiring Soon**: Within 30 days (configurable)
- **Expired**: Past expiry date
- **Status Badges**: Visual indicators for urgency

#### Alert Types:

- **Critical**: Zero stock
- **Low**: Below reorder level
- **Expiring**: Within expiry window
- **Expired**: Past expiry date

### 2.3 Stock API Endpoints

#### Available Endpoints:

- `GET /api/stock/` - All stock batches
- `GET /api/stock/summary/` - Summary statistics
- `GET /api/stock/low_stock_alerts/` - Low stock medicines
- `GET /api/stock/expiring_soon/` - Expiring batches
- `GET /api/stock/expired/` - Expired batches

#### Filtering Options:

- Medicine ID
- Quantity ranges
- Expiry date ranges
- Ordering by expiry date or quantity

## 3. Sales Management Flow

### 3.1 Point of Sale (POS) Process

#### Sales Creation Flow:

```
Select Medicine → Select Batch → Enter Quantity → Add to Cart → Process Sale
```

#### Detailed Steps:

1. **Medicine Selection**:

   - Dropdown of available medicines
   - Real-time filtering

2. **Batch Selection**:

   - Only shows non-expired batches with quantity > 0
   - Displays batch number and available quantity
   - Filters by selected medicine

3. **Quantity Validation**:

   - Cannot exceed available stock
   - Must be positive integer
   - Real-time validation

4. **Cart Management**:

   - Add multiple items
   - Remove items
   - Calculate subtotals and total
   - Display itemized receipt

5. **Sale Processing**:
   - Atomic transaction
   - Deducts stock quantity
   - Creates sale record
   - Updates inventory

### 3.2 Sales Validation Rules

#### Stock Validation:

- **Expiry Check**: Cannot sell expired stock
- **Quantity Check**: Cannot sell more than available
- **Batch Selection**: Must select valid batch

#### Transaction Integrity:

- **Atomic Operations**: All-or-nothing transaction
- **Stock Deduction**: Automatic quantity reduction
- **Sale Recording**: Complete audit trail

### 3.3 Sales History & Reporting

#### Sales Records Include:

- Medicine name and batch number
- Quantity sold
- Sale price per unit
- Sale date
- Total amount

#### Search & Filter:

- By medicine name
- By batch number
- By date range
- Real-time search

## 4. Inventory Tracking & Analytics

### 4.1 Real-time Inventory Updates

#### Automatic Updates:

- **Stock Reduction**: On every sale
- **Expiry Monitoring**: Daily checks
- **Low Stock Alerts**: Real-time detection

#### Manual Updates:

- **Stock Addition**: Through CSV upload or admin
- **Stock Adjustment**: Manual corrections
- **Batch Management**: Add new batches

### 4.2 Reporting & Analytics

#### Available Reports:

- **Stock Summary**: Total value, counts, alerts
- **Sales History**: Transaction records
- **Low Stock Report**: Reorder recommendations
- **Expiry Report**: Expiring stock alerts

#### Key Metrics:

- **Inventory Turnover**: Sales vs stock value
- **Expiry Risk**: Stock expiring soon
- **Reorder Needs**: Below minimum levels
- **Sales Performance**: Daily/monthly sales

## 5. System Integration Points

### 5.1 Admin Interface

- **CSV Upload**: Bulk medicine import
- **AI Enrichment**: Missing field generation
- **Stock Management**: Manual adjustments
- **User Management**: Admin-only account creation

### 5.2 Frontend Dashboard

- **Real-time Updates**: Live stock levels
- **Interactive Tables**: Sortable, filterable
- **Alert System**: Visual notifications
- **Responsive Design**: Mobile-friendly

### 5.3 API Architecture

- **RESTful Endpoints**: Standard HTTP methods
- **Authentication**: JWT-based security
- **Permissions**: Role-based access control
- **Error Handling**: Comprehensive error responses

## 6. Data Flow Summary

### Complete Process:

```
CSV Upload → AI Enrichment → Stock Creation → Sales Processing → Inventory Updates → Reporting
```

### Key Features:

- **AI-Powered**: Automatic field generation for missing data
- **Real-time**: Live inventory updates
- **Comprehensive**: Full audit trail
- **User-friendly**: Intuitive interfaces
- **Scalable**: Handles large inventories
- **Secure**: Admin-controlled access

This system provides a complete pharmacy management solution with intelligent data processing, real-time inventory tracking, and comprehensive sales management.
