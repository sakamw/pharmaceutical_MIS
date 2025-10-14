from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import AdminCreateUserView, MeView, UserCountView, ChangePasswordView
from .auth import EmailOrUsernameTokenObtainPairView


urlpatterns = [
    path('admin/create-user/', AdminCreateUserView.as_view(), name='admin_create_user'),
    path('login/', EmailOrUsernameTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('users/count/', UserCountView.as_view(), name='users_count'),
]



