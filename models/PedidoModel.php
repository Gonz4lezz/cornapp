<?php

class PedidoModel
{
    const TASA_IMPUESTO = 0.13;

    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    public function getEstados()
    {
        return $this->db->executeSQL(
            "SELECT id_estado, nombre_estado, descripcion FROM estado_pedido ORDER BY id_estado ASC"
        ) ?? [];
    }

    public function getMetodosPago()
    {
        return $this->db->executeSQL(
            "SELECT id_metodo, nombre FROM metodo_pago ORDER BY id_metodo ASC"
        ) ?? [];
    }

    public function getTarifasEnvio()
    {
        return $this->db->executeSQL(
            "SELECT id_tarifa, nombre, tarifa_base, distancia_maxima_km
             FROM tarifa_envio WHERE esta_activo = 1 ORDER BY tarifa_base ASC"
        ) ?? [];
    }

    public function getTarifa($idTarifa)
    {
        $idTarifa = intval($idTarifa);
        $result = $this->db->executeSQL(
            "SELECT id_tarifa, nombre, tarifa_base FROM tarifa_envio
             WHERE id_tarifa = $idTarifa AND esta_activo = 1 LIMIT 1"
        );
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    public function crear($encabezado, $lineas, $idsCupones, $pago, $envio)
    {
        // Número de pedido consecutivo del año
        $result = $this->db->executeSQL("SELECT COALESCE(MAX(id_pedido), 0) + 1 AS siguiente FROM pedido");
        $siguiente = intval($result[0]->siguiente ?? 1);
        $numero = sprintf('PED-%s-%04d', date('Y'), $siguiente);

        $idCliente = intval($encabezado['id_cliente']);
        $idEmpleado = $encabezado['id_empleado'] ? intval($encabezado['id_empleado']) : 'NULL';
        $tipoEntrega = $this->db_escape($encabezado['tipo_entrega']);
        $subtotal = floatval($encabezado['subtotal']);
        $impuesto = floatval($encabezado['monto_impuesto']);
        $costoEnvio = floatval($encabezado['costo_envio']);
        $descuento = floatval($encabezado['monto_descuento']);
        $total = floatval($encabezado['monto_total']);
        $tasa = self::TASA_IMPUESTO;

        $idPedido = $this->db->executeSQL_DML_last(
            "INSERT INTO pedido (id_cliente, id_empleado, id_estado, numero_pedido, tipo_entrega,
                                 subtotal, tasa_impuesto, monto_impuesto, costo_envio, monto_descuento, monto_total)
             VALUES ($idCliente, $idEmpleado, 1, '$numero', '$tipoEntrega',
                     $subtotal, $tasa, $impuesto, $costoEnvio, $descuento, $total)"
        );
        if (!$idPedido) {
            return null;
        }

        foreach ($lineas as $linea) {
            $idProducto = !empty($linea['id_producto']) ? intval($linea['id_producto']) : 'NULL';
            $idCombo = !empty($linea['id_combo']) ? intval($linea['id_combo']) : 'NULL';
            $cantidad = intval($linea['cantidad']);
            $precioUnitario = floatval($linea['precio_unitario']);
            $precioTotal = floatval($linea['precio_total']);
            $montoDescuento = floatval($linea['monto_descuento']);
            $obs = $linea['observaciones'] !== null && trim($linea['observaciones']) !== ''
                ? "'" . $this->db_escape(trim($linea['observaciones'])) . "'" : 'NULL';

            $this->db->executeSQL_DML(
                "INSERT INTO detalle_pedido (id_pedido, id_producto, id_combo, cantidad,
                                             precio_unitario, precio_total, monto_descuento, observaciones)
                 VALUES ($idPedido, $idProducto, $idCombo, $cantidad,
                         $precioUnitario, $precioTotal, $montoDescuento, $obs)"
            );
        }

        foreach ($idsCupones as $idCupon) {
            $idCupon = intval($idCupon);
            $this->db->executeSQL_DML(
                "INSERT INTO pedido_cupon (id_pedido, id_cupon) VALUES ($idPedido, $idCupon)"
            );
            $this->db->executeSQL_DML(
                "UPDATE cupon SET cantidad_usos = cantidad_usos + 1 WHERE id_cupon = $idCupon"
            );
        }

