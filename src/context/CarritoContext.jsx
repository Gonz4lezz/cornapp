import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { carritoService } from '../services/api';
import { extraerErrorAPI } from '../utils/format';
import { useAuth } from './AuthContext';

const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const { usuario, puedeComprar } = useAuth();
  const [items, setItems] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [cargando, setCargando] = useState(false);

  const aplicarRespuesta = useCallback((data) => {
    setItems(data?.items ?? []);
    setCupones(data?.cupones ?? []);
  }, []);

  // Carga el carrito del usuario al iniciar sesión (y lo limpia al salir)
  useEffect(() => {
    if (!puedeComprar) {
      setItems([]);
      setCupones([]);
      return;
    }
    let cancelado = false;
    setCargando(true);
    carritoService
      .get()
      .then(({ data }) => {
        if (!cancelado) aplicarRespuesta(data);
      })
      .catch(() => {
        /* sin sesión válida no hay carrito que mostrar */
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [usuario, puedeComprar, aplicarRespuesta]);

  const ejecutar = useCallback(
    async (promesa, mensajeExito = null) => {
      try {
        const { data } = await promesa;
        aplicarRespuesta(data);
        if (mensajeExito) toast.success(mensajeExito);
        return true;
      } catch (error) {
        toast.error(extraerErrorAPI(error, 'No se pudo actualizar el carrito'));
        return false;
      }
    },
    [aplicarRespuesta],
  );

  const value = useMemo(() => {
    const cantidadTotal = items.reduce(
      (suma, item) => suma + Number(item.cantidad || 0),
      0,
    );
    return {
      items,
      cupones,
      cargando,
      cantidadTotal,
      agregar: (payload, nombre = 'Artículo') =>
        ejecutar(
          carritoService.agregar(payload),
          `${nombre} agregado al carrito`,
        ),
      actualizarCantidad: (idCarrito, cantidad) =>
        ejecutar(
          carritoService.actualizar({ id_carrito: idCarrito, cantidad }),
        ),
      actualizarObservaciones: (idCarrito, observaciones) =>
        ejecutar(
          carritoService.observaciones({
            id_carrito: idCarrito,
            observaciones,
          }),
        ),
      eliminar: (idCarrito) =>
        ejecutar(carritoService.eliminar(idCarrito), 'Línea eliminada'),
      aplicarCupon: (codigo) =>
        ejecutar(carritoService.aplicarCupon(codigo), 'Cupón aplicado'),
      // Botón "Usar" de un cupón: si el artículo al que aplica no está en el
      // carrito primero lo agrega, y luego aplica el descuento.
      usarCupon: async (cupon) => {
        const esProducto = cupon.id_producto != null;
        const enCarrito = items.some((item) =>
          esProducto
            ? Number(item.id_producto) === Number(cupon.id_producto)
            : Number(item.id_combo) === Number(cupon.id_combo),
        );
        if (!enCarrito) {
          const agregado = await ejecutar(
            carritoService.agregar(
              esProducto
                ? { id_producto: cupon.id_producto, cantidad: 1 }
                : { id_combo: cupon.id_combo, cantidad: 1 },
            ),
          );
          if (!agregado) return false;
        }
        return ejecutar(
          carritoService.aplicarCupon(cupon.codigo),
          `Cupón ${cupon.codigo} aplicado al carrito`,
        );
      },
      quitarCupon: (idCupon) =>
        ejecutar(carritoService.quitarCupon(idCupon), 'Cupón removido'),
      vaciar: () => ejecutar(carritoService.vaciar()),
      // Tras registrar el pedido el backend vacía el carrito: solo se refleja
      limpiarLocal: () => {
        setItems([]);
        setCupones([]);
      },
    };
  }, [items, cupones, cargando, ejecutar]);

  return (
    <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>
  );
}

CarritoProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useCarrito() {
  const contexto = useContext(CarritoContext);
  if (!contexto) {
    throw new Error('useCarrito debe usarse dentro de <CarritoProvider>');
  }
  return contexto;
}
