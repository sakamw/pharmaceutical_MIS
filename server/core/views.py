from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .serializers import RegisterSerializer, UserSerializer


User = get_user_model()


class AdminCreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.IsAdminUser]


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserCountView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, _request):
        return Response({"count": User.objects.count()})


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    
    def validate_new_password(self, value):
        validate_password(value)
        return value


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            current_password = serializer.validated_data['current_password']
            new_password = serializer.validated_data['new_password']
            
            # Verify current password
            if not user.check_password(current_password):
                return Response(
                    {'error': 'Current password is incorrect'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password and clear initial_password
            user.set_password(new_password)
            user.initial_password = None  # Clear the initial password
            user.save()
            
            return Response({'message': 'Password changed successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


