import axios from 'axios';

export const API_BASE = 'hhttp://localhost:81/cornapp';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const resolveImageUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const productoService = {
  getAll: () => api.get('/ProductoController'),
  getAllMantenimiento: () => api.get('/ProductoController/mantenimiento'),
  getById: (id) => api.get(`/ProductoController/${id}`),
  create: (formData) =>
    api.post('/ProductoController/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (formData) =>
    api.post('/ProductoController/update', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const comboService = {
  getAll: () => api.get('/ComboController'),
  getAllMantenimiento: () => api.get('/ComboController/mantenimiento'),
  getById: (id) => api.get(`/ComboController/${id}`),
  create: (payload) => api.post('/ComboController/create', payload),
  update: (payload) => api.post('/ComboController/update', payload),
};

export const menuService = {
  getAll: () => api.get('/MenuController'),
  getById: (id) => api.get(`/MenuController/${id}`),
  getDisponible: () => api.get('/MenuController/disponible'),
  create: (payload) => api.post('/MenuController/create', payload),
  update: (payload) => api.post('/MenuController/update', payload),
};

export const procesoService = {
  getAll: () => api.get('/ProcesoPreparacionController'),
  getById: (id) => api.get(`/ProcesoPreparacionController/${id}`),
  getProductosDisponibles: () =>
    api.get('/ProcesoPreparacionController/productosDisponibles'),
  create: (payload) =>
    api.post('/ProcesoPreparacionController/create', payload),
  update: (payload) =>
    api.post('/ProcesoPreparacionController/update', payload),
};

export const categoriaService = {
  getAll: () => api.get('/CategoriaController'),
};

export const ingredienteService = {
  getAll: () => api.get('/IngredienteController'),
};

export const estacionService = {
  getAll: () => api.get('/EstacionController'),
};

export const cuponService = {
  getDisponibles: () => api.get('/CuponController'),
  getAllMantenimiento: () => api.get('/CuponController/mantenimiento'),
  getById: (id) => api.get(`/CuponController/${id}`),
  getPorProducto: (id) => api.get(`/CuponController/porProducto/${id}`),
  getPorCombo: (id) => api.get(`/CuponController/porCombo/${id}`),
  create: (payload) => api.post('/CuponController/create', payload),
  update: (payload) => api.post('/CuponController/update', payload),
};

export default api;
