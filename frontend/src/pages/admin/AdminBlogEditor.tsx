import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import CodeIcon from '@mui/icons-material/Code';
import { blogService } from '../../services/blogService';
import { BlogPost, CreateBlogPostDto } from '../../types/blog';

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== 'new';
  const contentEditableRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateBlogPostDto>({
    title: '',
    slug: '',
    content: '',
    featuredImage: '',
    metaTitle: '',
    metaDescription: '',
    status: 'draft'
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadPost(id);
    }
  }, [id, isEditMode]);

  const loadPost = async (postId: string) => {
    try {
      const post = await blogService.getPostBySlug(postId);
      if (!post) {
        // Versuche mit ID
        const response = await fetch(`/api/blog/admin/all`);
        const posts: BlogPost[] = await response.json();
        const foundPost = posts.find(p => p._id === postId);
        if (foundPost) {
          setFormData({
            title: foundPost.title,
            slug: foundPost.slug,
            content: foundPost.content,
            featuredImage: foundPost.featuredImage || '',
            metaTitle: foundPost.metaTitle,
            metaDescription: foundPost.metaDescription,
            status: foundPost.status
          });
          if (contentEditableRef.current) {
            contentEditableRef.current.innerHTML = foundPost.content;
          }
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des Blog-Posts:', error);
      alert('Fehler beim Laden des Blog-Posts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateBlogPostDto, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateSlug = async () => {
    if (!formData.title) return;
    try {
      const slug = await blogService.generateSlug(formData.title);
      setFormData(prev => ({ ...prev, slug }));
    } catch (error) {
      console.error('Fehler beim Generieren des Slugs:', error);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (contentEditableRef.current) {
      setFormData(prev => ({ ...prev, content: contentEditableRef.current!.innerHTML }));
    }
  };

  const insertLink = () => {
    const url = prompt('URL eingeben:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Bild-URL eingeben:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const handleContentChange = () => {
    if (contentEditableRef.current) {
      setFormData(prev => ({ ...prev, content: contentEditableRef.current!.innerHTML }));
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!formData.title || !formData.content) {
      alert('Titel und Inhalt sind erforderlich');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status,
        metaTitle: formData.metaTitle || formData.title,
        metaDescription: formData.metaDescription || formData.content.replace(/<[^>]*>/g, '').substring(0, 160)
      };

      if (isEditMode && id) {
        await blogService.updatePost(id, dataToSave);
      } else {
        await blogService.createPost(dataToSave);
      }

      navigate('/admin/blog');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Blog-Posts');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/blog')}
          sx={{ mb: 2 }}
        >
          Zurück zur Übersicht
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isEditMode ? 'Blog-Beitrag bearbeiten' : 'Neuer Blog-Beitrag'}
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        {/* Titel */}
        <TextField
          fullWidth
          label="Titel"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          onBlur={handleGenerateSlug}
          sx={{ mb: 3 }}
          required
        />

        {/* Slug */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Slug (URL-freundlich)"
            value={formData.slug}
            onChange={(e) => handleInputChange('slug', e.target.value)}
            helperText={`URL: gutscheinery.de/blog/${formData.slug || 'slug-hier'}`}
            required
          />
          <Button
            variant="outlined"
            onClick={handleGenerateSlug}
            sx={{ minWidth: '150px' }}
          >
            Auto-generieren
          </Button>
        </Box>

        {/* Featured Image */}
        <TextField
          fullWidth
          label="Featured Image URL (optional)"
          value={formData.featuredImage}
          onChange={(e) => handleInputChange('featuredImage', e.target.value)}
          sx={{ mb: 3 }}
          helperText="URL des Hauptbilds für den Beitrag"
        />

        {/* Rich Text Editor */}
        <Box sx={{ mb: 3 }}>
          <FormLabel sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
            Inhalt
          </FormLabel>

          {/* Toolbar */}
          <Paper sx={{ p: 1, mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap', backgroundColor: '#f3f4f6' }}>
            <Tooltip title="Fett">
              <IconButton size="small" onClick={() => execCommand('bold')}>
                <FormatBoldIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Kursiv">
              <IconButton size="small" onClick={() => execCommand('italic')}>
                <FormatItalicIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Unterstrichen">
              <IconButton size="small" onClick={() => execCommand('underline')}>
                <FormatUnderlinedIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ borderLeft: '1px solid #ccc', mx: 1 }} />
            <Tooltip title="Überschrift 1">
              <Button size="small" onClick={() => execCommand('formatBlock', '<h1>')}>H1</Button>
            </Tooltip>
            <Tooltip title="Überschrift 2">
              <Button size="small" onClick={() => execCommand('formatBlock', '<h2>')}>H2</Button>
            </Tooltip>
            <Tooltip title="Überschrift 3">
              <Button size="small" onClick={() => execCommand('formatBlock', '<h3>')}>H3</Button>
            </Tooltip>
            <Tooltip title="Absatz">
              <Button size="small" onClick={() => execCommand('formatBlock', '<p>')}>P</Button>
            </Tooltip>
            <Box sx={{ borderLeft: '1px solid #ccc', mx: 1 }} />
            <Tooltip title="Aufzählung">
              <IconButton size="small" onClick={() => execCommand('insertUnorderedList')}>
                <FormatListBulletedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Nummerierte Liste">
              <IconButton size="small" onClick={() => execCommand('insertOrderedList')}>
                <FormatListNumberedIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ borderLeft: '1px solid #ccc', mx: 1 }} />
            <Tooltip title="Link einfügen">
              <IconButton size="small" onClick={insertLink}>
                <LinkIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Bild einfügen">
              <IconButton size="small" onClick={insertImage}>
                <ImageIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Code">
              <IconButton size="small" onClick={() => execCommand('formatBlock', '<pre>')}>
                <CodeIcon />
              </IconButton>
            </Tooltip>
          </Paper>

          {/* Content Editable */}
          <Box
            ref={contentEditableRef}
            contentEditable
            onInput={handleContentChange}
            dangerouslySetInnerHTML={{ __html: formData.content }}
            sx={{
              minHeight: '400px',
              border: '1px solid #d1d5db',
              borderRadius: 1,
              p: 2,
              backgroundColor: '#fff',
              '&:focus': {
                outline: '2px solid #4F46E5',
                outlineOffset: '2px'
              },
              '& h1, & h2, & h3': { fontWeight: 700, mt: 2, mb: 1 },
              '& p': { mb: 1 },
              '& ul, & ol': { pl: 3 },
              '& pre': { backgroundColor: '#1f2937', color: '#fff', p: 2, borderRadius: 1, overflow: 'auto' },
              '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1, my: 2 }
            }}
          />
        </Box>

        {/* Meta Title */}
        <TextField
          fullWidth
          label="Meta Title (SEO)"
          value={formData.metaTitle}
          onChange={(e) => handleInputChange('metaTitle', e.target.value)}
          sx={{ mb: 3 }}
          helperText="Titel für Suchmaschinen (max. 60 Zeichen empfohlen)"
        />

        {/* Meta Description */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Meta Description (SEO)"
          value={formData.metaDescription}
          onChange={(e) => handleInputChange('metaDescription', e.target.value)}
          sx={{ mb: 3 }}
          helperText="Beschreibung für Suchmaschinen (max. 160 Zeichen empfohlen)"
        />

        {/* Status */}
        <FormControl sx={{ mb: 4 }}>
          <FormLabel>Veröffentlichungsstatus</FormLabel>
          <RadioGroup
            row
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published')}
          >
            <FormControlLabel value="draft" control={<Radio />} label="Entwurf" />
            <FormControlLabel value="published" control={<Radio />} label="Veröffentlicht" />
          </RadioGroup>
        </FormControl>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/admin/blog')}
            disabled={saving}
          >
            Abbrechen
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            Als Entwurf speichern
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSave('published')}
            disabled={saving}
            sx={{
              backgroundColor: '#4F46E5',
              '&:hover': { backgroundColor: '#4338CA' }
            }}
          >
            {saving ? <CircularProgress size={24} /> : 'Veröffentlichen'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
