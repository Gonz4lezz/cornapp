<?php

class ProcesoPreparacionModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    public function getAll()
    {
        $sql = "SELECT pp.id_proceso, pp.tiempo_estimado_total, pp.esta_activo,
                       p.id_producto, p.nombre AS nombre_producto,
                       (SELECT COUNT(*) FROM paso_proceso pas WHERE pas.id_proceso = pp.id_proceso) AS cantidad_pasos
                FROM proceso_preparacion pp
                INNER JOIN producto p ON pp.id_producto = p.id_producto
                WHERE pp.esta_activo = 1
                ORDER BY p.nombre ASC";
        return $this->db->executeSQL($sql);
    }

    public function getById($id)
    {
        $id = intval($id);
        $sql = "SELECT pp.id_proceso, pp.tiempo_estimado_total, pp.esta_activo,
                       pp.creado_en, pp.editado_en,
                       p.id_producto, p.nombre AS nombre_producto, p.descripcion AS descripcion_producto
                FROM proceso_preparacion pp
                INNER JOIN producto p ON pp.id_producto = p.id_producto
                WHERE pp.id_proceso = $id";
        $result = $this->db->executeSQL($sql);
        if (is_array($result) && count($result) > 0) {
            return $result[0];
        }
        return null;
    }

    public function getPasos($id)
    {
        $id = intval($id);
        $sql = "SELECT pas.id_paso, pas.orden_paso, pas.tiempo_estimado, pas.instrucciones,
                       ec.id_estacion, ec.nombre AS nombre_estacion, ec.descripcion AS descripcion_estacion,
                       ec.color_estacion
                FROM paso_proceso pas
                INNER JOIN estacion_cocina ec ON pas.id_estacion = ec.id_estacion
                WHERE pas.id_proceso = $id
                ORDER BY pas.orden_paso ASC";
        return $this->db->executeSQL($sql);
    }
}
