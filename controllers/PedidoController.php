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
            'restaurante' => $this->ubicacionRestaurante(),
            'distanciaMaximaKm' => $this->model->getDistanciaMaximaEnvio(),
        ]);
    }

    /**
     * POST /PedidoController/cotizarEnvio — recibe el punto marcado en el mapa
     * y devuelve la distancia, la tarifa aplicable y el costo del envío.
     * El cálculo vive en el servidor para que el precio no se pueda manipular.
     */
    public function cotizarEnvio()
    {
        Auth::requerir(self::ROLES_COMPRA);
        $data = $this->request->getJSON();
        $latitud = isset($data->latitud) ? floatval($data->latitud) : null;
        $longitud = isset($data->longitud) ? floatval($data->longitud) : null;

        if ($latitud === null || $longitud === null || !$this->coordenadaValida($latitud, $longitud)) {
            $this->response->status(422)->toJSON(null, 'Debe marcar un punto válido en el mapa');
            return;
        }

        $cotizacion = $this->cotizar($latitud, $longitud);
        if ($cotizacion === null) {
            $this->response->status(409)->toJSON([
                'distancia_km' => $this->distanciaKm($latitud, $longitud),
                'distancia_maxima_km' => $this->model->getDistanciaMaximaEnvio(),
            ], 'La dirección está fuera del área de cobertura del servicio a domicilio');
            return;
        }

        $this->response->status(200)->toJSON($cotizacion);
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
        if (!is_iterable($items)) {
            $items = [];
        }
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
            $direccion = trim($data->direccion ?? '');
            $latitud   = isset($data->latitud) ? floatval($data->latitud) : null;
            $longitud  = isset($data->longitud) ? floatval($data->longitud) : null;

            if ($latitud === null || $longitud === null || !$this->coordenadaValida($latitud, $longitud)) {
                $this->response->status(422)->toJSON(null, 'Debe marcar la dirección de entrega en el mapa');
                return;
            }
            if (mb_strlen($direccion) < 10) {
                $this->response->status(422)->toJSON(null, 'Debe indicar la dirección de entrega (mínimo 10 caracteres)');
                return;
            }

            // El costo del envío se recalcula aquí, nunca se toma del navegador
            $cotizacion = $this->cotizar($latitud, $longitud);
            if ($cotizacion === null) {
                $this->response->status(422)->toJSON(
                    null,
                    'La dirección está fuera del área de cobertura del servicio a domicilio'
                );
                return;
            }

            $costoEnvio = $cotizacion['costo_envio'];
            $clienteEnvio = $this->usuarioModel->getById($idCliente);
            $envio = [
                'id_tarifa' => $cotizacion['id_tarifa'],
                'direccion' => $direccion,
                'latitud' => $latitud,
                'longitud' => $longitud,
                'distancia_km' => $cotizacion['distancia_km'],
                'duracion_estimada_min' => $cotizacion['duracion_min'],
                'referencia' => $data->referencia ?? null,
                'nombre_receptor' => trim($clienteEnvio->nombre . ' ' . $clienteEnvio->apellido),
                'telefono_receptor' => $clienteEnvio->telefono,
            ];
        }

        $lineas = [];
        $netoTotal = 0.0;     
        $descuentoTotal = 0.0;
        $impuestoTotal = 0.0;
        foreach ($items as $item) {
            $precioUnitario = floatval($item->precio_unitario);
            $cantidad = intval($item->cantidad);
            $precioTotal = round($precioUnitario * $cantidad, 2);
            $descuento = $this->descuentoDeLinea($item, $cupones, $precioTotal);
            $netoLinea = round($precioTotal - $descuento, 2);
            $impuestoLinea = PedidoModel::impuestoIncluido($netoLinea);

            $netoTotal += $netoLinea;
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
        // Base gravable: lo cobrado menos el IVA que ya venía incluido
        $subtotal = round($netoTotal - $impuestoTotal, 2);
        $total = round($netoTotal + $costoEnvio, 2);

        // --- Pago simulado (tarjetas o efectivo) ---
        $metodos = $this->model->getMetodosPago();
        if (!is_array($metodos) && !($metodos instanceof \Traversable)) {
            $metodos = [];
        }

        $idMetodo = intval($data->id_metodo ?? 0);
        $metodo = null;
        foreach ($metodos as $m) {
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
            array_map(fn($c) => $c->id_cupon, (array)$cupones),
            $pago,
            $envio
        );

        if (!$idPedido) {
            $this->response->status(500)->toJSON(null, 'No se pudo registrar el pedido');
            return;
        }

        $this->carritoModel->vaciar($usuario->id_usuario);

        // Al confirmar el pedido se le manda la factura al cliente. Si el
        // correo falla, el pedido igual queda registrado: solo se avisa en
        // la respuesta para que la pantalla lo informe.
        $factura = $this->enviarFactura($idPedido);

        $this->response->status(201)->toJSON([
            'id_pedido' => $idPedido,
            'vuelto' => $pago['vuelto'],
            'factura_enviada' => $factura['ok'],
            'factura_correo' => $factura['correo'],
        ], 'Pedido registrado correctamente');
    }

    /**
     * Manda la factura del pedido recién confirmado. Cualquier problema con
     * el correo se reporta, pero nunca tumba el registro del pedido.
     */
    private function enviarFactura($idPedido)
    {
        try {
            $pedido = $this->model->getDetalle($idPedido);
            if (!$pedido) {
                return ['ok' => false, 'correo' => null];
            }
            $resultado = Correo::enviarFactura($pedido);
            return ['ok' => $resultado['ok'], 'correo' => $resultado['correo']];
        } catch (\Throwable $e) {
            return ['ok' => false, 'correo' => null];
        }
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
        if (intval($pedido->id_estado) !== PedidoModel::ESTADO_REGISTRADO) {
            $this->response->status(409)->toJSON(null, 'Solo se pueden aceptar pedidos en estado Registrado');
            return;
        }

        $this->model->aceptar($idPedido, $usuario->id_usuario);
        $this->response->status(200)->toJSON($this->model->getDetalle($idPedido), 'Pedido aceptado y enviado a cocina');
    }

    // POST /PedidoController/despachar — el pedido a domicilio sale del local
    public function despachar()
    {
        $usuario = Auth::requerir(self::ROLES_GESTION);
        $data = $this->request->getJSON();
        $idPedido = intval($data->id_pedido ?? 0);
        $repartidor = trim($data->repartidor ?? '');

        $pedido = $this->model->getBasico($idPedido);
        if (!$pedido) {
            $this->response->status(404)->toJSON(null, 'Pedido no encontrado');
            return;
        }
        if ($pedido->tipo_entrega !== 'domicilio') {
            $this->response->status(409)->toJSON(null, 'Solo los pedidos a domicilio se despachan');
            return;
        }
        if (intval($pedido->id_estado) !== PedidoModel::ESTADO_LISTO) {
            $this->response->status(409)->toJSON(null, 'Solo se pueden despachar pedidos que estén Listos');
            return;
        }
        if (mb_strlen($repartidor) < 3) {
            $this->response->status(422)->toJSON(null, 'Indique el nombre del repartidor asignado');
            return;
        }

        $this->model->despachar($idPedido, $usuario->id_usuario, $repartidor);
        $this->response->status(200)->toJSON(
            $this->model->getDetalle($idPedido),
            'Pedido despachado, el cliente ya puede seguirlo en el mapa'
        );
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

        // Recogida: se entrega desde Listo. Domicilio: primero debe ir En camino.
        $estado = intval($pedido->id_estado);
        $esDomicilio = $pedido->tipo_entrega === 'domicilio';
        $estadoEsperado = $esDomicilio
            ? PedidoModel::ESTADO_EN_CAMINO
            : PedidoModel::ESTADO_LISTO;

        if ($estado !== $estadoEsperado) {
            $this->response->status(409)->toJSON(
                null,
                $esDomicilio
                    ? 'El pedido debe estar En camino antes de marcarlo como entregado'
                    : 'Solo se pueden entregar pedidos que estén Listos'
            );
            return;
        }

        $this->model->cambiarEstado(
            $idPedido,
            PedidoModel::ESTADO_ENTREGADO,
            $usuario->id_usuario,
            $esDomicilio ? 'Pedido entregado en la dirección del cliente' : 'Pedido entregado al cliente'
        );
        if ($esDomicilio) {
            $this->model->registrarEntregaEnvio($idPedido);
        }

        $this->response->status(200)->toJSON($this->model->getDetalle($idPedido), 'Pedido marcado como entregado');
    }

    // ------------------------------------------------------------------

    // Descuento de una línea según los cupones aplicados (uno por artículo):
    // porcentaje sobre el total de la línea o monto fijo (una vez por línea).
    // ---------------- Envío a domicilio ----------------

    // Ubicación del local, punto de partida de todos los envíos
    private function ubicacionRestaurante()
    {
        return [
            'nombre' => Config::get('RESTAURANTE_NOMBRE', 'CornApp'),
            'latitud' => floatval(Config::get('RESTAURANTE_LAT', 0)),
            'longitud' => floatval(Config::get('RESTAURANTE_LNG', 0)),
        ];
    }

    private function coordenadaValida($latitud, $longitud)
    {
        return $latitud >= -90 && $latitud <= 90
            && $longitud >= -180 && $longitud <= 180
            && !($latitud == 0 && $longitud == 0);
    }

    /**
     * Distancia en kilómetros entre el local y un punto, con la fórmula de
     * Haversine. No depende de ningún servicio externo.
     */
    private function distanciaKm($latitud, $longitud)
    {
        $radioTierra = 6371; // km
        $local = $this->ubicacionRestaurante();

        $dLat = deg2rad($latitud - $local['latitud']);
        $dLng = deg2rad($longitud - $local['longitud']);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($local['latitud'])) * cos(deg2rad($latitud))
            * sin($dLng / 2) * sin($dLng / 2);

        return round($radioTierra * 2 * atan2(sqrt($a), sqrt(1 - $a)), 2);
    }

    /**
     * Cotiza un envío: distancia, tarifa aplicable, costo y duración estimada.
     * Devuelve null si el punto queda fuera del alcance de todas las tarifas.
     */
    private function cotizar($latitud, $longitud)
    {
        $distancia = $this->distanciaKm($latitud, $longitud);
        $tarifa = $this->model->getTarifaPorDistancia($distancia);
        if (!$tarifa) {
            return null;
        }

        $costo = floatval($tarifa->tarifa_base) + floatval($tarifa->precio_por_km) * $distancia;
        $velocidad = floatval(Config::get('VELOCIDAD_REPARTO_KMH', 25));
        $duracion = $velocidad > 0 ? (int) ceil($distancia / $velocidad * 60) : 0;

        return [
            'id_tarifa' => intval($tarifa->id_tarifa),
            'tarifa' => $tarifa->nombre,
            'distancia_km' => $distancia,
            'costo_envio' => round($costo, 2),
            'duracion_min' => max(5, $duracion),
        ];
    }

    // ---------------- Cálculos del pedido ----------------

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
