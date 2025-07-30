import LogoTopLeft from '../components/home/TopLeftLogo';
import Footer from '../components/home/Footer';


import React, { useState } from 'react';
import { useEffect } from 'react';
import { Box, Button, Container, TextField, Typography } from '@mui/material';

export default function Kontakt() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('https://formspree.io/f/mnnzdwev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      alert('Vielen Dank für deine Nachricht!');
      setForm({ name: '', email: '', message: '' });
    } else {
      alert('Fehler beim Senden. Bitte versuche es erneut.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexGrow: 1 }}>
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <LogoTopLeft />
          <Box sx={{ pt: '6rem' }} />
          <Typography variant="h4" gutterBottom>
            Kontaktiere uns
          </Typography>

          <Typography variant="body1" sx={{ mb: 2 }}>
            Telefonnummer: 0176 72910739<br />
            E-Mail: gutscheinfabrik@gmail.com
          </Typography>

          <Box
            component="form"
            onSubmit={sendEmail}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="E-Mail"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Nachricht"
              name="message"
              value={form.message}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              required
            />
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>
              Senden
            </Button>
          </Box>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}