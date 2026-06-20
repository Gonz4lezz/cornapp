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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
