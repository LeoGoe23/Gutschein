import axios from 'axios';
import { BlogPost, CreateBlogPostDto, UpdateBlogPostDto } from '../types/blog';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const blogService = {
  // Alle veröffentlichten Blog-Posts abrufen (öffentlich)
  async getAllPublishedPosts(): Promise<BlogPost[]> {
    const response = await axios.get<BlogPost[]>(`${API_URL}/api/blog`);
    return response.data;
  },

  // Alle Blog-Posts abrufen (Admin - inkl. Drafts)
  async getAllPosts(): Promise<BlogPost[]> {
    const response = await axios.get<BlogPost[]>(`${API_URL}/api/blog/admin/all`);
    return response.data;
  },

  // Einzelnen Blog-Post nach Slug abrufen
  async getPostBySlug(slug: string): Promise<BlogPost> {
    const response = await axios.get<BlogPost>(`${API_URL}/api/blog/${slug}`);
    return response.data;
  },

  // Neuen Blog-Post erstellen
  async createPost(post: CreateBlogPostDto): Promise<BlogPost> {
    const response = await axios.post<BlogPost>(`${API_URL}/api/blog`, post);
    return response.data;
  },

  // Blog-Post aktualisieren
  async updatePost(id: string, post: Partial<CreateBlogPostDto>): Promise<BlogPost> {
    const response = await axios.put<BlogPost>(`${API_URL}/api/blog/${id}`, post);
    return response.data;
  },

  // Blog-Post löschen
  async deletePost(id: string): Promise<void> {
    await axios.delete(`${API_URL}/api/blog/${id}`);
  },

  // Slug aus Titel generieren
  async generateSlug(title: string): Promise<string> {
    const response = await axios.post<{ slug: string }>(`${API_URL}/api/blog/generate-slug`, { title });
    return response.data.slug;
  }
};
