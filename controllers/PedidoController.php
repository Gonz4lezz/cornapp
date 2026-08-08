<?php

class PedidoController
{
    const ROLES_COMPRA = ['Cliente', 'Encargado', 'Administrador'];
    const ROLES_GESTION = ['Encargado', 'Administrador'];

    private $model;
    private $carritoModel;
    private $usuarioModel;
    private $response;
    private $request;

    public function __construct()
    {
        $this->model = new PedidoModel();
        $this->carritoModel = new CarritoModel();
        $this->usuarioModel = new UsuarioModel();
        $this->response = new Response();
        $this->request = new Request();
    }

    // GET /PedidoController/catalogos — estados, métodos de pago y tarifas de envío
    public function catalogos()
    {
        Auth::requerir(self::ROLES_COMPRA);
        $this->response->status(200)->toJSON([
            'estados' => $this->model->getEstados(),
            'metodosPago' => $this->model->getMetodosPago(),
            'tarifasEnvio' => $this->model->getTarifasEnvio(),
        ]);
    }

    // GET /PedidoController/historial — según el rol:
    //   Cliente: solo sus pedidos. Encargado/Admin: todos, con filtros fecha y estado.
    public function historial()
    {
        $usuario = Auth::requerir(self::ROLES_COMPRA);

        if ($usuario->rol === 'Cliente') {
            $pedidos = $this->model->getHistorialCliente($usuario->id_usuario);
        } else {
            $fecha = $_GET['fecha'] ?? null;
            $estado = $_GET['estado'] ?? null;
            $pedidos = $this->model->getTodos($fecha, $estado);
        }
        $this->response->status(200)->toJSON($pedidos ?? []);
    }

    // GET /PedidoController/{id} — detalle en formato factura
    public function get($id)
    {
        $usuario = Auth::requerir(['Cliente', 'Encargado', 'Administrador', 'Cocina']);
        $pedido = $this->model->getDetalle($id);
        if (!$pedido) {
            $this->response->status(404)->toJSON(null, 'Pedido no encontrado');
            return;
        }
        // El cliente solo puede ver sus propios pedidos
        if ($usuario->rol === 'Cliente' && intval($pedido->id_cliente) !== intval($usuario->id_usuario)) {
            $this->response->status(403)->toJSON(null, 'No tiene permisos para ver este pedido');
            return;
        }
        $this->response->status(200)->toJSON($pedido);
    }

