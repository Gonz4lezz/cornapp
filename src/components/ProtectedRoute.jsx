import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

// Protege una ruta: exige sesión iniciada y, opcionalmente, uno de los roles.
function ProtectedRoute({ children, roles = null }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) {
    return (
      <Navigate to="/login" state={{ desde: location.pathname }} replace />
    );
  }
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;