        // Pago simulado: queda registrado como completado
        $idMetodo = intval($pago['id_metodo']);
        $transaccion = 'TXN-SIM-' . str_pad(strval($idPedido), 4, '0', STR_PAD_LEFT);
        $ultimos = $pago['ultimos_cuatro'] ? "'" . $this->db_escape($pago['ultimos_cuatro']) . "'" : 'NULL';
        $titular = $pago['titular_tarjeta'] ? "'" . $this->db_escape($pago['titular_tarjeta']) . "'" : 'NULL';
        $vencimiento = $pago['vencimiento_tarjeta'] ? "'" . $this->db_escape($pago['vencimiento_tarjeta']) . "'" : 'NULL';
        $recibido = $pago['efectivo_recibido'] !== null ? floatval($pago['efectivo_recibido']) : 'NULL';
        $vuelto = $pago['vuelto'] !== null ? floatval($pago['vuelto']) : 'NULL';

        $this->db->executeSQL_DML(
            "INSERT INTO pago (id_pedido, id_metodo, monto, estado_pago, id_transaccion,
                               ultimos_cuatro, titular_tarjeta, vencimiento_tarjeta,
                               efectivo_recibido, vuelto, procesado_en)
             VALUES ($idPedido, $idMetodo, $total, 'completado', '$transaccion',
                     $ultimos, $titular, $vencimiento, $recibido, $vuelto, NOW())"
        );

        if ($envio !== null) {
            $idTarifa = intval($envio['id_tarifa']);
            $direccion = $this->db_escape($envio['direccion']);
            $referencia = $envio['referencia'] !== null && trim($envio['referencia']) !== ''
                ? "'" . $this->db_escape(trim($envio['referencia'])) . "'" : 'NULL';
            $receptor = $this->db_escape($envio['nombre_receptor']);
            $telefono = $envio['telefono_receptor'] !== null && trim($envio['telefono_receptor']) !== ''
                ? "'" . $this->db_escape(trim($envio['telefono_receptor'])) . "'" : 'NULL';

            $this->db->executeSQL_DML(
                "INSERT INTO envio (id_pedido, id_tarifa, costo_envio, direccion_texto, referencia,
                                    nombre_receptor, telefono_receptor)
                 VALUES ($idPedido, $idTarifa, $costoEnvio, '$direccion', $referencia,
                         '$receptor', $telefono)"
            );
        }

        $registradoPor = $encabezado['id_empleado'] ? intval($encabezado['id_empleado']) : $idCliente;
        $this->registrarSeguimiento($idPedido, 1, $registradoPor, 'Pedido registrado y pagado');

        return $idPedido;
    }

    // ------------------------------------------------------------------
    // Consultas
    // ------------------------------------------------------------------

    // Historial del cliente, ordenado por fecha descendente
    public function getHistorialCliente($idCliente)
    {
        $idCliente = intval($idCliente);
        return $this->db->executeSQL(
            "SELECT p.id_pedido, p.numero_pedido, p.creado_en, p.tipo_entrega, p.monto_total,
                    e.nombre_estado, mp.nombre AS metodo_pago,
                    (SELECT SUM(d.cantidad) FROM detalle_pedido d WHERE d.id_pedido = p.id_pedido) AS cantidad_articulos
             FROM pedido p
             INNER JOIN estado_pedido e ON p.id_estado = e.id_estado
             LEFT JOIN pago pg ON pg.id_pedido = p.id_pedido
             LEFT JOIN metodo_pago mp ON pg.id_metodo = mp.id_metodo
             WHERE p.id_cliente = $idCliente
             ORDER BY p.creado_en DESC"
        ) ?? [];
    }

    // Todos los pedidos (encargado/admin) con filtros opcionales por fecha y estado
    public function getTodos($fecha = null, $idEstado = null)
    {
        $condiciones = [];
        if ($fecha !== null && preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
            $condiciones[] = "DATE(p.creado_en) = '" . $this->db_escape($fecha) . "'";
        }
        if ($idEstado !== null && intval($idEstado) > 0) {
            $condiciones[] = "p.id_estado = " . intval($idEstado);
        }
        $where = empty($condiciones) ? '' : 'WHERE ' . implode(' AND ', $condiciones);

        return $this->db->executeSQL(
            "SELECT p.id_pedido, p.numero_pedido, p.creado_en, p.tipo_entrega, p.monto_total,
                    e.id_estado, e.nombre_estado, mp.nombre AS metodo_pago,
                    uc.nombre AS nombre_cliente, uc.apellido AS apellido_cliente,
                    (SELECT SUM(d.cantidad) FROM detalle_pedido d WHERE d.id_pedido = p.id_pedido) AS cantidad_articulos
             FROM pedido p
             INNER JOIN estado_pedido e ON p.id_estado = e.id_estado
             INNER JOIN usuario uc ON p.id_cliente = uc.id_usuario
             LEFT JOIN pago pg ON pg.id_pedido = p.id_pedido
             LEFT JOIN metodo_pago mp ON pg.id_metodo = mp.id_metodo
             $where
             ORDER BY p.creado_en DESC"
        ) ?? [];
    }

    // Detalle completo del pedido en formato factura
    public function getDetalle($idPedido)
    {
        $idPedido = intval($idPedido);
        $encabezado = $this->db->executeSQL(
            "SELECT p.id_pedido, p.numero_pedido, p.creado_en, p.tipo_entrega,
                    p.subtotal, p.tasa_impuesto, p.monto_impuesto, p.costo_envio,
                    p.monto_descuento, p.monto_total,
                    p.id_cliente, p.id_empleado,
                    e.id_estado, e.nombre_estado,
                    uc.nombre AS nombre_cliente, uc.apellido AS apellido_cliente,
                    uc.correo AS correo_cliente, uc.telefono AS telefono_cliente,
                    ue.nombre AS nombre_encargado, ue.apellido AS apellido_encargado,
                    mp.nombre AS metodo_pago,
                    pg.ultimos_cuatro, pg.titular_tarjeta, pg.efectivo_recibido, pg.vuelto
             FROM pedido p
             INNER JOIN estado_pedido e ON p.id_estado = e.id_estado
             INNER JOIN usuario uc ON p.id_cliente = uc.id_usuario
             LEFT JOIN usuario ue ON p.id_empleado = ue.id_usuario
             LEFT JOIN pago pg ON pg.id_pedido = p.id_pedido
             LEFT JOIN metodo_pago mp ON pg.id_metodo = mp.id_metodo
             WHERE p.id_pedido = $idPedido
             LIMIT 1"
        );
        if (!is_array($encabezado) || count($encabezado) === 0) {
            return null;
        }
        $pedido = $encabezado[0];

        $pedido->detalles = $this->db->executeSQL(
            "SELECT d.id_detalle, d.id_producto, d.id_combo, d.cantidad,
                    d.precio_unitario, d.precio_total, d.monto_descuento, d.observaciones,
                    COALESCE(pr.nombre, co.nombre) AS nombre,
                    CASE WHEN d.id_producto IS NOT NULL THEN 'producto' ELSE 'combo' END AS tipo,
                    ROUND((d.precio_total - d.monto_descuento) * p.tasa_impuesto, 2) AS monto_impuesto
             FROM detalle_pedido d
             INNER JOIN pedido p ON d.id_pedido = p.id_pedido
             LEFT JOIN producto pr ON d.id_producto = pr.id_producto
             LEFT JOIN combo   co ON d.id_combo    = co.id_combo
             WHERE d.id_pedido = $idPedido
             ORDER BY d.id_detalle ASC"
        ) ?? [];

        $pedido->cupones = $this->db->executeSQL(
            "SELECT cu.id_cupon, cu.codigo, cu.nombre
             FROM pedido_cupon pc
             INNER JOIN cupon cu ON pc.id_cupon = cu.id_cupon
             WHERE pc.id_pedido = $idPedido"
        ) ?? [];

        $envio = $this->db->executeSQL(
            "SELECT e.direccion_texto, e.referencia, e.costo_envio,
                    e.nombre_receptor, e.telefono_receptor, t.nombre AS tarifa
             FROM envio e
             LEFT JOIN tarifa_envio t ON e.id_tarifa = t.id_tarifa
             WHERE e.id_pedido = $idPedido
             LIMIT 1"
        );
        $pedido->envio = (is_array($envio) && count($envio) > 0) ? $envio[0] : null;

        $pedido->seguimiento = $this->db->executeSQL(
            "SELECT s.id_estado, e.nombre_estado, s.comentario, s.cambiado_en,
                    u.nombre AS nombre_usuario, u.apellido AS apellido_usuario
             FROM seguimiento_pedido s
             INNER JOIN estado_pedido e ON s.id_estado = e.id_estado
             LEFT JOIN usuario u ON s.cambiado_por_usuario_id = u.id_usuario
             WHERE s.id_pedido = $idPedido
             ORDER BY s.cambiado_en ASC, s.id_seguimiento ASC"
        ) ?? [];

        return $pedido;
    }

    public function getBasico($idPedido)
    {
        $idPedido = intval($idPedido);
        $result = $this->db->executeSQL(
            "SELECT id_pedido, id_cliente, id_empleado, id_estado, numero_pedido
             FROM pedido WHERE id_pedido = $idPedido LIMIT 1"
        );
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    // ------------------------------------------------------------------
    // Cambios de estado
    // ------------------------------------------------------------------

    public function cambiarEstado($idPedido, $idEstado, $idUsuario, $comentario)
    {
        $idPedido = intval($idPedido);
        $idEstado = intval($idEstado);
        $this->db->executeSQL_DML(
            "UPDATE pedido SET id_estado = $idEstado WHERE id_pedido = $idPedido"
        );
        $this->registrarSeguimiento($idPedido, $idEstado, $idUsuario, $comentario);
        return true;
    }

    public function registrarSeguimiento($idPedido, $idEstado, $idUsuario, $comentario)
    {
        $idPedido = intval($idPedido);
        $idEstado = intval($idEstado);
        $idUsuario = $idUsuario ? intval($idUsuario) : 'NULL';
        $comentario = "'" . $this->db_escape($comentario) . "'";
        return $this->db->executeSQL_DML(
            "INSERT INTO seguimiento_pedido (id_pedido, id_estado, cambiado_por_usuario_id, comentario)
             VALUES ($idPedido, $idEstado, $idUsuario, $comentario)"
        );
    }

    /**
     * Acepta el pedido: crea la orden de cocina descomponiendo los combos
     * en productos individuales, cada uno colocado en la primera estación
     * del proceso de preparación de su producto.
     */
    public function aceptar($idPedido, $idUsuario)
    {
        $idPedido = intval($idPedido);

        $idOrden = $this->db->executeSQL_DML_last(
            "INSERT INTO orden_cocina (id_pedido, estado) VALUES ($idPedido, 'pendiente')"
        );
        if (!$idOrden) {
            return false;
        }

        // Productos directos del pedido
        $this->db->executeSQL_DML(
            "INSERT INTO item_orden_cocina (id_orden_cocina, id_detalle, id_producto, cantidad, id_estacion_actual, estado)
             SELECT $idOrden, d.id_detalle, d.id_producto, d.cantidad,
                    (SELECT pp.id_estacion FROM proceso_preparacion pr
                     INNER JOIN paso_proceso pp ON pp.id_proceso = pr.id_proceso
                     WHERE pr.id_producto = d.id_producto AND pr.esta_activo = 1
                     ORDER BY pp.orden_paso ASC LIMIT 1),
                    'pendiente'
             FROM detalle_pedido d
             WHERE d.id_pedido = $idPedido AND d.id_producto IS NOT NULL"
        );

        // Combos: se descomponen en sus productos individuales
        $this->db->executeSQL_DML(
            "INSERT INTO item_orden_cocina (id_orden_cocina, id_detalle, id_producto, cantidad, id_estacion_actual, estado)
             SELECT $idOrden, d.id_detalle, cp.id_producto, d.cantidad * cp.cantidad,
                    (SELECT pp.id_estacion FROM proceso_preparacion pr
                     INNER JOIN paso_proceso pp ON pp.id_proceso = pr.id_proceso
                     WHERE pr.id_producto = cp.id_producto AND pr.esta_activo = 1
                     ORDER BY pp.orden_paso ASC LIMIT 1),
                    'pendiente'
             FROM detalle_pedido d
             INNER JOIN combo_producto cp ON cp.id_combo = d.id_combo
             WHERE d.id_pedido = $idPedido AND d.id_combo IS NOT NULL"
        );

        $this->cambiarEstado($idPedido, 2, $idUsuario, 'Pedido aceptado y enviado a cocina');
        return true;
    }

    private function db_escape($value)
    {
        if ($value === null) return '';
        return str_replace(["\\", "'"], ["\\\\", "\\'"], (string)$value);
    }
}