    // POST /PedidoController/crear — registra el pedido a partir del carrito
    public function crear()
    {
        $usuario = Auth::requerir(self::ROLES_COMPRA);
        $data = $this->request->getJSON();

        // --- Cliente y encargado según el rol logueado (se establece en la lógica) ---
        if ($usuario->rol === 'Cliente') {
            $idCliente = intval($usuario->id_usuario);
            $idEmpleado = null;
        } else {
            $idCliente = intval($data->id_cliente ?? 0);
            $idEmpleado = intval($usuario->id_usuario);
            $cliente = $idCliente > 0 ? $this->usuarioModel->getById($idCliente) : null;
            if (!$cliente || $cliente->rol !== 'Cliente') {
                $this->response->status(422)->toJSON(null, 'Debe seleccionar un cliente válido para el pedido');
                return;
            }
        }

        // --- Carrito (los precios y descuentos se recalculan en el servidor) ---
        $items = $this->carritoModel->getItems($usuario->id_usuario);
        if (empty($items)) {
            $this->response->status(422)->toJSON(null, 'El carrito está vacío');
            return;
        }
        $cupones = $this->carritoModel->getCupones($usuario->id_usuario);

        // --- Método de entrega ---
        $tipoEntrega = $data->tipo_entrega ?? '';
        if (!in_array($tipoEntrega, ['recogida', 'domicilio'], true)) {
            $this->response->status(422)->toJSON(null, 'Debe seleccionar el método de entrega');
            return;
        }

        $costoEnvio = 0.0;
        $envio = null;
        if ($tipoEntrega === 'domicilio') {
            $tarifa = $this->model->getTarifa(intval($data->id_tarifa ?? 0));
            $direccion = trim($data->direccion ?? '');
            if (!$tarifa) {
                $this->response->status(422)->toJSON(null, 'Debe seleccionar la zona de envío');
                return;
            }
            if (mb_strlen($direccion) < 10) {
                $this->response->status(422)->toJSON(null, 'Debe indicar la dirección de entrega (mínimo 10 caracteres)');
                return;
            }
            $costoEnvio = floatval($tarifa->tarifa_base);
            $clienteEnvio = $this->usuarioModel->getById($idCliente);
            $envio = [
                'id_tarifa' => $tarifa->id_tarifa,
                'direccion' => $direccion,
                'referencia' => $data->referencia ?? null,
                'nombre_receptor' => trim($clienteEnvio->nombre . ' ' . $clienteEnvio->apellido),
                'telefono_receptor' => $clienteEnvio->telefono,
            ];
        }

        // --- Cálculo de líneas, descuentos e impuestos (13% por línea) ---
        $lineas = [];
        $subtotal = 0.0;
        $descuentoTotal = 0.0;
        $impuestoTotal = 0.0;
        foreach ((array)$items as $item) {
            $precioUnitario = floatval($item->precio_unitario);
            $cantidad = intval($item->cantidad);
            $precioTotal = round($precioUnitario * $cantidad, 2);
            $descuento = $this->descuentoDeLinea($item, $cupones, $precioTotal);
            $impuestoLinea = round(($precioTotal - $descuento) * PedidoModel::TASA_IMPUESTO, 2);

            $subtotal += $precioTotal;
            $descuentoTotal += $descuento;
            $impuestoTotal += $impuestoLinea;

            $lineas[] = [
                'id_producto' => $item->id_producto,
                'id_combo' => $item->id_combo,
                'cantidad' => $cantidad,
                'precio_unitario' => $precioUnitario,
                'precio_total' => $precioTotal,
                'monto_descuento' => $descuento,
                'observaciones' => $item->observaciones,
            ];
        }
        $total = round($subtotal - $descuentoTotal + $impuestoTotal + $costoEnvio, 2);

        // --- Pago simulado (tarjetas o efectivo) ---
        $metodos = $this->model->getMetodosPago();
        $idMetodo = intval($data->id_metodo ?? 0);
        $metodo = null;
        foreach ((array)$metodos as $m) {
            if (intval($m->id_metodo) === $idMetodo) {
                $metodo = $m;
            }
        }
        if (!$metodo) {
            $this->response->status(422)->toJSON(null, 'Debe seleccionar el método de pago');
            return;
        }

        $pago = [
            'id_metodo' => $idMetodo,
            'ultimos_cuatro' => null,
            'titular_tarjeta' => null,
            'vencimiento_tarjeta' => null,
            'efectivo_recibido' => null,
            'vuelto' => null,
        ];

        if (stripos($metodo->nombre, 'tarjeta') !== false) {
            $tarjeta = $data->tarjeta ?? null;
            $error = $this->validarTarjeta($tarjeta);
            if ($error !== null) {
                $this->response->status(422)->toJSON(null, $error);
                return;
            }
            $numero = preg_replace('/\D/', '', $tarjeta->numero);
            $pago['ultimos_cuatro'] = substr($numero, -4);
            $pago['titular_tarjeta'] = trim($tarjeta->titular);
            $pago['vencimiento_tarjeta'] = $this->normalizarVencimiento($tarjeta->vencimiento);
        } else {
            $recibido = floatval($data->efectivo_recibido ?? 0);
            if ($recibido < $total) {
                $this->response->status(422)->toJSON(
                    null,
                    'El monto recibido en efectivo no alcanza para cubrir el total del pedido'
                );
                return;
            }
            $pago['efectivo_recibido'] = round($recibido, 2);
            $pago['vuelto'] = round($recibido - $total, 2);
        }

        // --- Registro ---
        $idPedido = $this->model->crear(
            [
                'id_cliente' => $idCliente,
                'id_empleado' => $idEmpleado,
                'tipo_entrega' => $tipoEntrega,
                'subtotal' => round($subtotal, 2),
                'monto_impuesto' => round($impuestoTotal, 2),
                'costo_envio' => round($costoEnvio, 2),
                'monto_descuento' => round($descuentoTotal, 2),
                'monto_total' => $total,
            ],
            $lineas,
            is_array($cupones) ? array_map(fn($c) => $c->id_cupon, $cupones) : [],
            $pago,
            $envio
        );

        if (!$idPedido) {
            $this->response->status(500)->toJSON(null, 'No se pudo registrar el pedido');
            return;
        }

        $this->carritoModel->vaciar($usuario->id_usuario);
        $this->response->status(201)->toJSON([
            'id_pedido' => $idPedido,
            'vuelto' => $pago['vuelto'],
        ], 'Pedido registrado correctamente');
    }

