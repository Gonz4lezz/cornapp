import { useState } from 'react';
import toast from 'react-hot-toast';
import { extraerErrorAPI } from '../utils/format';

// Maneja el flujo de activar/desactivar (borrado lógico) de un mantenimiento:
// abre la confirmación, llama al servicio y actualiza la fila localmente.
// - service: debe exponer activar(id) y desactivar(id)
// - idKey: nombre del campo id de la entidad (ej: 'id_producto')
// - nombreEntidad: para el mensaje (ej: 'Producto')
// - onEstadoCambiado: (id, nuevoEstado) => void, para reflejar el cambio en la lista
export function useToggleActivo({
  service,
  idKey,
  nombreEntidad,
  onEstadoCambiado,
}) {
  const [objetivo, setObjetivo] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const pedirConfirmacion = (fila) => setObjetivo(fila);
  const cancelar = () => setObjetivo(null);

  const confirmar = async () => {
    if (!objetivo) return;
    const id = objetivo[idKey];
    const activar = objetivo.esta_activo != 1;
    setProcesando(true);
    try {
      if (activar) await service.activar(id);
      else await service.desactivar(id);
      toast.success(`${nombreEntidad} ${activar ? 'activado' : 'desactivado'}`);
      onEstadoCambiado(id, activar ? 1 : 0);
    } catch (err) {
      toast.error(extraerErrorAPI(err, 'No se pudo cambiar el estado'));
    } finally {
      setProcesando(false);
      setObjetivo(null);
    }
  };

  const vaADesactivar = objetivo ? objetivo.esta_activo == 1 : false;

  return {
    objetivo,
    procesando,
    vaADesactivar,
    pedirConfirmacion,
    cancelar,
    confirmar,
  };
}
