import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { TextField, Button, Divider } from '@mui/material';
import { authService, GOOGLE_CLIENT_ID } from '../services/api';
import { extraerErrorAPI } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const schema = yup.object({
  correo: yup
    .string()
    .required('El correo es obligatorio')
    .email('El correo no tiene un formato válido'),
  contrasena: yup.string().required('La contraseña es obligatoria'),
});

// Destino según el rol: cocina entra directo a su módulo
const rutaSegunRol = (usuario, desde) => {
  // Cada rol entra directo al módulo con el que trabaja
  if (usuario.rol === 'Cocina') return '/cocina';
  if (desde) return desde;
  if (usuario.rol === 'Administrador') return '/dashboard';
  if (usuario.rol === 'Encargado') return '/dashboard';
  return '/';
};

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, iniciarSesion } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const googleRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { correo: '', contrasena: '' },
  });

  const entrar = useCallback(
    (data) => {
      iniciarSesion(data.token, data.usuario);
      toast.success(`¡Bienvenido, ${data.usuario.nombre}!`);
      navigate(rutaSegunRol(data.usuario, location.state?.desde), {
        replace: true,
      });
    },
    [iniciarSesion, navigate, location.state],
  );

  // Si ya hay sesión no tiene sentido estar aquí
  useEffect(() => {
    if (usuario) {
      navigate(rutaSegunRol(usuario, null), { replace: true });
    }
  }, [usuario, navigate]);

  // Botón oficial de Google Identity Services
  useEffect(() => {
    const renderizar = () => {
      if (!window.google?.accounts?.id || !googleRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (respuesta) => {
          try {
            const { data } = await authService.google({
              credential: respuesta.credential,
            });
            entrar(data);
          } catch (error) {
            toast.error(
              extraerErrorAPI(error, 'No se pudo iniciar sesión con Google'),
            );
          }
        },
      });
      window.google.accounts.id.renderButton(googleRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        locale: 'es',
        width: 320,
      });
    };

    if (window.google?.accounts?.id) {
      renderizar();
      return undefined;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = renderizar;
    document.head.appendChild(script);
    return () => {
      script.onload = null;
    };
  }, [entrar]);

  const onSubmit = async (valores) => {
    setEnviando(true);
    try {
      const { data } = await authService.login(valores);
      entrar(data);
    } catch (error) {
      toast.error(extraerErrorAPI(error, 'No se pudo iniciar sesión'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-emoji"></span>
        <h1 className="auth-titulo">Iniciar sesión</h1>
        <p className="auth-subtitulo">
          Ingresa a tu cuenta para hacer pedidos y ver tu historial
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <TextField
            label="Correo electrónico"
            type="email"
            fullWidth
            autoComplete="email"
            error={Boolean(errors.correo)}
            helperText={errors.correo?.message}
            {...register('correo')}
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            autoComplete="current-password"
            error={Boolean(errors.contrasena)}
            helperText={errors.contrasena?.message}
            {...register('contrasena')}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={enviando}
            className="auth-boton"
          >
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>

        <Divider className="auth-divider">o</Divider>

        <div className="auth-google" ref={googleRef}></div>

        <p className="auth-pie">
          ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
