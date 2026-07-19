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
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
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

    public function productosDisponibles($idExcluirProceso = null)
    {
        $sql = "SELECT p.id_producto, p.nombre
                FROM producto p
                WHERE p.esta_activo = 1
                  AND NOT EXISTS (
                      SELECT 1 FROM proceso_preparacion pp
                      WHERE pp.id_producto = p.id_producto AND pp.esta_activo = 1";
        if ($idExcluirProceso !== null) {
            $idExcluirProceso = intval($idExcluirProceso);
            $sql .= " AND pp.id_proceso <> $idExcluirProceso";
        }
        $sql .= "  )
                ORDER BY p.nombre ASC";
        return $this->db->executeSQL($sql);
    }

    public function existeParaProducto($idProducto, $idExcluir = null)
    {
        $idProducto = intval($idProducto);
        $sql = "SELECT id_proceso FROM proceso_preparacion
                WHERE id_producto = $idProducto AND esta_activo = 1";
        if ($idExcluir !== null) {
            $idExcluir = intval($idExcluir);
            $sql .= " AND id_proceso <> $idExcluir";
        }
        $sql .= " LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return is_array($result) && count($result) > 0;
    }

    public function create($data)
    {
        $idProducto = intval($data['id_producto']);
        $tiempo = intval($data['tiempo_estimado_total'] ?? 0);

        $sql = "INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total, esta_activo)
                VALUES ($idProducto, $tiempo, 1)";
        $idProceso = $this->db->executeSQL_DML_last($sql);

        if ($idProceso && !empty($data['estaciones']) && is_array($data['estaciones'])) {
            $this->setPasos($idProceso, $data['estaciones']);
        }
        return $idProceso;
    }

    public function update($id, $data)
    {
        $id = intval($id);
        $idProducto = intval($data['id_producto']);
        $tiempo = intval($data['tiempo_estimado_total'] ?? 0);

        $sql = "UPDATE proceso_preparacion
                SET id_producto = $idProducto,
                    tiempo_estimado_total = $tiempo
                WHERE id_proceso = $id";
        $this->db->executeSQL_DML($sql);

        if (isset($data['estaciones']) && is_array($data['estaciones'])) {
            $this->setPasos($id, $data['estaciones']);
        }
        return true;
    }

    private function setPasos($idProceso, $estaciones)
    {
        $idProceso = intval($idProceso);
        $this->db->executeSQL_DML("DELETE FROM paso_proceso WHERE id_proceso = $idProceso");
        if (empty($estaciones)) {
            return;
        }
        $values = [];
        $orden = 1;
        foreach ($estaciones as $est) {
            if (is_array($est) || is_object($est)) {
                $est = (array)$est;
                $idEst = intval($est['id_estacion'] ?? 0);
                $tiempo = intval($est['tiempo_estimado'] ?? 0);
                $inst = $this->db_escape($est['instrucciones'] ?? '');
                $ordenPaso = isset($est['orden_paso']) ? intval($est['orden_paso']) : $orden;
            } else {
                $idEst = intval($est);
                $tiempo = 0;
                $inst = '';
                $ordenPaso = $orden;
            }
            if ($idEst > 0) {
                $values[] = "($idProceso, $idEst, $ordenPaso, $tiempo, '$inst')";
                $orden++;
            }
        }
        if (!empty($values)) {
            $sql = "INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES " . implode(',', $values);
            $this->db->executeSQL_DML($sql);
        }
    }

    private function db_escape($value)
    {
        if ($value === null) return '';
        return str_replace(["\\", "'"], ["\\\\", "\\'"], (string)$value);
    }
}