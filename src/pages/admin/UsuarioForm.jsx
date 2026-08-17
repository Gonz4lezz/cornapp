import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { TextField, MenuItem } from '@mui/material';
import { usuarioService } from '../../services/api';
import { extraerErrorAPI } from '../../utils/format';
import './admin-common.css';

// Roles que el administrador puede asignar desde el mantenimiento.
// Los clientes no se crean aquí: se registran por su cuenta.
const ROLES_PERSONAL = ['Encargado', 'Cocina', 'Administrador'];

const construirSchema = (esEdicion) =>
  yup.object({
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
    id_rol: yup
      .number()
      .transform((valor, original) => (original === '' ? null : valor))
      .nullable()
      .required('Seleccione el rol del usuario'),
    // Al editar, la contraseña solo se valida si la escriben
    contrasena: esEdicion
      ? yup
          .string()
          .optional()
          .test(
            'segura',
            'La contraseña debe tener al menos 8 caracteres, con letras y números',
            (valor) =>
              !valor ||
              (valor.length >= 8 && /[A-Za-z]/.test(valor) && /\d/.test(valor)),
          )
      : yup
          .string()
          .required('La contraseña es obligatoria')
          .min(8, 'Debe tener al menos 8 caracteres')
          .matches(/[A-Za-z]/, 'Debe incluir al menos una letra')
          .matches(/\d/, 'Debe incluir al menos un número'),
  });

function UsuarioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(esEdicion);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(construirSchema(esEdicion)),
    defaultValues: {
      nombre: '',
      apellido: '',
      correo: '',
      telefono: '',
      id_rol: '',
      contrasena: '',
    },
  });

  // Primero los roles y después el usuario, para que el select ya tenga opciones
  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await usuarioService.getRoles();
        const disponibles = (Array.isArray(data) ? data : []).filter((rol) =>
          ROLES_PERSONAL.includes(rol.nombre),
        );
        setRoles(disponibles);

        if (esEdicion) {
          const { data: usuario } = await usuarioService.getById(id);
          reset({
            nombre: usuario.nombre ?? '',
            apellido: usuario.apellido ?? '',
            correo: usuario.correo ?? '',
            telefono: usuario.telefono ?? '',
            id_rol: usuario.id_rol ?? '',
            contrasena: '',
          });
        }
      } catch (err) {
        toast.error(extraerErrorAPI(err, 'No se pudo cargar el usuario'));
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id, esEdicion, reset]);

  const onSubmit = async (valores) => {
    setEnviando(true);
    try {
      const payload = { ...valores, id_rol: Number(valores.id_rol) };
      if (esEdicion) {
        payload.id_usuario = Number(id);
        await usuarioService.update(payload);
        toast.success('Usuario actualizado');
      } else {
        await usuarioService.create(payload);
        toast.success('Usuario creado');
      }
      navigate('/admin/usuarios');
    } catch (err) {
      const respuesta = err.response?.data;
      if (respuesta?.campo === 'correo') {
        setError('correo', { type: 'server', message: respuesta.mensaje });
      }
      toast.error(extraerErrorAPI(err, 'No se pudo guardar el usuario'));
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <div className="loading">Cargando usuario...</div>;

  return (
    <div className="admin-usuario-form">
      <div className="page-header">
        <Link to="/admin/usuarios" className="admin-form-back">
          &larr; Volver al listado
        </Link>
        <h1>{esEdicion ? 'Editar usuario' : 'Nuevo usuario'}</h1>
        <p>
          {esEdicion
            ? 'Actualizá los datos de la cuenta'
            : 'Cree la cuenta del personal: encargado, cocina o administrador'}
        </p>
      </div>

      <div className="page-content">
        <form
          className="admin-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="admin-form-row">
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

          <div className="admin-form-row">
            <TextField
              label="Correo electrónico"
              type="email"
              fullWidth
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
          </div>

          <div className="admin-form-row">
            <Controller
              name="id_rol"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label="Rol"
                  fullWidth
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={Boolean(errors.id_rol)}
                  helperText={
                    errors.id_rol?.message ||
                    'Los clientes se registran por su cuenta desde el sitio'
                  }
                >
                  {roles.map((rol) => (
                    <MenuItem key={rol.id_rol} value={rol.id_rol}>
                      {rol.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField
              label={esEdicion ? 'Nueva contraseña' : 'Contraseña'}
              type="password"
              fullWidth
              autoComplete="new-password"
              error={Boolean(errors.contrasena)}
              helperText={
                errors.contrasena?.message ||
                (esEdicion
                  ? 'Dejala en blanco para conservar la actual'
                  : 'Mínimo 8 caracteres, con letras y números')
              }
              {...register('contrasena')}
            />
          </div>

          <div className="admin-form-actions">
            <Link to="/admin/usuarios" className="admin-btn admin-btn-ghost">
              Cancelar
            </Link>
            <button type="submit" className="admin-btn" disabled={enviando}>
              {enviando
                ? 'Guardando…'
                : esEdicion
                  ? 'Guardar cambios'
                  : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UsuarioForm;
