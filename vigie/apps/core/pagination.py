from rest_framework.pagination import PageNumberPagination


class FlexiblePagination(PageNumberPagination):
    """Pagination par défaut, avec ``?page_size=`` (max 100) pour le Kanban."""

    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 100
