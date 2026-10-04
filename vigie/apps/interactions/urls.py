from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CollectionViewSet, CommentViewSet, FavoriteViewSet, StatsView

router = DefaultRouter()
router.register("comments", CommentViewSet, basename="comment")
router.register("favorites", FavoriteViewSet, basename="favorite")
router.register("collections", CollectionViewSet, basename="collection")
urlpatterns = router.urls + [path("admin/stats/", StatsView.as_view(), name="stats")]
