from django.urls import path

from . import views

urlpatterns = [
    path("ai/summarize/", views.SummarizeView.as_view()),
    path("ai/extract/", views.ExtractView.as_view()),
    path("ai/classify/", views.ClassifyView.as_view()),
    path("ai/assist/", views.AssistView.as_view()),
    path("ai/search/", views.SmartSearchView.as_view()),
    path("ai/recommendations/", views.RecommendationsView.as_view()),
    path("ai/trends/", views.TrendsView.as_view()),
]
