import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';
import api, { TOKEN_KEY, USUARIO_KEY } from '../services/api';

const AuthContext = createContext(null);

// Roles que pueden comprar (agregar al carrito y registrar pedidos)
export const ROLES_COMPRA = ['Cliente', 'Encargado', 'Administrador'];

const tokenVigente = (token) => {
  if (!token) return false;
  try {
    const { exp } = jwtDecode(token);
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const sesionGuardada = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!tokenVigente(token)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    return null;
  }
  try {
    return JSON.parse(localStorage.getItem(USUARIO_KEY));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(sesionGuardada);

  const iniciarSesion = useCallback((token, datosUsuario) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
  }, []);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    setUsuario(null);
  }, []);

  // Si el backend responde 401 (token vencido o inválido), se cierra la sesión
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (respuesta) => respuesta,
      (error) => {
        if (
          error.response?.status === 401 &&
          localStorage.getItem(TOKEN_KEY) &&
          !tokenVigente(localStorage.getItem(TOKEN_KEY))
        ) {
          cerrarSesion();
        }
        return Promise.reject(error);
      },
    );
    return () => api.interceptors.response.eject(interceptor);
  }, [cerrarSesion]);

  const value = useMemo(
    () => ({
      usuario,
      estaAutenticado: Boolean(usuario),
      esRol: (...roles) => Boolean(usuario) && roles.includes(usuario.rol),
      puedeComprar: Boolean(usuario) && ROLES_COMPRA.includes(usuario.rol),
      iniciarSesion,
      cerrarSesion,
    }),
    [usuario, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return contexto;
}
