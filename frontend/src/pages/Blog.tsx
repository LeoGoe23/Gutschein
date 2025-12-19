import { Box, Container, Typography, Grid, Card, CardMedia, CardContent, CardActionArea, Chip, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogService } from '../services/blogService';
import { BlogPost } from '../types/blog';
import SEOHead from '../components/blog/SEOHead';
import TopBar from '../components/home/TopBar';
import LogoTopLeft from '../components/home/TopLeftLogo';
import Footer from '../components/home/Footer';

export default function Blog() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await blogService.getAllPublishedPosts();
      setPosts(data);
    } catch (error) {
      console.error('Fehler beim Laden der Blog-Posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (slug: string) => {
    navigate(`/blog/${slug}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getExcerpt = (content: string, maxLength: number = 150) => {
    const stripped = content.replace(/<[^>]*>/g, '');
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <SEOHead
        title="Blog - Gutscheinery | Tipps und Tricks für digitale Gutscheine"
        description="Entdecke hilfreiche Artikel, Tipps und Best Practices rund um digitale Gutscheine, Marketing und E-Commerce."
        type="website"
      />

      {/* Header */}
      <Box sx={{ position: 'relative', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <LogoTopLeft />
        <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
          <TopBar />
        </Box>

        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ pt: { xs: 10, md: 15 }, pb: { xs: 6, md: 8 } }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2rem', md: '3.5rem' },
                fontWeight: 800,
                color: '#111827',
                mb: 2
              }}
            >
              Unser Blog
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1rem', md: '1.25rem' },
                fontWeight: 400,
                color: '#6b7280',
                maxWidth: '700px',
                mx: 'auto'
              }}
            >
              Tipps, Tricks und Best Practices für digitale Gutscheine und erfolgreiches Marketing
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Blog Posts */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h5" color="text.secondary">
              Noch keine Blogbeiträge vorhanden
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {posts.map((post) => (
              <Grid item xs={12} md={6} lg={4} key={post._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <CardActionArea onClick={() => handlePostClick(post.slug)} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    {post.featuredImage && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={post.featuredImage}
                        alt={post.title}
                        sx={{ objectFit: 'cover' }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={formatDate(post.publishedAt || post.createdAt)}
                          size="small"
                          sx={{ backgroundColor: '#e5e7eb', color: '#374151', fontWeight: 600 }}
                        />
                      </Box>
                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                          fontWeight: 700,
                          mb: 1.5,
                          color: '#111827',
                          fontSize: '1.25rem'
                        }}
                      >
                        {post.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, flexGrow: 1 }}
                      >
                        {getExcerpt(post.content)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                        <Typography variant="caption" color="text.secondary">
                          {post.author}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: '#4F46E5', fontWeight: 600 }}
                        >
                          Weiterlesen →
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Footer />
    </Box>
  );
}
