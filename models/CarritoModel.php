<?php

class CarritoModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    // Líneas del carrito del usuario con la info del producto o combo
    public function getItems($idUsuario)
    {
        $idUsuario = intval($idUsuario);
        $sql = "SELECT c.id_carrito, c.id_producto, c.id_combo, c.cantidad, c.observaciones,
                       COALESCE(p.nombre, co.nombre) AS nombre,
                       COALESCE(p.precio_base, co.precio_combo) AS precio_unitario,
                       CASE WHEN c.id_producto IS NOT NULL THEN 'producto' ELSE 'combo' END AS tipo,
                       CASE
                           WHEN c.id_producto IS NOT NULL THEN (SELECT ip.url_imagen FROM imagen_producto ip
                               WHERE ip.id_producto = c.id_producto AND ip.es_principal = 1 LIMIT 1)
                           ELSE (SELECT ic.url_imagen FROM imagen_combo ic
                               WHERE ic.id_combo = c.id_combo AND ic.es_principal = 1 LIMIT 1)
                       END AS imagen
                FROM carrito_compra c
                LEFT JOIN producto p ON c.id_producto = p.id_producto
                LEFT JOIN combo   co ON c.id_combo    = co.id_combo
                WHERE c.id_usuario = $idUsuario
                ORDER BY c.creado_en ASC, c.id_carrito ASC";
        return $this->db->executeSQL($sql) ?? [];
    }

    // Cupones aplicados al carrito del usuario, con los datos para calcular el descuento
    public function getCupones($idUsuario)
    {
        $idUsuario = intval($idUsuario);
        $sql = "SELECT cu.id_cupon, cu.codigo, cu.nombre, cu.tipo_descuento, cu.valor_descuento,
                       cu.id_producto, cu.id_combo,
                       COALESCE(p.nombre, co.nombre) AS nombre_objetivo
                FROM carrito_cupon cc
                INNER JOIN cupon cu ON cc.id_cupon = cu.id_cupon
                LEFT JOIN producto p ON cu.id_producto = p.id_producto
                LEFT JOIN combo   co ON cu.id_combo    = co.id_combo
                WHERE cc.id_usuario = $idUsuario
                ORDER BY cc.creado_en ASC";
        return $this->db->executeSQL($sql) ?? [];
    }

    public function getItem($idCarrito, $idUsuario)
    {
        $idCarrito = intval($idCarrito);
        $idUsuario = intval($idUsuario);
        $sql = "SELECT id_carrito, id_usuario, id_producto, id_combo, cantidad, observaciones
                FROM carrito_compra
                WHERE id_carrito = $idCarrito AND id_usuario = $idUsuario
                LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    // Agrega un producto o combo; si ya está en el carrito suma la cantidad
    public function agregar($idUsuario, $idProducto, $idCombo, $cantidad)
    {
        $idUsuario = intval($idUsuario);
        $cantidad = intval($cantidad);

        if ($idProducto) {
            $idProducto = intval($idProducto);
            $filtro = "id_producto = $idProducto";
            $valores = "($idUsuario, $idProducto, NULL, $cantidad)";
        } else {
            $idCombo = intval($idCombo);
            $filtro = "id_combo = $idCombo";
            $valores = "($idUsuario, NULL, $idCombo, $cantidad)";
        }

        $sql = "SELECT id_carrito FROM carrito_compra
                WHERE id_usuario = $idUsuario AND $filtro LIMIT 1";
        $existente = $this->db->executeSQL($sql);

        if (is_array($existente) && count($existente) > 0) {
            $idCarrito = intval($existente[0]->id_carrito);
            $this->db->executeSQL_DML(
                "UPDATE carrito_compra SET cantidad = cantidad + $cantidad WHERE id_carrito = $idCarrito"
            );
            return $idCarrito;
        }

        return $this->db->executeSQL_DML_last(
            "INSERT INTO carrito_compra (id_usuario, id_producto, id_combo, cantidad) VALUES $valores"
        );
    }

    public function actualizarCantidad($idCarrito, $idUsuario, $cantidad)
    {
        $idCarrito = intval($idCarrito);
        $idUsuario = intval($idUsuario);
        $cantidad = intval($cantidad);
        return $this->db->executeSQL_DML(
            "UPDATE carrito_compra SET cantidad = $cantidad
             WHERE id_carrito = $idCarrito AND id_usuario = $idUsuario"
        );
    }

    public function actualizarObservaciones($idCarrito, $idUsuario, $observaciones)
    {
        $idCarrito = intval($idCarrito);
        $idUsuario = intval($idUsuario);
        $obs = $observaciones !== null && trim($observaciones) !== ''
            ? "'" . $this->db_escape(trim($observaciones)) . "'" : 'NULL';
        return $this->db->executeSQL_DML(
            "UPDATE carrito_compra SET observaciones = $obs
             WHERE id_carrito = $idCarrito AND id_usuario = $idUsuario"
        );
    }

    public function eliminar($idCarrito, $idUsuario)
    {
        $idCarrito = intval($idCarrito);
        $idUsuario = intval($idUsuario);
        return $this->db->executeSQL_DML(
            "DELETE FROM carrito_compra WHERE id_carrito = $idCarrito AND id_usuario = $idUsuario"
        );
    }

    // Elimina los cupones que quedaron sin su producto/combo en el carrito
    public function limpiarCuponesHuerfanos($idUsuario)
    {
        $idUsuario = intval($idUsuario);
        $sql = "DELETE cc FROM carrito_cupon cc
                INNER JOIN cupon cu ON cc.id_cupon = cu.id_cupon
                WHERE cc.id_usuario = $idUsuario
                  AND NOT EXISTS (
                      SELECT 1 FROM carrito_compra c
                      WHERE c.id_usuario = cc.id_usuario
                        AND ((cu.id_producto IS NOT NULL AND c.id_producto = cu.id_producto)
                          OR (cu.id_combo    IS NOT NULL AND c.id_combo    = cu.id_combo))
                  )";
        return $this->db->executeSQL_DML($sql);
    }

    public function vaciar($idUsuario)
    {
        $idUsuario = intval($idUsuario);
        $this->db->executeSQL_DML("DELETE FROM carrito_cupon   WHERE id_usuario = $idUsuario");
        $this->db->executeSQL_DML("DELETE FROM carrito_compra  WHERE id_usuario = $idUsuario");
        return true;
    }

    // Cupón vigente por código (activo, en fechas y con usos disponibles)
    public function getCuponVigentePorCodigo($codigo)
    {
        $codigo = $this->db_escape(trim($codigo));
        $sql = "SELECT id_cupon, codigo, nombre, tipo_descuento, valor_descuento,
                       id_producto, id_combo, limite_usos, cantidad_usos, monto_minimo_pedido
                FROM cupon
                WHERE codigo = '$codigo' AND esta_activo = 1
                  AND NOW() BETWEEN fecha_inicio AND fecha_fin
                LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    public function aplicarCupon($idUsuario, $idCupon)
    {
        $idUsuario = intval($idUsuario);
        $idCupon = intval($idCupon);
        return $this->db->executeSQL_DML(
            "INSERT IGNORE INTO carrito_cupon (id_usuario, id_cupon) VALUES ($idUsuario, $idCupon)"
        );
    }

    public function quitarCupon($idUsuario, $idCupon)
    {
        $idUsuario = intval($idUsuario);
        $idCupon = intval($idCupon);
        return $this->db->executeSQL_DML(
            "DELETE FROM carrito_cupon WHERE id_usuario = $idUsuario AND id_cupon = $idCupon"
        );
    }

    private function db_escape($value)
    {
        if ($value === null) return '';
        return str_replace(["\\", "'"], ["\\\\", "\\'"], (string)$value);
    }
}
