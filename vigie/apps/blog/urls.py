from rest_framework.routers import DefaultRouter

from .views import ArticleViewSet, CategoryViewSet, TagViewSet

router = DefaultRouter()
router.register("articles", ArticleViewSet, basename="article")
router.register("categories", CategoryViewSet, basename="category")
router.register("tags", TagViewSet, basename="tag")
urlpatterns = router.urls
