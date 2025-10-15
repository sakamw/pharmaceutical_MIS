# PharmaCare User Permissions & Supplier Management

## User Roles & Permissions

### **Role Hierarchy:**

1. **ADMIN** - Full system access
2. **MANAGER** - Management-level access
3. **STAFF** - Operational access (Pharmacy Sales Staff)

### **Permission Matrix:**

| Feature                 | ADMIN                 | MANAGER        | STAFF          | Description                          |
| ----------------------- | --------------------- | -------------- | -------------- | ------------------------------------ |
| **User Management**     | ✅ Create/Edit/Delete | ❌             | ❌             | Only admins can create user accounts |
| **Medicine Management** | ✅ Full Access        | ✅ Full Access | ✅ Full Access | All staff can manage medicines       |
| **Stock Management**    | ✅ Full Access        | ✅ Full Access | ✅ Full Access | All staff can add/edit/delete stock  |
| **Sales Processing**    | ✅ Full Access        | ✅ Full Access | ✅ Full Access | All staff can process sales          |
| **Supplier Management** | ✅ Full Access        | ✅ Full Access | ✅ Full Access | All staff can manage suppliers       |
| **Reports & Analytics** | ✅ Full Access        | ✅ Full Access | ✅ Read Only   | Staff can view reports               |

### **Key Changes Made:**

#### **1. Fixed Permission System**

- **Before**: Used Django's built-in `is_staff` flag (confusing)
- **After**: Uses custom `role` field (ADMIN/MANAGER/STAFF)
- **Result**: Clear role-based permissions

#### **2. STAFF Users Can Now:**

- ✅ **Add Stock**: Create new stock batches
- ✅ **Edit Stock**: Update existing stock information
- ✅ **Delete Stock**: Remove stock batches
- ✅ **Process Sales**: Complete sales transactions
- ✅ **Manage Suppliers**: Add/edit supplier information
- ✅ **View Reports**: Access all analytics and reports

#### **3. Permission Classes Created:**

- `CanManageStock`: STAFF+ can manage stock
- `CanProcessSales`: STAFF+ can process sales
- `IsStaffOrReadOnly`: STAFF+ can modify, others read-only
- `ReadOnlyOrStaff`: All can read/create, STAFF+ can update/delete

## Supplier Management System

### **Supplier Model:**

```python
class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    reliability_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
```

### **Supplier Features:**

#### **1. Basic Information:**

- **Name**: Supplier company name
- **Contact Person**: Primary contact
- **Phone**: Contact number
- **Email**: Email address
- **Reliability Rating**: 0.00-9.99 rating system

#### **2. Integration with Medicines:**

- **Medicine-Supplier Link**: Each medicine can have a supplier
- **CSV Upload**: Suppliers auto-created during CSV import
- **Stock Tracking**: Track which supplier provided each batch

#### **3. Supplier Management Interface:**

- **Add Supplier**: Create new supplier records
- **Edit Supplier**: Update supplier information
- **Delete Supplier**: Remove supplier (if no medicines linked)
- **Search & Filter**: Find suppliers quickly
- **Reliability Tracking**: Monitor supplier performance

### **Supplier Logic Flow:**

#### **1. During CSV Upload:**

```
CSV Row → Extract Supplier Name → Check if exists → Create if new → Link to Medicine
```

#### **2. During Stock Management:**

```
Add Stock → Select Medicine → Medicine shows supplier → Track batch origin
```

#### **3. During Reporting:**

```
Stock Reports → Group by Supplier → Analyze supplier performance
```

## Complete User Workflow

### **For STAFF Users (Pharmacy Sales Staff):**

#### **Daily Operations:**

1. **Login** with admin-provided credentials
2. **Change Password** on first login (mandatory)
3. **View Dashboard** with stock alerts and summaries
4. **Process Sales** using point-of-sale interface
5. **Manage Stock** - add new batches, update quantities
6. **Check Alerts** - low stock, expiring items
7. **Update Suppliers** - add new suppliers as needed

#### **Stock Management Tasks:**

- **Add New Stock**: When deliveries arrive
- **Update Quantities**: After sales or adjustments
- **Track Expiry**: Monitor expiring batches
- **Reorder Alerts**: Respond to low stock warnings

#### **Sales Processing:**

- **Select Medicine**: Choose from available inventory
- **Select Batch**: Pick specific stock batch (FIFO)
- **Enter Quantity**: Specify amount to sell
- **Process Sale**: Complete transaction
- **Inventory Update**: Automatic stock deduction

### **For ADMIN Users:**

#### **User Management:**

1. **Create Staff Accounts**: Generate random passwords
2. **Provide Credentials**: Share login details with staff
3. **Monitor Activity**: Track user actions
4. **Manage Permissions**: Adjust role assignments

#### **System Administration:**

- **CSV Upload**: Bulk medicine import with AI enrichment
- **Data Management**: Clean up and maintain data
- **System Configuration**: Adjust settings and parameters

## Security & Access Control

### **Authentication:**

- **JWT Tokens**: Secure API authentication
- **Password Policy**: Strong password requirements
- **Session Management**: Automatic token refresh

### **Authorization:**

- **Role-Based**: Clear permission hierarchy
- **API Protection**: All endpoints properly secured
- **Frontend Guards**: UI elements respect permissions

### **Data Protection:**

- **Admin-Only Creation**: Only admins can create accounts
- **Random Passwords**: Secure initial passwords
- **Mandatory Change**: Users must change passwords
- **Audit Trail**: Complete transaction logging

## Benefits of This System

### **For Pharmacy Operations:**

- **Staff Empowerment**: Sales staff can manage inventory
- **Reduced Bottlenecks**: No need to wait for admin approval
- **Real-time Updates**: Immediate inventory changes
- **Better Accuracy**: Staff can correct mistakes immediately

### **For Management:**

- **Complete Control**: Admin controls user creation
- **Audit Trail**: Full transaction history
- **Role Flexibility**: Easy to adjust permissions
- **Scalable System**: Handles growing team needs

### **For Business:**

- **Improved Efficiency**: Faster stock management
- **Better Service**: Staff can help customers immediately
- **Reduced Errors**: Real-time validation and updates
- **Cost Savings**: Less administrative overhead

This system provides a perfect balance between security (admin-controlled access) and efficiency (staff can manage daily operations), making it ideal for pharmacy management.

