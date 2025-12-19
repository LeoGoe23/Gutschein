import { Box, Container, Typography, CircularProgress, Chip, Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <SEOHead post={post} type="article" />

      {/* Header */}
      <Box sx={{ position: 'relative', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <LogoTopLeft />
        <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
          <TopBar />
        </Box>

        {/* Back Button */}
        <Container maxWidth="md" sx={{ pt: { xs: 10, md: 12 }, pb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/blog')}
            sx={{
              color: '#6b7280',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: 'transparent', color: '#111827' }
            }}
          >
            Zurück zur Übersicht
          </Button>
        </Container>
      </Box>

      {/* Article */}
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <article>
          {/* Featured Image */}
          {post.featuredImage && (
            <Box
              component="img"
              src={post.featuredImage}
              alt={post.title}
              sx={{
                width: '100%',
                height: { xs: '200px', md: '400px' },
                objectFit: 'cover',
                borderRadius: 2,
                mb: 4
              }}
            />
          )}

          {/* Metadata */}
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={<AccessTimeIcon />}
              label={formatDate(post.publishedAt || post.createdAt)}
              sx={{ backgroundColor: '#e5e7eb', color: '#374151', fontWeight: 600 }}
            />
            <Chip
              icon={<VisibilityIcon />}
              label={`${post.views} Aufrufe`}
              sx={{ backgroundColor: '#e5e7eb', color: '#374151', fontWeight: 600 }}
            />
            <Typography variant="body2" color="text.secondary">
              von {post.author}
            </Typography>
          </Box>

          {/* Title */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 800,
              color: '#111827',
              mb: 3,
              lineHeight: 1.2
            }}
          >
            {post.title}
          </Typography>

          {/* Meta Description */}
          {post.metaDescription && (
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                fontWeight: 400,
                color: '#6b7280',
                mb: 4,
                fontStyle: 'italic',
                borderLeft: '4px solid #4F46E5',
                pl: 3,
                py: 1
              }}
            >
              {post.metaDescription}
            </Typography>
          )}

          {/* Content */}
          <Box
            sx={{
              backgroundColor: '#fff',
              borderRadius: 2,
              p: { xs: 3, md: 5 },
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                fontWeight: 700,
                color: '#111827',
                mt: 4,
                mb: 2
              },
              '& h1': { fontSize: '2rem' },
              '& h2': { fontSize: '1.75rem' },
              '& h3': { fontSize: '1.5rem' },
              '& p': {
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: '#374151',
                mb: 2
              },
              '& a': {
                color: '#4F46E5',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': { textDecoration: 'underline' }
              },
              '& ul, & ol': {
                pl: 3,
                mb: 2
              },
              '& li': {
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: '#374151',
                mb: 1
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 2,
                my: 3
              },
              '& blockquote': {
                borderLeft: '4px solid #4F46E5',
                pl: 3,
                py: 1,
                fontStyle: 'italic',
                color: '#6b7280',
                my: 3
              },
              '& code': {
                backgroundColor: '#f3f4f6',
                padding: '2px 6px',
                borderRadius: 1,
                fontSize: '0.9em',
                fontFamily: 'monospace'
              },
              '& pre': {
                backgroundColor: '#1f2937',
                color: '#f9fafb',
                p: 3,
                borderRadius: 2,
                overflow: 'auto',
                my: 3
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
