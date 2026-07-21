import axios from 'axios';

export const API_BASE = 'http://localhost:81/cornapp';

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
  desactivar: (id) =>
    api.post('/ProductoController/desactivar', { id_producto: id }),
  activar: (id) => api.post('/ProductoController/activar', { id_producto: id }),
};

export const comboService = {
  getAll: () => api.get('/ComboController'),
  getAllMantenimiento: () => api.get('/ComboController/mantenimiento'),
  getById: (id) => api.get(`/ComboController/${id}`),
  create: (payload) => api.post('/ComboController/create', payload),
  update: (payload) => api.post('/ComboController/update', payload),
  desactivar: (id) => api.post('/ComboController/desactivar', { id_combo: id }),
  activar: (id) => api.post('/ComboController/activar', { id_combo: id }),
};

export const menuService = {
  getAll: () => api.get('/MenuController'),
  getAllMantenimiento: () => api.get('/MenuController/mantenimiento'),
  getById: (id) => api.get(`/MenuController/${id}`),
  getDisponible: () => api.get('/MenuController/disponible'),
  create: (payload) => api.post('/MenuController/create', payload),
  update: (payload) => api.post('/MenuController/update', payload),
  desactivar: (id) => api.post('/MenuController/desactivar', { id_menu: id }),
  activar: (id) => api.post('/MenuController/activar', { id_menu: id }),
};

export const procesoService = {
  getAll: () => api.get('/ProcesoPreparacionController'),
  getAllMantenimiento: () =>
    api.get('/ProcesoPreparacionController/mantenimiento'),
  getById: (id) => api.get(`/ProcesoPreparacionController/${id}`),
  getProductosDisponibles: () =>
    api.get('/ProcesoPreparacionController/productosDisponibles'),
  create: (payload) =>
    api.post('/ProcesoPreparacionController/create', payload),
  update: (payload) =>
    api.post('/ProcesoPreparacionController/update', payload),
  desactivar: (id) =>
    api.post('/ProcesoPreparacionController/desactivar', { id_proceso: id }),
  activar: (id) =>
    api.post('/ProcesoPreparacionController/activar', { id_proceso: id }),
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
  desactivar: (id) => api.post('/CuponController/desactivar', { id_cupon: id }),
  activar: (id) => api.post('/CuponController/activar', { id_cupon: id }),
};

export default api;
