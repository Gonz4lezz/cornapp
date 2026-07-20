import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import CuponCard from './CuponCard';
import './CuponSlider.css';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';

function CuponSlider({ cupones }) {
  const [inicio, setInicio] = useState(0);
  const [porPagina, setPorPagina] = useState(3);
  const intervaloRef = useRef(null);

  useEffect(() => {
    const calcularVisibles = () => {
      const ancho = window.innerWidth;
      if (ancho < 640) setPorPagina(1);
      else if (ancho < 1000) setPorPagina(2);
      else setPorPagina(3);
    };
    calcularVisibles();
    window.addEventListener('resize', calcularVisibles);
    return () => window.removeEventListener('resize', calcularVisibles);
  }, []);

  const totalPaginas = Math.max(1, Math.ceil(cupones.length / porPagina));
  const paginaActual = Math.floor(inicio / porPagina) % totalPaginas;

  const avanzar = () => {
    setInicio((prev) => {
      const siguiente = prev + porPagina;
      return siguiente >= cupones.length ? 0 : siguiente;
    });
  };

  const retroceder = () => {
    setInicio((prev) => {
      if (prev - porPagina < 0) {
        return Math.max(0, (totalPaginas - 1) * porPagina);
      }
      return prev - porPagina;
    });
  };

  const irAPagina = (i) => setInicio(i * porPagina);

  useEffect(() => {
    if (cupones.length <= porPagina) return undefined;
    intervaloRef.current = setInterval(avanzar, 5000);
    return () => clearInterval(intervaloRef.current);
  }, [cupones.length, porPagina]);

  const pausar = () => clearInterval(intervaloRef.current);
  const reanudar = () => {
    if (cupones.length > porPagina) {
      intervaloRef.current = setInterval(avanzar, 5000);
    }
  };

  if (!cupones || cupones.length === 0) return null;

  const visibles = cupones.slice(inicio, inicio + porPagina);
  if (visibles.length < porPagina && cupones.length > porPagina) {
    visibles.push(...cupones.slice(0, porPagina - visibles.length));
  }

  const hayControles = cupones.length > porPagina;

  return (
    <div className="cupon-slider" onMouseEnter={pausar} onMouseLeave={reanudar}>
      <div className="cupon-slider-viewport">
        {hayControles && (
          <button
            className="cupon-slider-flecha izquierda"
            onClick={retroceder}
            aria-label="Cupones anteriores"
          >
            <ChevronLeftOutlinedIcon fontSize="small" />
          </button>
        )}

        <div className="cupon-slider-track">
          {visibles.map((cupon) => (
            <CuponCard key={cupon.id_cupon} cupon={cupon} />
          ))}
        </div>

        {hayControles && (
          <button
            className="cupon-slider-flecha derecha"
            onClick={avanzar}
            aria-label="Cupones siguientes"
          >
            <ChevronRightOutlinedIcon fontSize="small" />
          </button>
        )}
      </div>

      {hayControles && totalPaginas > 1 && (
        <div className="cupon-slider-dots">
          {Array.from({ length: totalPaginas }).map((_, i) => (
            <button
              key={i}
              className={`cupon-slider-dot ${i === paginaActual ? 'activo' : ''}`}
              onClick={() => irAPagina(i)}
              aria-label={`Ir al grupo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

CuponSlider.propTypes = {
  cupones: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default CuponSlider;
