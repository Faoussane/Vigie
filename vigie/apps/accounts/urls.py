from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register("users", views.UserAdminViewSet, basename="user")
router.register("authors", views.AuthorViewSet, basename="author")

urlpatterns = [
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/me/", views.MeView.as_view(), name="me"),
    path("auth/me/avatar/", views.AvatarView.as_view(), name="avatar"),
    path("auth/password/change/", views.PasswordChangeView.as_view(), name="password-change"),
    path("auth/password/reset/", views.PasswordResetRequestView.as_view(), name="password-reset"),
    path("auth/password/reset/confirm/", views.PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
] + router.urls
