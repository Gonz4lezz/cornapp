<?php

class IngredienteModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    public function getAll()
    {
        $sql = "SELECT id_ingrediente, nombre, descripcion, es_alergeno, esta_activo
                FROM ingrediente
                WHERE esta_activo = 1
                ORDER BY nombre ASC";
        return $this->db->executeSQL($sql);
    }
}
