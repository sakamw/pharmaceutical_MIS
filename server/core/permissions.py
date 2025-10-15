from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')


class IsManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ('ADMIN', 'MANAGER')


class IsStaffOrReadOnly(BasePermission):
    """
    Only staff users (STAFF, MANAGER, ADMIN roles) can create, update, or delete.
    All authenticated users can read.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ('STAFF', 'MANAGER', 'ADMIN')


class ReadOnlyOrStaff(BasePermission):
    """
    All authenticated users can read and create.
    Only staff users (STAFF, MANAGER, ADMIN) can update or delete.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS or request.method == 'POST':
            return True
        return request.user.role in ('STAFF', 'MANAGER', 'ADMIN')


class CanManageStock(BasePermission):
    """
    STAFF, MANAGER, and ADMIN can manage stock (add, update, delete).
    All authenticated users can read stock information.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ('STAFF', 'MANAGER', 'ADMIN')


class CanProcessSales(BasePermission):
    """
    STAFF, MANAGER, and ADMIN can process sales.
    All authenticated users can read sales data.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ('STAFF', 'MANAGER', 'ADMIN')



