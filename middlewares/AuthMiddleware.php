<?php

class AuthMiddleware
{
    public function handle($requiredRoles = [])
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if (!$authHeader) {
            http_response_code(401);
            echo json_encode(['status' => 401, 'result' => 'Token no proporcionado']);
            return false;
        }

        $token = str_replace('Bearer ', '', $authHeader);

        try {
            $secretKey = Config::get('SECRET_KEY');
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                throw new \Exception('Token inválido');
            }

            $payload = json_decode(base64_decode($parts[1]), true);
            if (!$payload) {
                throw new \Exception('Token inválido');
            }

            if (isset($payload['exp']) && $payload['exp'] < time()) {
                http_response_code(401);
                echo json_encode(['status' => 401, 'result' => 'Token expirado']);
                return false;
            }

            $userRole = $payload['rol'] ?? '';
            if (!empty($requiredRoles) && !in_array($userRole, $requiredRoles)) {
                http_response_code(403);
                echo json_encode(['status' => 403, 'result' => 'No tiene permisos para acceder a este recurso']);
                return false;
            }

            $_REQUEST['user_id'] = $payload['id_usuario'] ?? null;
            $_REQUEST['user_role'] = $userRole;

            return true;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['status' => 401, 'result' => 'Token inválido']);
            return false;
        }
    }
}
