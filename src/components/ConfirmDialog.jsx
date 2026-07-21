import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

// Diálogo de confirmación reutilizable para acciones como desactivar/activar.
function ConfirmDialog({
  open,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  colorConfirmar = 'primary',
  onConfirmar,
  onCancelar,
}) {
  return (
    <Dialog open={open} onClose={onCancelar} maxWidth="xs" fullWidth>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText>{mensaje}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelar} color="inherit">
          {textoCancelar}
        </Button>
        <Button
          onClick={onConfirmar}
          color={colorConfirmar}
          variant="contained"
          autoFocus
        >
          {textoConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  titulo: PropTypes.string,
  mensaje: PropTypes.node,
  textoConfirmar: PropTypes.string,
  textoCancelar: PropTypes.string,
  colorConfirmar: PropTypes.string,
  onConfirmar: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
};

export default ConfirmDialog;
