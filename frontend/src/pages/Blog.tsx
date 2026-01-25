import { Box, Container, Typography, Card, CardContent, CardActionArea, Chip, CircularProgress, Avatar } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { blogService } from '../services/blogService';
import { BlogPost } from '../types/blog';
import SEOHead from '../components/blog/SEOHead';
import StructuredData from '../components/StructuredData';
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
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getExcerpt = (content: string, maxLength: number = 160) => {
    const stripped = content.replace(/<[^>]*>/g, '');
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  const getReadingTime = (content: string) => {
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} Min. Lesezeit`;
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)' }}>
      <SEOHead
        title="Gutschein Marketing Blog | Tipps für digitale Gutscheine - Gutscheinery"
        description="Expertenwissen zu digitalem Gutschein-Verkauf: Marketing-Strategien, Umsatzsteigerung, Best Practices für Restaurants, Wellness & mehr. Jetzt lesen!"
        type="website"
      />
      <StructuredData 
        type="breadcrumb" 
        data={{
          items: [
            { name: 'Home', url: 'https://gutscheinery.de' },
            { name: 'Blog', url: 'https://gutscheinery.de/blog' }
          ]
        }} 
      />

      {/* Header */}
      <Box sx={{ position: 'relative', backgroundColor: 'transparent' }}>
        <LogoTopLeft />
        <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
          <TopBar />
        </Box>

        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ pt: { xs: 12, md: 18 }, pb: { xs: 8, md: 12 } }}>
          <Box sx={{ textAlign: 'center', position: 'relative' }}>
            {/* Decorative element */}
            <Box
              sx={{
                position: 'absolute',
                top: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                opacity: 0.1,
                filter: 'blur(20px)'
              }}
            />
            <Chip
              icon={<TrendingUpIcon sx={{ fontSize: '1rem' }} />}
              label="BLOG"
              sx={{
                mb: 3,
                backgroundColor: '#f3f4f6',
                color: '#667eea',
                fontWeight: 700,
                fontSize: '0.875rem',
                px: 2,
                py: 2.5,
                height: 'auto',
                '& .MuiChip-icon': { color: '#667eea' }
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '4rem' },
                fontWeight: 900,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
                lineHeight: 1.1,
                letterSpacing: '-0.02em'
              }}
            >
              Wissen & Inspiration
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.125rem', md: '1.5rem' },
                fontWeight: 400,
                color: '#6b7280',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Entdecke wertvolle Einblicke, praktische Tipps und erfolgreiche Strategien<br/>
              für dein digitales Gutschein-Business
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Blog Posts */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, pb: { xs: 8, md: 14 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#667eea' }} />
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h5" sx={{ color: '#9ca3af', fontWeight: 600 }}>
              Noch keine Blogbeiträge vorhanden
            </Typography>
            <Typography variant="body1" sx={{ color: '#d1d5db', mt: 1 }}>
              Schau bald wieder vorbei für spannende Inhalte!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
            gap: { xs: 3, md: 4 } 
          }}>
            {posts.map((post, index) => (
              <Card
                key={post._id}
                onClick={() => handlePostClick(post.slug)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid #f3f4f6',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)',
                    '& .blog-image': {
                      transform: 'scale(1.05)'
                    },
                    '& .blog-title': {
                      color: '#667eea'
                    }
                  },
                  ...(index === 0 && {
                    gridColumn: { md: 'span 2', lg: 'span 2' },
                    flexDirection: { md: 'row' },
                    '& .blog-image-container': {
                      width: { md: '45%' },
                      height: { xs: '240px', md: 'auto' }
                    },
                    '& .blog-content': {
                      width: { md: '55%' },
                      p: { xs: 3, md: 4 }
                    }
                  })
                }}
              >
                {/* Featured Image */}
                {post.featuredImage && (
                  <Box
                    className="blog-image-container"
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      height: index === 0 ? { xs: '240px', md: '100%' } : '220px',
                      backgroundColor: '#f3f4f6'
                    }}
                  >
                    <Box
                      component="img"
                      className="blog-image"
                      src={post.featuredImage}
                      alt={post.title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                    {/* Gradient Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)'
                      }}
                    />
                  </Box>
                )}

                {/* Content */}
                <CardContent
                  className="blog-content"
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    p: 3,
                    ...(index === 0 && { p: { xs: 3, md: 4 } })
                  }}
                >
                  {/* Meta Info */}
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Chip
                      icon={<AccessTimeIcon sx={{ fontSize: '0.875rem' }} />}
                      label={formatDate(post.publishedAt || post.createdAt)}
                      size="small"
                      sx={{
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: '24px',
                        '& .MuiChip-icon': { color: '#9ca3af' }
                      }}
                    />
                    <Chip
                      label={getReadingTime(post.content)}
                      size="small"
                      sx={{
                        backgroundColor: '#ede9fe',
                        color: '#7c3aed',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: '24px'
                      }}
                    />
                  </Box>

                  {/* Title */}
                  <Typography
                    className="blog-title"
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      mb: 1.5,
                      color: '#111827',
                      fontSize: index === 0 ? { xs: '1.5rem', md: '1.875rem' } : '1.25rem',
                      lineHeight: 1.3,
                      transition: 'color 0.3s',
                      display: '-webkit-box',
                      WebkitLineClamp: index === 0 ? 2 : 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {post.title}
                  </Typography>

                  {/* Excerpt */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6b7280',
                      lineHeight: 1.7,
                      mb: 2.5,
                      flexGrow: 1,
                      fontSize: index === 0 ? '1rem' : '0.9375rem',
                      display: '-webkit-box',
                      WebkitLineClamp: index === 0 ? 3 : 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {getExcerpt(post.content, index === 0 ? 200 : 140)}
                  </Typography>

                  {/* Author & Views */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 'auto' }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '0.875rem',
                        fontWeight: 700
                      }}
                    >
                      {post.author.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: '#374151',
                          fontWeight: 600,
                          fontSize: '0.8125rem'
                        }}
                      >
                        {post.author}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: '#9ca3af',
                          fontSize: '0.75rem'
                        }}
                      >
                        {post.views.toLocaleString('de-DE')} Aufrufe
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>

      <Footer />
    </Box>
  );
}
