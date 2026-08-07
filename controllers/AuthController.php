<?php

class AuthController
{
    private $model;
    private $response;
    private $request;

    public function __construct()
    {
        $this->model = new UsuarioModel();
        $this->response = new Response();
        $this->request = new Request();
    }

    // POST /AuthController/login — inicio de sesión con correo y contraseña
    public function login()
    {
        $data = $this->request->getJSON();
        $correo = trim($data->correo ?? '');
        $contrasena = $data->contrasena ?? '';

        if ($correo === '' || $contrasena === '') {
            $this->response->status(422)->toJSON(null, 'El correo y la contraseña son obligatorios');
            return;
        }

        $usuario = $this->model->getByCorreo($correo);
        if (!$usuario || !password_verify($contrasena, $usuario->contrasena_hash)) {
            $this->response->status(401)->toJSON(null, 'Correo o contraseña incorrectos');
            return;
        }
        if (!intval($usuario->esta_activo)) {
            $this->response->status(403)->toJSON(null, 'La cuenta está desactivada, contacte al administrador');
            return;
        }

        $this->responderConToken($usuario);
    }

    // POST /AuthController/registro — registro autónomo de clientes
    public function registro()
    {
        $data = $this->request->getJSON();
        $nombre = trim($data->nombre ?? '');
        $apellido = trim($data->apellido ?? '');
        $correo = trim($data->correo ?? '');
        $telefono = trim($data->telefono ?? '');
        $contrasena = $data->contrasena ?? '';

        $errores = [];
        if (mb_strlen($nombre) < 2) {
            $errores['nombre'] = 'El nombre es obligatorio (mínimo 2 caracteres)';
        }
        if (mb_strlen($apellido) < 2) {
            $errores['apellido'] = 'El apellido es obligatorio (mínimo 2 caracteres)';
        }
        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            $errores['correo'] = 'El correo no tiene un formato válido';
        }
        if (strlen($contrasena) < 8 || !preg_match('/[A-Za-z]/', $contrasena) || !preg_match('/\d/', $contrasena)) {
            $errores['contrasena'] = 'La contraseña debe tener al menos 8 caracteres, con letras y números';
        }
        if (!empty($errores)) {
            $this->response->status(422)->toJSON(['errores' => $errores], 'Datos inválidos');
            return;
        }
        if ($this->model->correoExiste($correo)) {
            $this->response->status(409)->toJSON([
                'campo' => 'correo',
                'mensaje' => 'Ya existe una cuenta registrada con ese correo'
            ], 'Correo duplicado');
            return;
        }

        $id = $this->model->crearCliente($nombre, $apellido, $correo, $telefono, $contrasena);
        if (!$id) {
            $this->response->status(500)->toJSON(null, 'No se pudo crear la cuenta');
            return;
        }

        $usuario = $this->model->getByCorreo($correo);
        $this->responderConToken($usuario, 201);
    }

    // POST /AuthController/google — inicio de sesión con Google.
    // Recibe el credential (id_token) del widget de Google Identity Services,
    // lo valida contra el web service de Google y crea la cuenta si no existe.
    public function google()
    {
        $data = $this->request->getJSON();
        $credential = trim($data->credential ?? '');
        if ($credential === '') {
            $this->response->status(422)->toJSON(null, 'No se recibió la credencial de Google');
            return;
        }

        $info = $this->verificarTokenGoogle($credential);
        if (!$info) {
            $this->response->status(401)->toJSON(null, 'No se pudo validar la sesión con Google, intente de nuevo');
            return;
        }

        // 1) ¿Ya inició sesión con esta cuenta de Google antes?
        $usuario = $this->model->getPorSocial('google', $info['sub']);

        // 2) ¿Existe un usuario con ese correo? Se vincula la cuenta de Google.
        if (!$usuario) {
            $existente = $this->model->getByCorreo($info['correo']);
            if ($existente) {
                $this->model->vincularSocial($existente->id_usuario, 'google', $info['sub']);
                $usuario = $existente;
            }
        }

        // 3) Usuario nuevo: se registra automáticamente como Cliente.
        if (!$usuario) {
            $id = $this->model->crearClienteGoogle($info['nombre'], $info['apellido'], $info['correo']);
            if (!$id) {
                $this->response->status(500)->toJSON(null, 'No se pudo crear la cuenta con Google');
                return;
            }
            $this->model->vincularSocial($id, 'google', $info['sub']);
            $usuario = $this->model->getByCorreo($info['correo']);
        }

        if (!intval($usuario->esta_activo)) {
            $this->response->status(403)->toJSON(null, 'La cuenta está desactivada, contacte al administrador');
            return;
        }

        $this->responderConToken($usuario);
    }

    // GET /AuthController/perfil — datos frescos del usuario autenticado
    public function perfil()
    {
        $payload = Auth::requerir();
        $usuario = $this->model->getById($payload->id_usuario);
        if (!$usuario) {
            $this->response->status(404)->toJSON(null, 'Usuario no encontrado');
            return;
        }
        $this->response->status(200)->toJSON($usuario);
    }

    // GET /AuthController/clientes — lista de clientes para que el
    // encargado (o admin) registre un pedido a nombre de uno.
    public function clientes()
    {
        Auth::requerir(['Encargado', 'Administrador']);
        $clientes = $this->model->getClientes();
        $this->response->status(200)->toJSON($clientes ?? []);
    }

    /**
     * Valida el id_token contra el web service de Google (tokeninfo) y
     * verifica que fue emitido para el Client ID de la aplicación.
     * Devuelve los datos del usuario o null si es inválido.
     */
    private function verificarTokenGoogle($credential)
    {
        $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential);
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $respuesta = curl_exec($ch);
        $codigo = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($respuesta === false || $codigo !== 200) {
            return null;
        }

        $info = json_decode($respuesta);
        if (!$info || empty($info->sub) || empty($info->email)) {
            return null;
        }
        // El token debe ser para ESTA aplicación, estar vigente y con correo verificado
        if (($info->aud ?? '') !== Config::get('GOOGLE_CLIENT_ID')) {
            return null;
        }
        if (intval($info->exp ?? 0) < time()) {
            return null;
        }
        if (($info->email_verified ?? 'false') !== 'true') {
            return null;
        }

        return [
            'sub'      => $info->sub,
            'correo'   => $info->email,
            'nombre'   => trim($info->given_name ?? '') !== '' ? $info->given_name : 'Cliente',
            'apellido' => trim($info->family_name ?? '') !== '' ? $info->family_name : 'Google',
        ];
    }

    private function responderConToken($usuario, $status = 200)
    {
        $token = Auth::generarToken($usuario);
        $this->response->status($status)->toJSON([
            'token' => $token,
            'usuario' => [
                'id_usuario' => intval($usuario->id_usuario),
                'nombre'     => $usuario->nombre,
                'apellido'   => $usuario->apellido,
                'correo'     => $usuario->correo,
                'rol'        => $usuario->rol,
            ],
        ]);
    }
}
