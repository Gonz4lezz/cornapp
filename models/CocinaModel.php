<?php

class CocinaModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    /**
     * Items activos del tablero de cocina (órdenes no completadas),
     */
    public function getItems($idEstacion = null)
    {
        $filtroEstacion = '';
        if ($idEstacion !== null && intval($idEstacion) > 0) {
            $filtroEstacion = 'AND i.id_estacion_actual = ' . intval($idEstacion);
        }

        $sql = "SELECT i.id_item_cocina, i.id_orden_cocina, i.id_detalle, i.id_producto,
                       i.cantidad, i.estado, i.id_estacion_actual, i.iniciado_en, i.completado_en,
                       o.id_pedido, o.estado AS estado_orden,
                       p.numero_pedido, p.creado_en AS fecha_pedido, p.tipo_entrega,
                       pr.nombre AS producto, d.observaciones,
                       es.nombre AS estacion, es.color_estacion,
                       CASE WHEN d.id_combo IS NOT NULL THEN co.nombre ELSE NULL END AS nombre_combo,
                       (SELECT COUNT(*) FROM paso_proceso pp
                        INNER JOIN proceso_preparacion prc ON pp.id_proceso = prc.id_proceso
                        WHERE prc.id_producto = i.id_producto AND prc.esta_activo = 1) AS total_pasos,
                       (SELECT MIN(pp.orden_paso) FROM paso_proceso pp
                        INNER JOIN proceso_preparacion prc ON pp.id_proceso = prc.id_proceso
                        WHERE prc.id_producto = i.id_producto AND prc.esta_activo = 1
                          AND pp.id_estacion = i.id_estacion_actual) AS paso_actual
                FROM item_orden_cocina i
                INNER JOIN orden_cocina o ON i.id_orden_cocina = o.id_orden_cocina
                INNER JOIN pedido p ON o.id_pedido = p.id_pedido
                INNER JOIN producto pr ON i.id_producto = pr.id_producto
                INNER JOIN detalle_pedido d ON i.id_detalle = d.id_detalle
                LEFT JOIN combo co ON d.id_combo = co.id_combo
                LEFT JOIN estacion_cocina es ON i.id_estacion_actual = es.id_estacion
                WHERE o.estado <> 'completado' $filtroEstacion
                ORDER BY p.creado_en ASC, i.id_item_cocina ASC";
        return $this->db->executeSQL($sql) ?? [];
    }

    public function getItem($idItem)
    {
        $idItem = intval($idItem);
        $sql = "SELECT i.id_item_cocina, i.id_orden_cocina, i.id_producto, i.cantidad,
                       i.estado, i.id_estacion_actual,
                       o.id_pedido, o.estado AS estado_orden
                FROM item_orden_cocina i
                INNER JOIN orden_cocina o ON i.id_orden_cocina = o.id_orden_cocina
                WHERE i.id_item_cocina = $idItem
                LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    // Estaciones ordenadas del proceso de preparación activo del producto
    public function getPasosDeProducto($idProducto)
    {
        $idProducto = intval($idProducto);
        $sql = "SELECT pp.orden_paso, pp.id_estacion
                FROM paso_proceso pp
                INNER JOIN proceso_preparacion prc ON pp.id_proceso = prc.id_proceso
                WHERE prc.id_producto = $idProducto AND prc.esta_activo = 1
                ORDER BY pp.orden_paso ASC";
        return $this->db->executeSQL($sql) ?? [];
    }

    public function iniciarItem($idItem)
    {
        $idItem = intval($idItem);
        return $this->db->executeSQL_DML(
            "UPDATE item_orden_cocina SET estado = 'en_proceso', iniciado_en = NOW()
             WHERE id_item_cocina = $idItem"
        );
    }

    public function moverItem($idItem, $idEstacion)
    {
        $idItem = intval($idItem);
        $idEstacion = intval($idEstacion);
        return $this->db->executeSQL_DML(
            "UPDATE item_orden_cocina SET id_estacion_actual = $idEstacion
             WHERE id_item_cocina = $idItem"
        );
    }

    public function completarItem($idItem, $idUsuario)
    {
        $idItem = intval($idItem);
        $idUsuario = intval($idUsuario);
        return $this->db->executeSQL_DML(
            "UPDATE item_orden_cocina
             SET estado = 'completado', completado_en = NOW(), completado_por_usuario_id = $idUsuario
             WHERE id_item_cocina = $idItem"
        );
    }

    public function iniciarOrden($idOrden)
    {
        $idOrden = intval($idOrden);
        return $this->db->executeSQL_DML(
            "UPDATE orden_cocina SET estado = 'en_proceso', iniciado_en = NOW()
             WHERE id_orden_cocina = $idOrden AND estado = 'pendiente'"
        );
    }

    public function quedanItemsPendientes($idOrden)
    {
        $idOrden = intval($idOrden);
        $result = $this->db->executeSQL(
            "SELECT COUNT(*) AS pendientes FROM item_orden_cocina
             WHERE id_orden_cocina = $idOrden AND estado <> 'completado'"
        );
        return intval($result[0]->pendientes ?? 0) > 0;
    }

    public function completarOrden($idOrden)
    {
        $idOrden = intval($idOrden);
        return $this->db->executeSQL_DML(
            "UPDATE orden_cocina SET estado = 'completado', completado_en = NOW()
             WHERE id_orden_cocina = $idOrden"
        );
    }
}
