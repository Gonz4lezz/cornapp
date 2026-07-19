<?php

class EstacionModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    public function getAll()
    {
        $sql = "SELECT id_estacion, nombre, descripcion, color_estacion, esta_activo
                FROM estacion_cocina
                WHERE esta_activo = 1
                ORDER BY nombre ASC";
        return $this->db->executeSQL($sql);
    }
}
