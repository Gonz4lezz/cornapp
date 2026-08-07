<?php

class UsuarioModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    // Usuario por correo, con el nombre del rol (para el login)
    public function getByCorreo($correo)
    {
        $correo = $this->db_escape($correo);
        $sql = "SELECT u.id_usuario, u.id_rol, u.nombre, u.apellido, u.correo, u.telefono,
                       u.contrasena_hash, u.esta_activo, r.nombre AS rol
                FROM usuario u
                INNER JOIN rol r ON u.id_rol = r.id_rol
                WHERE u.correo = '$correo'
                LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    public function getById($id)
    {
        $id = intval($id);
        $sql = "SELECT u.id_usuario, u.id_rol, u.nombre, u.apellido, u.correo, u.telefono,
                       u.esta_activo, r.nombre AS rol
                FROM usuario u
                INNER JOIN rol r ON u.id_rol = r.id_rol
                WHERE u.id_usuario = $id
                LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    public function correoExiste($correo)
    {
        $correo = $this->db_escape($correo);
        $sql = "SELECT id_usuario FROM usuario WHERE correo = '$correo' LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return is_array($result) && count($result) > 0;
    }

    // Registro autónomo: siempre con el rol Cliente
    public function crearCliente($nombre, $apellido, $correo, $telefono, $contrasena)
    {
        $nombre   = $this->db_escape($nombre);
        $apellido = $this->db_escape($apellido);
        $correo   = $this->db_escape($correo);
        $telefono = $telefono !== null && $telefono !== ''
            ? "'" . $this->db_escape($telefono) . "'" : 'NULL';
        $hash = password_hash($contrasena, PASSWORD_BCRYPT);

        $sql = "INSERT INTO usuario (id_rol, nombre, apellido, correo, telefono, contrasena_hash)
                SELECT id_rol, '$nombre', '$apellido', '$correo', $telefono, '$hash'
                FROM rol WHERE nombre = 'Cliente' LIMIT 1";
        return $this->db->executeSQL_DML_last($sql);
    }

    // Lista de clientes activos (para que el encargado registre pedidos a nombre de uno)
    public function getClientes()
    {
        $sql = "SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.telefono
                FROM usuario u
                INNER JOIN rol r ON u.id_rol = r.id_rol
                WHERE r.nombre = 'Cliente' AND u.esta_activo = 1
                ORDER BY u.nombre ASC, u.apellido ASC";
        return $this->db->executeSQL($sql);
    }

    // Usuario vinculado a un inicio de sesión social (Google/Facebook)
    public function getPorSocial($proveedor, $proveedorId)
    {
        $proveedor = $this->db_escape($proveedor);
        $proveedorId = $this->db_escape($proveedorId);
        $sql = "SELECT u.id_usuario, u.id_rol, u.nombre, u.apellido, u.correo, u.telefono,
                       u.esta_activo, r.nombre AS rol
                FROM inicio_sesion_social s
                INNER JOIN usuario u ON s.id_usuario = u.id_usuario
                INNER JOIN rol r ON u.id_rol = r.id_rol
                WHERE s.proveedor = '$proveedor' AND s.proveedor_id = '$proveedorId'
                LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    public function vincularSocial($idUsuario, $proveedor, $proveedorId)
    {
        $idUsuario = intval($idUsuario);
        $proveedor = $this->db_escape($proveedor);
        $proveedorId = $this->db_escape($proveedorId);
        $sql = "INSERT IGNORE INTO inicio_sesion_social (id_usuario, proveedor, proveedor_id)
                VALUES ($idUsuario, '$proveedor', '$proveedorId')";
        return $this->db->executeSQL_DML($sql);
    }

    // Alta de un cliente que llega por Google: sin contraseña utilizable
    // (se guarda un hash aleatorio) y con el correo ya verificado.
    public function crearClienteGoogle($nombre, $apellido, $correo)
    {
        $nombre   = $this->db_escape($nombre);
        $apellido = $this->db_escape($apellido);
        $correo   = $this->db_escape($correo);
        $hash = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);

        $sql = "INSERT INTO usuario (id_rol, nombre, apellido, correo, telefono, contrasena_hash, correo_verificado_en)
                SELECT id_rol, '$nombre', '$apellido', '$correo', NULL, '$hash', NOW()
                FROM rol WHERE nombre = 'Cliente' LIMIT 1";
        return $this->db->executeSQL_DML_last($sql);
    }

    private function db_escape($value)
    {
        if ($value === null) return '';
        return str_replace(["\\", "'"], ["\\\\", "\\'"], (string)$value);
    }
}
