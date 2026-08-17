import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ProductoListado from './pages/ProductoListado';
import ProductoDetalle from './pages/ProductoDetalle';
import ComboListado from './pages/ComboListado';
import ComboDetalle from './pages/ComboDetalle';
import MenuListado from './pages/MenuListado';
import MenuDetalle from './pages/MenuDetalle';
import ProcesoListado from './pages/ProcesoListado';
import ProcesoDetalle from './pages/ProcesoDetalle';
import CuponesListado from './pages/CuponesListado';
import LoginPage from './pages/LoginPage';
import RegistroPage from './pages/RegistroPage';
import CarritoPage from './pages/CarritoPage';
import PedidosPage from './pages/PedidosPage';
import PedidoDetallePage from './pages/PedidoDetallePage';
import CocinaPage from './pages/CocinaPage';
import AdminHome from './pages/admin/AdminHome';
import ProductoMantenimiento from './pages/admin/ProductoMantenimiento';
import ProductoForm from './pages/admin/ProductoForm';
import ComboMantenimiento from './pages/admin/ComboMantenimiento';
import ComboForm from './pages/admin/ComboForm';
import ProcesoMantenimiento from './pages/admin/ProcesoMantenimiento';
import ProcesoForm from './pages/admin/ProcesoForm';
import MenuMantenimiento from './pages/admin/MenuMantenimiento';
import MenuForm from './pages/admin/MenuForm';
import CuponMantenimiento from './pages/admin/CuponMantenimiento';
import CuponForm from './pages/admin/CuponForm';
import UsuarioMantenimiento from './pages/admin/UsuarioMantenimiento';
import UsuarioForm from './pages/admin/UsuarioForm';
import DashboardPage from './pages/DashboardPage';
import './App.css';

const ROLES_COMPRA = ['Cliente', 'Encargado', 'Administrador'];
const ROLES_PEDIDOS = ['Cliente', 'Encargado', 'Administrador'];

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CarritoProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/productos" element={<ProductoListado />} />
              <Route path="/productos/:id" element={<ProductoDetalle />} />
              <Route path="/combos" element={<ComboListado />} />
              <Route path="/combos/:id" element={<ComboDetalle />} />
              <Route path="/menus" element={<MenuListado />} />
              <Route path="/menus/:id" element={<MenuDetalle />} />
              <Route path="/cupones" element={<CuponesListado />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegistroPage />} />

              {/* Procesos de preparación: vista pública (el mantenimiento sí es restringido) */}
              <Route path="/procesos" element={<ProcesoListado />} />
              <Route path="/procesos/:id" element={<ProcesoDetalle />} />

              {/* Carrito y pedidos */}
              <Route
                path="/carrito"
                element={
                  <ProtectedRoute roles={ROLES_COMPRA}>
                    <CarritoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={['Administrador', 'Encargado']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pedidos"
                element={
                  <ProtectedRoute roles={ROLES_PEDIDOS}>
                    <PedidosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pedidos/:id"
                element={
                  <ProtectedRoute roles={[...ROLES_PEDIDOS, 'Cocina']}>
                    <PedidoDetallePage />
                  </ProtectedRoute>
                }
              />

              {/* Gestión de cocina: exclusiva del rol Cocina */}
              <Route
                path="/cocina"
                element={
                  <ProtectedRoute roles={['Cocina']}>
                    <CocinaPage />
                  </ProtectedRoute>
                }
              />

              {/* Mantenimiento: solo administrador */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <AdminHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/productos"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <ProductoMantenimiento />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/productos/nuevo"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <ProductoForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/productos/:id/editar"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <ProductoForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/combos"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <ComboMantenimiento />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/combos/nuevo"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <ComboForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/combos/:id/editar"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <ComboForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/procesos"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <ProcesoMantenimiento />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/procesos/nuevo"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <ProcesoForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/procesos/:id/editar"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <ProcesoForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/menus"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <MenuMantenimiento />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/menus/nuevo"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <MenuForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/menus/:id/editar"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <MenuForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/usuarios"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <UsuarioMantenimiento />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/usuarios/nuevo"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <UsuarioForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/usuarios/:id/editar"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <UsuarioForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cupones"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <CuponMantenimiento />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cupones/nuevo"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <CuponForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cupones/:id/editar"
                element={
                  <ProtectedRoute roles={['Administrador']}>
                    <CuponForm />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        </CarritoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