    // POST /PedidoController/aceptar — el encargado acepta y envía a cocina
    public function aceptar()
    {
        $usuario = Auth::requerir(self::ROLES_GESTION);
        $data = $this->request->getJSON();
        $idPedido = intval($data->id_pedido ?? 0);

        $pedido = $this->model->getBasico($idPedido);
        if (!$pedido) {
            $this->response->status(404)->toJSON(null, 'Pedido no encontrado');
            return;
        }
        if (intval($pedido->id_estado) !== 1) {
            $this->response->status(409)->toJSON(null, 'Solo se pueden aceptar pedidos en estado Registrado');
            return;
        }

        $this->model->aceptar($idPedido, $usuario->id_usuario);
        $this->response->status(200)->toJSON($this->model->getDetalle($idPedido), 'Pedido aceptado y enviado a cocina');
    }

    // POST /PedidoController/entregar — el encargado marca el pedido como entregado
    public function entregar()
    {
        $usuario = Auth::requerir(self::ROLES_GESTION);
        $data = $this->request->getJSON();
        $idPedido = intval($data->id_pedido ?? 0);

        $pedido = $this->model->getBasico($idPedido);
        if (!$pedido) {
            $this->response->status(404)->toJSON(null, 'Pedido no encontrado');
            return;
        }
        if (intval($pedido->id_estado) !== 4) {
            $this->response->status(409)->toJSON(null, 'Solo se pueden entregar pedidos que estén Listos');
            return;
        }

        $this->model->cambiarEstado($idPedido, 5, $usuario->id_usuario, 'Pedido entregado al cliente');
        $this->response->status(200)->toJSON($this->model->getDetalle($idPedido), 'Pedido marcado como entregado');
    }

    // ------------------------------------------------------------------

    // Descuento de una línea según los cupones aplicados (uno por artículo):
    // porcentaje sobre el total de la línea o monto fijo (una vez por línea).
    private function descuentoDeLinea($item, $cupones, $precioTotal)
    {
        foreach ($cupones as $cupon) {
            $aplicaProducto = $cupon->id_producto && intval($item->id_producto) === intval($cupon->id_producto);
            $aplicaCombo = $cupon->id_combo && intval($item->id_combo) === intval($cupon->id_combo);
            if (!$aplicaProducto && !$aplicaCombo) {
                continue;
            }
            if ($cupon->tipo_descuento === 'porcentaje') {
                return round($precioTotal * floatval($cupon->valor_descuento) / 100, 2);
            }
            return round(min(floatval($cupon->valor_descuento), $precioTotal), 2);
        }
        return 0.0;
    }

    // Validación de la tarjeta simulada: titular, número (Luhn), vencimiento y CVV
    private function validarTarjeta($tarjeta)
    {
        if (!$tarjeta) {
            return 'Debe completar los datos de la tarjeta';
        }
        if (mb_strlen(trim($tarjeta->titular ?? '')) < 5) {
            return 'Debe indicar el nombre del titular como aparece en la tarjeta';
        }
        $numero = preg_replace('/\D/', '', $tarjeta->numero ?? '');
        if (strlen($numero) < 13 || strlen($numero) > 19 || !$this->luhnValido($numero)) {
            return 'El número de tarjeta no es válido';
        }
        $vencimiento = $this->normalizarVencimiento($tarjeta->vencimiento ?? '');
        if ($vencimiento === null) {
            return 'El vencimiento de la tarjeta no es válido o ya expiró';
        }
        $cvv = trim($tarjeta->cvv ?? '');
        if (!preg_match('/^\d{3,4}$/', $cvv)) {
            return 'El código de seguridad (CVV) debe tener 3 o 4 dígitos';
        }
        return null;
    }

    // Algoritmo de Luhn: método estándar de verificación de números de tarjeta
    private function luhnValido($numero)
    {
        $suma = 0;
        $alternar = false;
        for ($i = strlen($numero) - 1; $i >= 0; $i--) {
            $digito = intval($numero[$i]);
            if ($alternar) {
                $digito *= 2;
                if ($digito > 9) {
                    $digito -= 9;
                }
            }
            $suma += $digito;
            $alternar = !$alternar;
        }
        return $suma % 10 === 0;
    }

    // Acepta MM/AA o MM/AAAA y devuelve MM/AAAA solo si está vigente
    private function normalizarVencimiento($valor)
    {
        if (!preg_match('/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/', trim($valor), $m)) {
            return null;
        }
        $mes = intval($m[1]);
        $anio = intval($m[2]);
        if ($anio < 100) {
            $anio += 2000;
        }
        $finDeMes = mktime(23, 59, 59, $mes + 1, 0, $anio);
        if ($finDeMes < time()) {
            return null;
        }
        return sprintf('%02d/%04d', $mes, $anio);
    }
}
