import PropTypes from 'prop-types';
import './FiltroBotones.css';

function FiltroBotones({ etiqueta, opciones, valor, onCambio }) {
  return (
    <div className="filtro-botones">
      {etiqueta && <span className="filtro-botones-etiqueta">{etiqueta}</span>}
      <div className="filtro-botones-lista" role="group" aria-label={etiqueta}>
        {opciones.map((opcion) => {
          const activo = String(opcion.valor) === String(valor);
          return (
            <button
              key={String(opcion.valor)}
              type="button"
              className={`filtro-boton${activo ? ' filtro-boton-activo' : ''}`}
              // Cada opción puede traer su propio color (las estaciones de cocina)
              style={
                opcion.color ? { '--color-activo': opcion.color } : undefined
              }
              aria-pressed={activo}
              onClick={() => onCambio(opcion.valor)}
            >
              {opcion.etiqueta}
            </button>
          );
        })}
      </div>
    </div>
  );
}

FiltroBotones.propTypes = {
  etiqueta: PropTypes.string,
  opciones: PropTypes.arrayOf(
    PropTypes.shape({
      valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      etiqueta: PropTypes.string.isRequired,
      color: PropTypes.string,
    }),
  ).isRequired,
  valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCambio: PropTypes.func.isRequired,
};

export default FiltroBotones;
