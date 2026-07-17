<?php

class CategoriaModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    public function getAll()
    {
        $sql = "SELECT id_categoria, nombre, descripcion, orden_display, esta_activo
                FROM categoria
                WHERE esta_activo = 1
                ORDER BY orden_display ASC, nombre ASC";
        return $this->db->executeSQL($sql);
    }
}
