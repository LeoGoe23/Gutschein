import { Box, Container, Typography, CircularProgress, Chip, Button, Avatar } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { blogService } from '../services/blogService';
import { BlogPost as BlogPostType } from '../types/blog';
import SEOHead from '../components/blog/SEOHead';
import TopBar from '../components/home/TopBar';
import LogoTopLeft from '../components/home/TopLeftLogo';
import Footer from '../components/home/Footer';

export default function BlogPost() {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Extract slug from either URL params or pathname
  const slug = paramSlug || location.pathname.replace('/', '');

  useEffect(() => {
    if (slug) {
      loadPost(slug);
    }
  }, [slug]);

  const loadPost = async (slug: string) => {
    try {
      const data = await blogService.getPostBySlug(slug);
      setPost(data);
      setError(false);
    } catch (error) {
      console.error('Fehler beim Laden des Blog-Posts:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !post) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Blog-Post nicht gefunden
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Der gesuchte Blog-Beitrag existiert nicht oder wurde entfernt.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/blog')}>
            Zurück zur Übersicht
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)' }}>
      <SEOHead post={post} type="article" />

      {/* Header */}
      <Box sx={{ position: 'relative', backgroundColor: 'transparent' }}>
        <LogoTopLeft />
        <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
          <TopBar />
        </Box>

        {/* Back Button */}
        <Container maxWidth="md" sx={{ pt: { xs: 10, md: 12 }, pb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/blog')}
            sx={{
              color: '#6b7280',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9375rem',
              px: 0,
              '&:hover': { 
                backgroundColor: 'transparent', 
                color: '#667eea',
                '& .MuiSvgIcon-root': {
                  transform: 'translateX(-4px)'
                }
              },
              '& .MuiSvgIcon-root': {
                transition: 'transform 0.2s'
              }
            }}
          >
            Zurück zum Blog
          </Button>
        </Container>
      </Box>

      {/* Article */}
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 }, pb: { xs: 8, md: 12 } }}>
        <article>
          {/* Featured Image */}
          {post.featuredImage && (
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: { xs: '280px', md: '500px' },
                borderRadius: 4,
                overflow: 'hidden',
                mb: 5,
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '40%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)'
                }
              }}
            >
              <Box
                component="img"
                src={post.featuredImage}
                alt={post.title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
          )}

          {/* Metadata */}
          <Box sx={{ 
            mb: 4, 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2, 
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: '1rem' }} />}
              label={formatDate(post.publishedAt || post.createdAt)}
              sx={{ 
                backgroundColor: '#f3f4f6', 
                color: '#374151', 
                fontWeight: 600,
                px: 1,
                '& .MuiChip-icon': { color: '#6b7280' }
              }}
            />
            <Chip
              icon={<VisibilityIcon sx={{ fontSize: '1rem' }} />}
              label={`${post.views.toLocaleString('de-DE')} Aufrufe`}
              sx={{ 
                backgroundColor: '#ede9fe', 
                color: '#7c3aed', 
                fontWeight: 600,
                px: 1,
                '& .MuiChip-icon': { color: '#7c3aed' }
              }}
            />
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              px: 2,
              py: 0.5
            }}>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {post.author.charAt(0).toUpperCase()}
              </Avatar>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#374151',
                  fontWeight: 600
                }}
              >
                {post.author}
              </Typography>
            </Box>
          </Box>

          {/* Title */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2.25rem', md: '3.5rem' },
              fontWeight: 900,
              color: '#111827',
              mb: 3,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              textAlign: 'center'
            }}
          >
            {post.title}
          </Typography>

          {/* Meta Description */}
          {post.metaDescription && (
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.125rem', md: '1.375rem' },
                fontWeight: 400,
                color: '#6b7280',
                mb: 6,
                lineHeight: 1.7,
                textAlign: 'center',
                fontStyle: 'italic',
                position: 'relative',
                px: { xs: 2, md: 4 },
                '&::before': {
                  content: '"\""',
                  position: 'absolute',
                  left: { xs: -10, md: 0 },
                  top: -10,
                  fontSize: '3rem',
                  color: '#e5e7eb',
                  fontFamily: 'Georgia, serif'
                }
              }}
            >
              {post.metaDescription}
            </Typography>
          )}

          {/* Content */}
          <Box
            sx={{
              backgroundColor: '#fff',
              borderRadius: 3,
              p: { xs: 3, md: 6 },
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6',
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                fontWeight: 800,
                color: '#111827',
                mt: 5,
                mb: 3,
                letterSpacing: '-0.01em',
                lineHeight: 1.3
              },
              '& h1': { 
                fontSize: { xs: '2rem', md: '2.5rem' },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              },
              '& h2': { 
                fontSize: { xs: '1.75rem', md: '2rem' },
                borderLeft: '4px solid #667eea',
                pl: 3
              },
              '& h3': { 
                fontSize: { xs: '1.5rem', md: '1.75rem' },
                color: '#374151'
              },
              '& h4': { fontSize: { xs: '1.25rem', md: '1.5rem' } },
              '& p': {
                fontSize: { xs: '1.0625rem', md: '1.125rem' },
                lineHeight: 1.85,
                color: '#374151',
                mb: 3
              },
              '& a': {
                color: '#667eea',
                textDecoration: 'none',
                fontWeight: 600,
                borderBottom: '2px solid transparent',
                transition: 'border-color 0.2s',
                '&:hover': { 
                  borderBottomColor: '#667eea'
                }
              },
              '& ul, & ol': {
                fontSize: { xs: '1.0625rem', md: '1.125rem' },
                lineHeight: 1.8,
                color: '#374151',
                mb: 3,
                pl: 4
              },
              '& li': {
                mb: 1.5,
                pl: 1
              },
              '& blockquote': {
                borderLeft: '4px solid #667eea',
                pl: 3,
                py: 2,
                my: 4,
                backgroundColor: '#f9fafb',
                borderRadius: 2,
                fontStyle: 'italic',
                color: '#6b7280',
                fontSize: { xs: '1.0625rem', md: '1.125rem' }
              },
              '& code': {
                backgroundColor: '#f3f4f6',
                color: '#7c3aed',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.9em',
                fontFamily: 'monospace'
              },
              '& pre': {
                backgroundColor: '#1f2937',
                color: '#e5e7eb',
                p: 3,
                borderRadius: 2,
                overflow: 'auto',
                mb: 3,
                '& code': {
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  px: 0,
                  py: 0
                }
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 2,
                my: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              },
              '& hr': {
                border: 'none',
                height: '1px',
                backgroundColor: '#e5e7eb',
                my: 5
              },
              '& table': {
                width: '100%',
                borderCollapse: 'collapse',
                mb: 3,
                '& th, & td': {
                  border: '1px solid #e5e7eb',
                  p: 2,
                  textAlign: 'left'
                },
                '& th': {
                  backgroundColor: '#f9fafb',
                  fontWeight: 700
                }
              }
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Share Section */}
          <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid #e5e7eb' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Artikel teilen
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  const url = window.location.href;
                  const text = `${post.title} - Gutscheinery Blog`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                }}
              >
                Auf Twitter teilen
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  const url = window.location.href;
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                }}
              >
                Auf Facebook teilen
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  alert('Link kopiert!');
                }}
              >
                Link kopieren
              </Button>
            </Box>
          </Box>
        </article>
      </Container>

      <Footer />
    </Box>
  );
}
