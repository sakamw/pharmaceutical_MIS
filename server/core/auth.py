from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import serializers

User = get_user_model()

class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    def validate(self, attrs):
        # Accept either username or email in the 'username' field from client
        login_identifier = attrs.get('username')
        password = attrs.get('password')
        if not login_identifier or not password:
            raise serializers.ValidationError({'detail': 'Username/email and password are required.'})

        username_to_auth = None

        # Try email lookup if identifier contains '@'
        if '@' in login_identifier:
            try:
                user = User.objects.get(email__iexact=login_identifier)
                username_to_auth = getattr(user, self.username_field)
            except User.DoesNotExist:
                # Fall back to using the identifier as username
                username_to_auth = login_identifier
        else:
            username_to_auth = login_identifier

        # Authenticate with resolved username
        user = authenticate(**{self.username_field: username_to_auth, 'password': password})
        if not user:
            raise serializers.ValidationError({'detail': 'No active account found with the given credentials'})

        if not user.is_active:
            raise serializers.ValidationError({'detail': 'User account is disabled'})

        # Let base class generate tokens
        data = super().validate({
            'username': getattr(user, self.username_field),
            'password': password,
        })
        return data

class EmailOrUsernameTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenObtainPairSerializer
