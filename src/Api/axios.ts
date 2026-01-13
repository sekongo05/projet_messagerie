import axios from 'axios';

// Instance axios configurée pour l'application
const axiosInstance = axios.create({
  baseURL: '', // Utilise le proxy Vite défini dans vite.config.ts
  timeout: 10000,
});

export default axiosInstance;
