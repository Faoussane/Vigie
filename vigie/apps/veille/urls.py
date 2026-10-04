from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import VeilleItemViewSet, VeilleStatsView

router = DefaultRouter()
router.register("veille/items", VeilleItemViewSet, basename="veille-item")
urlpatterns = router.urls + [path("veille/stats/", VeilleStatsView.as_view(), name="veille-stats")]
