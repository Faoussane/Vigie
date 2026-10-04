from django.contrib import admin

from .models import Collection, Comment, CommentReport, Favorite, Like

admin.site.register([Comment, CommentReport, Like, Favorite, Collection])
