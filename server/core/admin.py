from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm
from django import forms
from django.contrib import messages


User = get_user_model()


class CustomUserCreationForm(UserCreationForm):
    # Render passwords as visible text inputs so admin can see what they type
    password1 = forms.CharField(label="Password", widget=forms.TextInput(attrs={'type': 'text'}))
    password2 = forms.CharField(label="Password confirmation", widget=forms.TextInput(attrs={'type': 'text'}))

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username", "email")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Ensure email is visible on the add form; set required if desired
        self.fields["email"].required = True


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Limit the add form to only username, email, password, confirm password
    add_form = CustomUserCreationForm
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "password1", "password2"),
        }),
    )

    # Show role and the stored initial password on the change form
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Role & Credentials", {"fields": ("role", "initial_password")}),
    )

    # Make the stored initial password read-only in admin to prevent edits
    readonly_fields = getattr(BaseUserAdmin, 'readonly_fields', ()) + ("initial_password",)

    list_display = ('id', 'username', 'email', 'role', 'is_active')
    list_filter = ('role', 'is_active')
    search_fields = ('username', 'email')

    # Add action to changelist dropdown
    actions = ['view_passwords']

    @admin.action(description="View password")
    def view_passwords(self, request, queryset):
        if not request.user.is_superuser:
            self.message_user(request, "You do not have permission to view passwords.", level=messages.ERROR)
            return
        lines = []
        for user in queryset:
            pw = user.initial_password or "(not available)"
            lines.append(f"{user.username}: {pw}")
        if lines:
            # Display as a single admin message; newlines will render as line breaks in HTML
            self.message_user(request, "Passwords:\n" + "\n".join(lines), level=messages.INFO)
        else:
            self.message_user(request, "No users selected.", level=messages.WARNING)

    def save_model(self, request, obj, form, change):
        # On user creation, store the initial plaintext password for admin visibility
        if not change:
            initial_pw = form.cleaned_data.get('password1')
            if initial_pw:
                obj.initial_password = initial_pw
        super().save_model(request, obj, form, change)
