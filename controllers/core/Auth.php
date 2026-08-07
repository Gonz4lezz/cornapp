<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * Helper de autenticación con JWT (firebase/php-jwt).
 * Genera y valida los tokens, y permite exigir roles en los controladores.
 */
class Auth
{
    const ALGORITMO = 'HS256';
    const DURACION_SEGUNDOS = 28800; // 8 horas

    /**
     * Genera el JWT para un usuario autenticado.
     */
    public static function generarToken($usuario)
    {
        $ahora = time();
        $payload = [
            'id_usuario' => intval($usuario->id_usuario),
            'nombre'     => $usuario->nombre,
            'apellido'   => $usuario->apellido,
            'correo'     => $usuario->correo,
            'rol'        => $usuario->rol,
            'iat'        => $ahora,
            'exp'        => $ahora + self::DURACION_SEGUNDOS,
        ];
        return JWT::encode($payload, Config::get('SECRET_KEY'), self::ALGORITMO);
    }

    /**
     * Usuario autenticado según el token de la petición (o null).
     * Valida la firma y la expiración con la librería.
     */
    public static function usuario()
    {
        $token = self::tokenDeCabecera();
        if (!$token) {
            return null;
        }
        try {
            return JWT::decode($token, new Key(Config::get('SECRET_KEY'), self::ALGORITMO));
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Exige un usuario autenticado y, opcionalmente, uno de los roles dados.
     * Si no cumple responde 401/403 y termina la petición.
     */
    public static function requerir($roles = [])
    {
        $usuario = self::usuario();
        if (!$usuario) {
            http_response_code(401);
            echo json_encode(['status' => 401, 'result' => 'Debe iniciar sesión para realizar esta acción']);
            exit;
        }
        if (!empty($roles) && !in_array($usuario->rol, $roles, true)) {
            http_response_code(403);
            echo json_encode(['status' => 403, 'result' => 'No tiene permisos para realizar esta acción']);
            exit;
        }
        return $usuario;
    }

    private static function tokenDeCabecera()
    {
        $authHeader = null;
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        }
        if (!$authHeader) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
        }
        if (!$authHeader || stripos($authHeader, 'Bearer ') !== 0) {
            return null;
        }
        return trim(substr($authHeader, 7));
    }
}
