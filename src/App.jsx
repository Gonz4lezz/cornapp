import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/productos" element={<ProductoListado />} />
          <Route path="/productos/:id" element={<ProductoDetalle />} />
          <Route path="/combos" element={<ComboListado />} />
          <Route path="/combos/:id" element={<ComboDetalle />} />
          <Route path="/menus" element={<MenuListado />} />
          <Route path="/menus/:id" element={<MenuDetalle />} />
          <Route path="/procesos" element={<ProcesoListado />} />
          <Route path="/procesos/:id" element={<ProcesoDetalle />} />
          <Route path="/cupones" element={<CuponesListado />} />

          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/productos" element={<ProductoMantenimiento />} />
          <Route path="/admin/productos/nuevo" element={<ProductoForm />} />
          <Route
            path="/admin/productos/:id/editar"
            element={<ProductoForm />}
          />
          <Route path="/admin/combos" element={<ComboMantenimiento />} />
          <Route path="/admin/combos/nuevo" element={<ComboForm />} />
          <Route path="/admin/combos/:id/editar" element={<ComboForm />} />
          <Route path="/admin/procesos" element={<ProcesoMantenimiento />} />
          <Route path="/admin/procesos/nuevo" element={<ProcesoForm />} />
          <Route path="/admin/procesos/:id/editar" element={<ProcesoForm />} />
          <Route path="/admin/menus" element={<MenuMantenimiento />} />
          <Route path="/admin/menus/nuevo" element={<MenuForm />} />
          <Route path="/admin/menus/:id/editar" element={<MenuForm />} />
          <Route path="/admin/cupones" element={<CuponMantenimiento />} />
          <Route path="/admin/cupones/nuevo" element={<CuponForm />} />
          <Route path="/admin/cupones/:id/editar" element={<CuponForm />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;