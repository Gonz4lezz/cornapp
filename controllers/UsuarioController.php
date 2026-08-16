<?php

/**
 * Mantenimiento de usuarios. Solo el administrador puede consultar la lista
 * y dar de alta personal (Encargado y Cocina); los clientes se registran
 * por su cuenta desde la página de registro.
 */
class UsuarioController
{
    // Roles que el administrador puede crear desde el mantenimiento
    const ROLES_PERSONAL = ['Encargado', 'Cocina', 'Administrador'];

    private $model;
    private $response;
    private $request;

    public function __construct()
    {
        $this->model = new UsuarioModel();
        $this->response = new Response();
        $this->request = new Request();
    }

    // GET /UsuarioController — lista de usuarios (opcional ?rol=ID)
    public function index()
    {
        Auth::requerir(['Administrador']);
        $idRol = $_GET['rol'] ?? null;
        $this->response->status(200)->toJSON($this->model->getAllMantenimiento($idRol));
    }

    // GET /UsuarioController/roles — catálogo de roles para los formularios
    public function roles()
    {
        Auth::requerir(['Administrador']);
        $this->response->status(200)->toJSON($this->model->getRoles());
    }

    // GET /UsuarioController/{id}
    public function get($id)
    {
        Auth::requerir(['Administrador']);
        $usuario = $this->model->getById($id);
        if (!$usuario) {
            $this->response->status(404)->toJSON(null, 'Usuario no encontrado');
            return;
        }
        $this->response->status(200)->toJSON($usuario);
    }

    // POST /UsuarioController/create — alta de personal
    public function create()
    {
        Auth::requerir(['Administrador']);
        $data = $this->parsePayload();

        $errores = $this->validar($data, true);
        if (!empty($errores)) {
            $this->response->status(422)->toJSON(['errores' => $errores], 'Datos inválidos');
            return;
        }
        if ($this->model->correoEnUso($data['correo'])) {
            $this->response->status(409)->toJSON([
                'campo' => 'correo',
                'mensaje' => 'Ya existe una cuenta con ese correo',
            ], 'Correo duplicado');
            return;
        }

        $id = $this->model->crearPersonal($data);
        if (!$id) {
            $this->response->status(500)->toJSON(null, 'No se pudo crear el usuario');
            return;
        }
        $this->response->status(201)->toJSON($this->model->getById($id));
    }

    // POST /UsuarioController/update
    public function update()
    {
        $autenticado = Auth::requerir(['Administrador']);
        $data = $this->parsePayload();
        $id = intval($data['id_usuario'] ?? 0);

        if ($id <= 0 || !$this->model->getById($id)) {
            $this->response->status(404)->toJSON(null, 'Usuario no encontrado');
            return;
        }

        $errores = $this->validar($data, false);
        if (!empty($errores)) {
            $this->response->status(422)->toJSON(['errores' => $errores], 'Datos inválidos');
            return;
        }
        if ($this->model->correoEnUso($data['correo'], $id)) {
            $this->response->status(409)->toJSON([
                'campo' => 'correo',
                'mensaje' => 'Ya existe otra cuenta con ese correo',
            ], 'Correo duplicado');
            return;
        }
        // Evita que el administrador se quite a sí mismo su propio rol
        if ($id === intval($autenticado->id_usuario)) {
            $actual = $this->model->getById($id);
            if (intval($data['id_rol']) !== intval($actual->id_rol)) {
                $this->response->status(409)->toJSON(null, 'No puede cambiar su propio rol');
                return;
            }
        }

        $this->model->update($id, $data);
        $this->response->status(200)->toJSON($this->model->getById($id));
    }

    public function desactivar()
    {
        $this->cambiarEstado(false);
    }

    public function activar()
    {
        $this->cambiarEstado(true);
    }

    private function cambiarEstado($activo)
    {
        $autenticado = Auth::requerir(['Administrador']);
        $data = $this->request->getJSON();
        $id = intval($data->id_usuario ?? 0);

        if ($id <= 0 || !$this->model->getById($id)) {
            $this->response->status(404)->toJSON(null, 'Usuario no encontrado');
            return;
        }
        // Un administrador no puede desactivarse a sí mismo y quedar fuera
        if (!$activo && $id === intval($autenticado->id_usuario)) {
            $this->response->status(409)->toJSON(null, 'No puede desactivar su propia cuenta');
            return;
        }

        $this->model->setActivo($id, $activo);
        $this->response->status(200)->toJSON([
            'id_usuario' => $id,
            'esta_activo' => $activo ? 1 : 0,
        ]);
    }

    private function parsePayload()
    {
        $json = $this->request->getJSON();
        return $json ? (array) $json : [];
    }

    private function validar($data, $esNuevo)
    {
        $errores = [];

        if (empty($data['nombre']) || mb_strlen(trim($data['nombre'])) < 2) {
            $errores['nombre'] = 'El nombre es obligatorio (mínimo 2 caracteres)';
        }
        if (empty($data['apellido']) || mb_strlen(trim($data['apellido'])) < 2) {
            $errores['apellido'] = 'El apellido es obligatorio (mínimo 2 caracteres)';
        }
        if (empty($data['correo']) || !filter_var($data['correo'], FILTER_VALIDATE_EMAIL)) {
            $errores['correo'] = 'El correo no tiene un formato válido';
        }
        if (!empty($data['telefono']) && !preg_match('/^[\d\s+-]{8,20}$/', $data['telefono'])) {
            $errores['telefono'] = 'El teléfono no tiene un formato válido';
        }

        // El rol debe existir y estar entre los que el administrador gestiona
        $idRol = intval($data['id_rol'] ?? 0);
        $rolValido = false;
        foreach ($this->model->getRoles() as $rol) {
            if (intval($rol->id_rol) === $idRol && in_array($rol->nombre, self::ROLES_PERSONAL, true)) {
                $rolValido = true;
            }
        }
        if (!$rolValido) {
            $errores['id_rol'] = 'Seleccione un rol válido (Encargado, Cocina o Administrador)';
        }

        // La contraseña es obligatoria al crear; al editar solo si la escriben
        $contrasena = $data['contrasena'] ?? '';
        if ($esNuevo || $contrasena !== '') {
            if (strlen($contrasena) < 8
                || !preg_match('/[A-Za-z]/', $contrasena)
                || !preg_match('/\d/', $contrasena)) {
                $errores['contrasena'] = 'La contraseña debe tener al menos 8 caracteres, con letras y números';
            }
        }

        return $errores;
    }
}
