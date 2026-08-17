import { useState } from 'react';
import PropTypes from 'prop-types';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';

/**
 * Campo de contraseña con el botón del ojo para verla sin censurar.
 * Acepta las mismas propiedades que un TextField, así que se puede usar
 * con react-hook-form igual que los demás campos del formulario.
 */
function CampoContrasena({ label, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      label={label}
      type={visible ? 'text' : 'password'}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setVisible((v) => !v)}
                // El botón no debe robarle el foco al campo ni enviar el formulario
                onMouseDown={(e) => e.preventDefault()}
                tabIndex={-1}
                edge="end"
                size="small"
                aria-label={
                  visible ? 'Ocultar la contraseña' : 'Mostrar la contraseña'
                }
                title={
                  visible ? 'Ocultar la contraseña' : 'Mostrar la contraseña'
                }
              >
                {visible ? (
                  <VisibilityOffRoundedIcon fontSize="small" />
                ) : (
                  <VisibilityRoundedIcon fontSize="small" />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      {...props}
    />
  );
}

CampoContrasena.propTypes = { label: PropTypes.string.isRequired };

export default CampoContrasena;
