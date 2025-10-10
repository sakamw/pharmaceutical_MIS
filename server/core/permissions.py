from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')


class IsManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ('ADMIN', 'MANAGER')


class ReadOnlyOrStaff(BasePermission):
    """
    Read-only for STAFF role.
    Full access for ADMIN and MANAGER.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Allow read-only for all authenticated users
        if request.method in SAFE_METHODS:
            return True
        
        # Only ADMIN and MANAGER can create/update/delete
        return request.user.role in ('ADMIN', 'MANAGER')


class CanMakeSales(BasePermission):
    """
    All authenticated users can make sales (including STAFF).
    Only ADMIN and MANAGER can update/delete sales.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Allow read for all authenticated users
        if request.method in SAFE_METHODS:
            return True
        
        # Allow POST (create sales) for all authenticated users
        if request.method == 'POST':
            return True
        
        # Only ADMIN and MANAGER can update/delete
        return request.user.role in ('ADMIN', 'MANAGER')



