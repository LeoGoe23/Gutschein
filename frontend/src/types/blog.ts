export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  featuredImage: string | null;
  metaTitle: string;
  metaDescription: string;
  status: 'draft' | 'published';
  author: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  views: number;
}

export interface CreateBlogPostDto {
  title: string;
  slug?: string;
  content: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: 'draft' | 'published';
}

export interface UpdateBlogPostDto extends Partial<CreateBlogPostDto> {
  _id: string;
}
