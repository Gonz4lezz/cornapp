<?php

use Dompdf\Dompdf;
use Dompdf\Options;

/**
 * Genera la factura del pedido en PDF con Dompdf, a partir del mismo
 * detalle que muestra la pantalla del pedido.
 *
 * El documento se arma como HTML y Dompdf lo convierte, así que la factura
 * impresa queda igual a la que ve el cliente en pantalla.
 */
class FacturaPDF
{
    // Nombre del archivo: FACTURA-PED-2026-0001.pdf
    public static function nombreArchivo($pedido)
    {
        return 'FACTURA-' . $pedido->numero_pedido . '.pdf';
    }

    // Devuelve el PDF ya generado como cadena de bytes
    public static function generar($pedido)
    {
        $opciones = new Options();
        $opciones->set('defaultFont', 'DejaVu Sans');
        $opciones->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($opciones);
        $dompdf->loadHtml(self::html($pedido), 'UTF-8');
        $dompdf->setPaper('letter', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }

    private static function moneda($valor)
    {
        return '₡' . number_format(floatval($valor), 2, ',', '.');
    }

    private static function fecha($valor)
    {
        if (!$valor) {
            return '';
        }
        $tiempo = strtotime($valor);
        return $tiempo ? date('d/m/Y h:i a', $tiempo) : $valor;
    }

    private static function texto($valor)
    {
        return htmlspecialchars((string) $valor, ENT_QUOTES, 'UTF-8');
    }

    private static function html($pedido)
    {
        $tasa = round(floatval($pedido->tasa_impuesto) * 100);
        $restaurante = self::texto(Config::get('RESTAURANTE_NOMBRE', 'CornApp'));

        $numero = self::texto($pedido->numero_pedido);
        $estado = self::texto($pedido->nombre_estado);
        $emitida = self::texto(self::fecha($pedido->creado_en));
        $cliente = self::texto($pedido->nombre_cliente . ' ' . $pedido->apellido_cliente);
        $correo = self::texto($pedido->correo_cliente);
        $telefono = self::texto($pedido->telefono_cliente ?: '—');
        $metodo = self::texto($pedido->metodo_pago ?: 'No registrado');
        $entrega = $pedido->tipo_entrega === 'domicilio'
            ? 'Entrega a domicilio'
            : 'Retiro en el local';

        $subtotal = self::moneda($pedido->subtotal);
        $iva = self::moneda($pedido->monto_impuesto);
        $total = self::moneda($pedido->monto_total);

        // ---------- Líneas del pedido ----------
        $filas = '';
        foreach ($pedido->detalles as $linea) {
            $observaciones = trim((string) $linea->observaciones) !== ''
                ? '<div class="obs">' . self::texto($linea->observaciones) . '</div>'
                : '';
            $descuento = floatval($linea->monto_descuento) > 0
                ? '- ' . self::moneda($linea->monto_descuento)
                : '—';
            $totalLinea = self::moneda(
                floatval($linea->precio_total) - floatval($linea->monto_descuento)
            );

            $filas .= '<tr>'
                . '<td class="c">' . intval($linea->cantidad) . '</td>'
                . '<td>' . self::texto($linea->nombre) . $observaciones . '</td>'
                . '<td class="d">' . self::moneda($linea->precio_unitario) . '</td>'
                . '<td class="d">' . $descuento . '</td>'
                . '<td class="d">' . self::moneda($linea->monto_impuesto) . '</td>'
                . '<td class="d">' . $totalLinea . '</td>'
                . '</tr>';
        }

        // ---------- Datos de la entrega a domicilio ----------
        $bloqueEnvio = '';
        if ($pedido->envio) {
            $referencia = trim((string) $pedido->envio->referencia) !== ''
                ? '<div><span>Referencia:</span> ' . self::texto($pedido->envio->referencia) . '</div>'
                : '';
            $bloqueEnvio =
                '<div class="caja envio">'
                . '<h3>Entrega a domicilio</h3>'
                . '<div><span>Dirección:</span> ' . self::texto($pedido->envio->direccion_texto) . '</div>'
                . $referencia
                . '<div><span>Recibe:</span> ' . self::texto($pedido->envio->nombre_receptor)
                . ' · ' . self::texto($pedido->envio->telefono_receptor) . '</div>'
                . '<div><span>Distancia:</span> ' . self::texto($pedido->envio->distancia_km)
                . ' km desde el local</div>'
                . '</div>';
        }

        // ---------- Detalle del pago según el método ----------
        $detallePago = '';
        if ($pedido->ultimos_cuatro) {
            $detallePago = '<div><span>Tarjeta:</span> **** ' . self::texto($pedido->ultimos_cuatro)
                . ' · ' . self::texto($pedido->titular_tarjeta) . '</div>';
        } elseif ($pedido->efectivo_recibido !== null) {
            $detallePago = '<div><span>Recibido:</span> ' . self::moneda($pedido->efectivo_recibido)
                . ' &nbsp; <span>Vuelto:</span> ' . self::moneda($pedido->vuelto) . '</div>';
        }

        $cupones = '';
        if (!empty($pedido->cupones)) {
            $codigos = array_map(function ($cupon) {
                return self::texto($cupon->codigo);
            }, $pedido->cupones);
            $cupones = '<div><span>Cupones:</span> ' . implode(', ', $codigos) . '</div>';
        }

        // ---------- Totales ----------
        $filaDescuento = floatval($pedido->monto_descuento) > 0
            ? '<tr><td>Descuentos</td><td class="d">- ' . self::moneda($pedido->monto_descuento) . '</td></tr>'
            : '';
        $filaEnvio = floatval($pedido->costo_envio) > 0
            ? '<tr><td>Envío</td><td class="d">' . self::moneda($pedido->costo_envio) . '</td></tr>'
            : '';

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  @page { margin: 24mm 16mm; }
  body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #211206; }
  h1 { font-size: 20px; margin: 0; color: #C2410C; }
  h2 { font-size: 12px; margin: 0 0 3px; }
  h3 { font-size: 9px; margin: 0 0 5px; text-transform: uppercase;
       letter-spacing: 0.6px; color: #8A6A55; }
  .cabecera { width: 100%; border-bottom: 2px solid #FF8E42;
              padding-bottom: 4px; margin-bottom: 14px; }
  .cabecera td { vertical-align: top; }
  .lema { color: #8A6A55; font-size: 9px; }
  .numero { font-size: 14px; font-weight: bold; }
  .caja { border: 1px solid #E7DDD5; border-radius: 6px; padding: 9px 11px; }
  .caja div { margin-bottom: 2px; }
  .caja span { color: #8A6A55; }
  .envio { margin-bottom: 14px; }
  table.datos { width: 100%; border-collapse: separate; border-spacing: 8px 0;
                margin-bottom: 14px; }
  table.datos > tbody > tr > td { width: 50%; vertical-align: top; }
  table.lineas { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  table.lineas th { background: #211206; color: #fff; font-size: 9px; text-align: left;
                    padding: 6px 8px; text-transform: uppercase; letter-spacing: 0.4px; }
  table.lineas td { padding: 7px 8px; border-bottom: 1px solid #EFE7E1; }
  table.lineas .c { text-align: center; }
  table.lineas .d { text-align: right; }
  .obs { color: #8A6A55; font-size: 9px; font-style: italic; margin-top: 2px; }
  table.totales { width: 48%; border-collapse: collapse; margin-left: 52%; }
  table.totales td { padding: 5px 8px; border-bottom: 1px solid #EFE7E1; }
  table.totales td.d { text-align: right; }
  table.totales tr.total td { border-top: 2px solid #211206; border-bottom: none;
                              font-size: 13px; font-weight: bold; padding-top: 8px; }
  .nota { padding-top: 26px; color: #8A6A55; font-size: 9px;
          text-align: center; line-height: 1.6; }
</style></head>
<body>

<table class="cabecera"><tr>
  <td>
    <h1>CornApp</h1>
    <div class="lema">Auténticos corn dogs coreanos · {$restaurante}</div>
    <div class="lema">Alajuela, Costa Rica · cornapp@gmail.com</div>
  </td>
  <td style="text-align: right;">
    <h2>Factura electrónica</h2>
    <div class="numero">{$numero}</div>
    <div class="lema">Emitida el {$emitida}</div>
  </td>
</tr></table>

<table class="datos"><tr>
  <td>
    <div class="caja">
      <h3>Cliente</h3>
      <div>{$cliente}</div>
      <div><span>Correo:</span> {$correo}</div>
      <div><span>Teléfono:</span> {$telefono}</div>
    </div>
  </td>
  <td>
    <div class="caja">
      <h3>Pago y entrega</h3>
      <div><span>Modalidad:</span> {$entrega}</div>
      <div><span>Método:</span> {$metodo}</div>
      {$detallePago}
      {$cupones}
    </div>
  </td>
</tr></table>

{$bloqueEnvio}

<table class="lineas">
  <thead><tr>
    <th class="c">Cant.</th><th>Descripción</th><th class="d">Precio unit.</th>
    <th class="d">Descuento</th><th class="d">IVA incl.</th><th class="d">Total</th>
  </tr></thead>
  <tbody>{$filas}</tbody>
</table>

<table class="totales">
  <tr><td>Subtotal sin IVA</td><td class="d">{$subtotal}</td></tr>
  <tr><td>IVA ({$tasa}%)</td><td class="d">{$iva}</td></tr>
  {$filaDescuento}
  {$filaEnvio}
  <tr class="total"><td>Total</td><td class="d">{$total}</td></tr>
</table>

<div class="nota">
  Los precios del catálogo ya incluyen el impuesto de ventas del {$tasa}%, por eso
  el IVA aparece desglosado y no se suma al total.<br>
  Gracias por su compra · Proyecto DEVSHARKS · ISW613
</div>

</body></html>
HTML;
    }
}
