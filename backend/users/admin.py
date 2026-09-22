from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'phone_number', 'is_staff', 'last_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Extra', {'fields': ('phone_number', 'last_active')}),
    )
