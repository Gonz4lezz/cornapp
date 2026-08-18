import axios from 'axios';

export const API_BASE = 'http://localhost:81/cornapp-project';

// Client ID de Google para el inicio de sesión (Google Identity Services)
export const GOOGLE_CLIENT_ID =
  '410757568536-87hbnmk6a7odcp0oaut2a2k2kpq9gtdr.apps.googleusercontent.com';

export const TOKEN_KEY = 'cornapp_token';
export const USUARIO_KEY = 'cornapp_usuario';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adjunta el JWT a cada petición cuando hay sesión iniciada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

export const authService = {
  login: (payload) => api.post('/AuthController/login', payload),
  registro: (payload) => api.post('/AuthController/registro', payload),
  google: (payload) => api.post('/AuthController/google', payload),
  perfil: () => api.get('/AuthController/perfil'),
  clientes: () => api.get('/AuthController/clientes'),
};

export const carritoService = {
  get: () => api.get('/CarritoController'),
  agregar: (payload) => api.post('/CarritoController/agregar', payload),
  actualizar: (payload) => api.post('/CarritoController/actualizar', payload),
  observaciones: (payload) =>
    api.post('/CarritoController/observaciones', payload),
  eliminar: (idCarrito) =>
    api.post('/CarritoController/eliminar', { id_carrito: idCarrito }),
  aplicarCupon: (codigo) =>
    api.post('/CarritoController/aplicarCupon', { codigo }),
  quitarCupon: (idCupon) =>
    api.post('/CarritoController/quitarCupon', { id_cupon: idCupon }),
  vaciar: () => api.post('/CarritoController/vaciar'),
};

export const usuarioService = {
  getAll: (idRol = null) =>
    api.get('/UsuarioController', { params: idRol ? { rol: idRol } : {} }),
  getRoles: () => api.get('/UsuarioController/roles'),
  getById: (id) => api.get(`/UsuarioController/${id}`),
  create: (payload) => api.post('/UsuarioController/create', payload),
  update: (payload) => api.post('/UsuarioController/update', payload),
  desactivar: (id) =>
    api.post('/UsuarioController/desactivar', { id_usuario: id }),
  activar: (id) => api.post('/UsuarioController/activar', { id_usuario: id }),
};

export const dashboardService = {
  get: () => api.get('/DashboardController'),
};

export const facturaService = {
  // El PDF llega como binario, por eso se pide como blob
  descargar: (idPedido) =>
    api.get(`/FacturaController/descargar/${idPedido}`, {
      responseType: 'blob',
    }),
};

export const pedidoService = {
  getCatalogos: () => api.get('/PedidoController/catalogos'),
  cotizarEnvio: (latitud, longitud) =>
    api.post('/PedidoController/cotizarEnvio', { latitud, longitud }),
  despachar: (idPedido, repartidor) =>
    api.post('/PedidoController/despachar', {
      id_pedido: idPedido,
      repartidor,
    }),
  getHistorial: (filtros = {}) =>
    api.get('/PedidoController/historial', { params: filtros }),
  getById: (id) => api.get(`/PedidoController/${id}`),
  crear: (payload) => api.post('/PedidoController/crear', payload),
  aceptar: (idPedido) =>
    api.post('/PedidoController/aceptar', { id_pedido: idPedido }),
  entregar: (idPedido) =>
    api.post('/PedidoController/entregar', { id_pedido: idPedido }),
};

export const cocinaService = {
  getTablero: (idEstacion = null) =>
    api.get('/CocinaController', {
      params: idEstacion ? { estacion: idEstacion } : {},
    }),
  avanzar: (idItemCocina) =>
    api.post('/CocinaController/avanzar', { id_item_cocina: idItemCocina }),
};

export const tipoCambioService = {
  get: () => api.get('/TipoCambioController'),
};

export default api;
