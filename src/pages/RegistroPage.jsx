import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { TextField, Button } from '@mui/material';
import { authService } from '../services/api';
import { extraerErrorAPI } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import CampoContrasena from '../components/CampoContrasena';
import './AuthPages.css';

const schema = yup.object({
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(100, 'No puede exceder 100 caracteres')
    .trim(),
  apellido: yup
    .string()
    .required('El apellido es obligatorio')
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(100, 'No puede exceder 100 caracteres')
    .trim(),
  correo: yup
    .string()
    .required('El correo es obligatorio')
    .email('El correo no tiene un formato válido'),
  telefono: yup
    .string()
    .optional()
    .matches(/^$|^[\d\s+-]{8,20}$/, 'El teléfono no tiene un formato válido'),
  contrasena: yup
    .string()
    .required('La contraseña es obligatoria')
    .min(8, 'Debe tener al menos 8 caracteres')
    .matches(/[A-Za-z]/, 'Debe incluir al menos una letra')
    .matches(/\d/, 'Debe incluir al menos un número'),
  confirmacion: yup
    .string()
    .required('Debes confirmar la contraseña')
    .oneOf([yup.ref('contrasena')], 'Las contraseñas no coinciden'),
});

function RegistroPage() {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre: '',
      apellido: '',
      correo: '',
      telefono: '',
      contrasena: '',
      confirmacion: '',
    },
  });

  const onSubmit = async (valores) => {
    setEnviando(true);
    try {
      const { data } = await authService.registro({
        nombre: valores.nombre,
        apellido: valores.apellido,
        correo: valores.correo,
        telefono: valores.telefono,
        contrasena: valores.contrasena,
      });
      iniciarSesion(data.token, data.usuario);
      toast.success(
        `¡Cuenta creada! Bienvenido a CornApp, ${data.usuario.nombre}`,
      );
      navigate('/', { replace: true });
    } catch (error) {
      const respuesta = error.response?.data;
      if (respuesta?.campo === 'correo') {
        setError('correo', { type: 'server', message: respuesta.mensaje });
      }
      toast.error(extraerErrorAPI(error, 'No se pudo crear la cuenta'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-ancha">
        <h1 className="auth-titulo">Crear cuenta</h1>
        <p className="auth-subtitulo">
          Regístrate como cliente para ordenar tus corn dogs favoritos
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="auth-fila">
            <TextField
              label="Nombre"
              fullWidth
              error={Boolean(errors.nombre)}
              helperText={errors.nombre?.message}
              {...register('nombre')}
            />
            <TextField
              label="Apellido"
              fullWidth
              error={Boolean(errors.apellido)}
              helperText={errors.apellido?.message}
              {...register('apellido')}
            />
          </div>
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
            label="Teléfono (opcional)"
            fullWidth
            placeholder="8888-8888"
            error={Boolean(errors.telefono)}
            helperText={errors.telefono?.message}
            {...register('telefono')}
          />
          <div className="auth-fila">
            <CampoContrasena
              label="Contraseña"
              fullWidth
              autoComplete="new-password"
              error={Boolean(errors.contrasena)}
              helperText={
                errors.contrasena?.message ||
                'Mínimo 8 caracteres, con letras y números'
              }
              {...register('contrasena')}
            />
            <CampoContrasena
              label="Confirmar contraseña"
              fullWidth
              autoComplete="new-password"
              error={Boolean(errors.confirmacion)}
              helperText={errors.confirmacion?.message}
              {...register('confirmacion')}
            />
          </div>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={enviando}
            className="auth-boton"
          >
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="auth-pie">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default RegistroPage;
