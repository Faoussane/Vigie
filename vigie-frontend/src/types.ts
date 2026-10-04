/** Types TypeScript qui reflètent les réponses de l'API Django. */

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  articles_count?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Source {
  id: number;
  name: string;
  url: string;
  source_type: string;
  category: number | null;
  feed_url: string;
  check_frequency_minutes: number | null;
  is_active: boolean;
}

export interface ArticleSource {
  source: Source;
  consulted_at: string;
}

export type ArticleStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

export interface Article {
  id: number;
  title: string;
  slug: string;
  cover_image: string | null;
  summary: string;
  author: string;
  category: Category | null;
  tags: Tag[];
  status: ArticleStatus;
  published_at: string | null;
  view_count: number;
  comments_count: number;
  likes_count: number;
}

export interface ArticleDetail extends Article {
  content: string;
  article_sources: ArticleSource[];
  is_liked: boolean;
  is_favorited: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  article: string;
  author: string;
  content: string;
  is_hidden: boolean;
  reports_count: number;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  bio?: string;
  website?: string;
  avatar?: string | null;
  followed_categories?: number[];
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  is_active: boolean;
  date_joined: string;
}

export interface Author {
  username: string;
  bio: string;
  avatar: string | null;
  website: string;
  date_joined: string;
  articles_count: number;
}

export interface Collection {
  id: number;
  name: string;
  favorites_count: number;
}

export interface Favorite {
  id: number;
  article: Article;
  collection: number | null;
}

export interface Stats {
  articles: number;
  users: number;
  comments: number;
  views: number;
  recent_articles: { title: string; slug: string; view_count: number; status: string }[];
}

export type VeilleStatus = "NEW" | "TO_VERIFY" | "TO_ANALYZE" | "TO_WRITE" | "PUBLISHED" | "IGNORED";

export interface VeilleItem {
  id: number;
  source_name: string;
  title: string;
  url: string;
  summary: string;
  status: VeilleStatus;
  importance: number | null;
  suggested_category_name: string | null;
  article_slug: string | null;
  duplicate_of: number | null;
  ai_data: { tags?: string[]; technologies?: string[] };
}

export interface VeilleStats {
  sources_monitored: number;
  items_collected: number;
  articles_published: number;
  dominant_category: string | null;
  evolution: { category: string; count: number }[];
}

export interface NotificationItem {
  id: number;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface Trends {
  period_days: number;
  technologies: { name: string; count: number }[];
  themes: { name: string; count: number }[];
  categories: { name: string; count: number }[];
}
