import { useState } from 'react';
import PropTypes from 'prop-types';
import { TextField } from '@mui/material';

// Fecha de hoy en formato dd/mm/aaaa, para usarla como ejemplo
const fechaDeEjemplo = () =>
  new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

/**
 * Campo de fecha que en lugar del "dd/mm/aaaa" del navegador muestra una
 * fecha de ejemplo mientras está vacío. Se logra dejándolo como campo de
 * texto (el único que admite un placeholder propio) hasta que el usuario
 * lo enfoca: ahí vuelve a ser un campo de fecha con su calendario.
 */
function CampoFecha({ value, onChange, ...props }) {
  const [enfocado, setEnfocado] = useState(false);
  const comoTexto = !enfocado && !value;

  return (
    <TextField
      type={comoTexto ? 'text' : 'date'}
      value={value}
      onChange={onChange}
      placeholder={`Ej. ${fechaDeEjemplo()}`}
      onFocus={() => setEnfocado(true)}
      onBlur={() => setEnfocado(false)}
      slotProps={{ inputLabel: { shrink: true } }}
      {...props}
    />
  );
}

CampoFecha.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default CampoFecha;
