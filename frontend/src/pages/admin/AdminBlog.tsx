import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { blogService } from '../../services/blogService';
import { BlogPost } from '../../types/blog';

export default function AdminBlog() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await blogService.getAllPosts();
      setPosts(data);
    } catch (error) {
      console.error('Fehler beim Laden der Blog-Posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (post: BlogPost) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    try {
      await blogService.deletePost(postToDelete._id);
      setPosts(posts.filter(p => p._id !== postToDelete._id));
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Fehler beim Löschen des Blog-Posts:', error);
      alert('Fehler beim Löschen des Blog-Posts');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Blog-Verwaltung
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/blog/new')}
          sx={{
            backgroundColor: '#4F46E5',
            '&:hover': { backgroundColor: '#4338CA' }
          }}
        >
          Neuer Beitrag
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Noch keine Blog-Beiträge vorhanden
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Erstelle deinen ersten Blog-Beitrag, um loszulegen.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/blog/new')}
          >
            Ersten Beitrag erstellen
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Titel</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Slug</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Aufrufe</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Erstellt</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Aktualisiert</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {post.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {post.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={post.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                      color={post.status === 'published' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <VisibilityIcon fontSize="small" sx={{ color: '#6b7280' }} />
                      <Typography variant="body2">{post.views}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(post.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(post.updatedAt)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/admin/blog/edit/${post._id}`)}
                      sx={{ color: '#4F46E5' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(post)}
                      sx={{ color: '#dc2626' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Blog-Beitrag löschen?</DialogTitle>
        <DialogContent>
          <Typography>
            Möchtest du den Blog-Beitrag "<strong>{postToDelete?.title}</strong>" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
