<?php

/**
 * Consultas de estadísticas para el tablero de control.
 * Los combos se descomponen en sus productos para que el ranking refleje
 * lo que realmente se preparó, no solo lo que se facturó.
 */
class DashboardModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    /**
     * Productos más pedidos: suma las unidades vendidas de forma directa
     * y las que entraron dentro de un combo.
     */
    public function getTopProductos($limite = 3)
    {
        $limite = intval($limite);
        return $this->db->executeSQL(
            "SELECT p.id_producto, p.nombre, SUM(t.unidades) AS unidades
             FROM (
                    SELECT d.id_producto, d.cantidad AS unidades
                    FROM detalle_pedido d
                    WHERE d.id_producto IS NOT NULL
                    UNION ALL
                    SELECT cp.id_producto, d.cantidad * cp.cantidad AS unidades
                    FROM detalle_pedido d
                    INNER JOIN combo_producto cp ON cp.id_combo = d.id_combo
                    WHERE d.id_combo IS NOT NULL
                  ) t
             INNER JOIN producto p ON p.id_producto = t.id_producto
             GROUP BY p.id_producto, p.nombre
             ORDER BY unidades DESC, p.nombre ASC
             LIMIT $limite"
        ) ?? [];
    }

    // Cantidad de pedidos por estado registrados el día de hoy
    public function getPedidosPorEstadoHoy()
    {
        return $this->db->executeSQL(
            "SELECT e.id_estado, e.nombre_estado,
                    COUNT(p.id_pedido) AS cantidad
             FROM estado_pedido e
             LEFT JOIN pedido p
                    ON p.id_estado = e.id_estado
                   AND DATE(p.creado_en) = CURDATE()
             GROUP BY e.id_estado, e.nombre_estado
             ORDER BY e.id_estado ASC"
        ) ?? [];
    }

    // Cifras de resumen del día, para las tarjetas del tablero
    public function getResumenHoy()
    {
        $result = $this->db->executeSQL(
            "SELECT COUNT(*) AS pedidos,
                    COALESCE(SUM(monto_total), 0) AS ingresos,
                    COALESCE(SUM(costo_envio), 0) AS envios
             FROM pedido
             WHERE DATE(creado_en) = CURDATE()"
        );
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }
}
