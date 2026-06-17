import axios from 'axios';

const API_BASE = 'http://localhost:81/cornapp';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productoService = {
  getAll: () => api.get('/ProductoController'),
  getById: (id) => api.get(`/ProductoController/${id}`),
};

export const comboService = {
  getAll: () => api.get('/ComboController'),
  getById: (id) => api.get(`/ComboController/${id}`),
};

export const menuService = {
  getAll: () => api.get('/MenuController'),
  getById: (id) => api.get(`/MenuController/${id}`),
  getDisponible: () => api.get('/MenuController/disponible'),
};

export const procesoService = {
  getAll: () => api.get('/ProcesoPreparacionController'),
  getById: (id) => api.get(`/ProcesoPreparacionController/${id}`),
};

export default api;
