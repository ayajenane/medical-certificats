import axios from 'axios';

// URL du backend configurable via variable d'env, avec fallback pour le dev local
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// instance axios utilisée partout dans l'app pour parler au backend
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajouter le token JWT à chaque requête (si l'utilisateur est connecté)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
