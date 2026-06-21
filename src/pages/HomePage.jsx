import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Korean Corn Dogs</h1>
          <p className="hero-subtitle">
            Los auténticos corn dogs coreanos, crujientes por fuera,
            irresistibles por dentro. Hechos al momento con los mejores ingredientes.
          </p>
          <div className="hero-actions">
            <Link to="/menus" className="btn btn-primary">Ver Menú</Link>
            <Link to="/productos" className="btn btn-outline">Nuestros Productos</Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-container">
          <div className="feature-card">
            <span className="feature-icon">🌽</span>
            <h3>Corn Dogs Artesanales</h3>
            <p>Masa de maíz dulce preparada diariamente con receta coreana original.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🧀</span>
            <h3>Variedad de Sabores</h3>
            <p>Desde el clásico hasta combinaciones con queso, chocolate y más.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🚀</span>
            <h3>Rápido y Fresco</h3>
            <p>Preparados al momento para que disfrutes la mejor textura y sabor.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
