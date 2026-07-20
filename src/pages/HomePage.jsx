import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cuponService } from '../services/api';
import CuponSlider from '../components/CuponSlider';
import './HomePage.css';
import AlarmOnRoundedIcon from '@mui/icons-material/AlarmOnRounded';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';
import CottageRoundedIcon from '@mui/icons-material/CottageRounded';

function HomePage() {
  const [cupones, setCupones] = useState([]);
  const [cargandoCupones, setCargandoCupones] = useState(true);

  useEffect(() => {
    cuponService
      .getDisponibles()
      .then((res) => setCupones(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCupones([]))
      .finally(() => setCargandoCupones(false));
  }, []);

  return (
    <div className="home">
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-logo">
                <img src="/assets/cornapp-logo-nombre.png" alt="Logo" />
          </span>
          <p className="hero-subtitle">
            Los auténticos corn dogs coreanos, crujientes por fuera,
            irresistibles por dentro. Hechos al momento con los mejores
            ingredientes.
          </p>
          <div className="hero-actions">
            <Link to="/menus" className="btn btn-primary">
              Ver Menú
            </Link>
            <Link to="/productos" className="btn btn-outline">
              Nuestros Productos
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-container">
          <div className="feature-card">
            <span className="feature-icon"><CottageRoundedIcon fontSize='large' sx={{ color: '#ff8e42' }} /></span>
            <h3>Corn Dogs Artesanales</h3>
            <p>
              Masa de maíz dulce preparada diariamente con receta coreana
              original.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon"><StarsRoundedIcon fontSize='large' sx={{ color: '#ff8e42' }} /></span>
            <h3>Variedad de Sabores</h3>
            <p>
              Desde el clásico hasta combinaciones con queso, chocolate y más.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon"><AlarmOnRoundedIcon fontSize='large' sx={{ color: '#ff8e42' }} /></span>
            <h3>Rápido y Fresco</h3>
            <p>
              Preparados al momento para que disfrutes la mejor textura y sabor.
            </p>
          </div>
        </div>
      </section>

      {!cargandoCupones && cupones.length > 0 && (
        <section className="cupones-home-section">
          <div className="cupones-home-container">
            <div className="cupones-home-header">
              <h2>Cupones disponibles</h2>
              <p>Descuentos exclusivos en tus productos y combos favoritos</p>
            </div>

            <CuponSlider cupones={cupones} />

            <div className="cupones-home-cta">
              <Link to="/cupones" className="btn btn-primary">
                Ver todos los cupones
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default HomePage;
