<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

/**
 * Envío de correo con PHPMailer sobre el SMTP de Gmail.
 *
 * Los datos de la cuenta salen de la configuración; la contraseña vive en
 * config.local.php, que no se sube al repositorio.
 */
class Correo
{
    /**
     * Envía un correo con un archivo adjunto opcional.
     *
     * @param string $para       Dirección del destinatario
     * @param string $nombrePara Nombre del destinatario
     * @param string $asunto     Asunto del mensaje
     * @param string $cuerpoHtml Contenido en HTML
     * @param array  $adjunto    ['contenido' => bytes, 'nombre' => 'archivo.pdf']
     * @return array ['ok' => bool, 'mensaje' => string]
     */
    public static function enviar($para, $nombrePara, $asunto, $cuerpoHtml, $adjunto = null)
    {
        $usuario = Config::get('CORREO_USUARIO');
        $clave = Config::get('CORREO_CLAVE');

        if (empty($usuario) || empty($clave)) {
            return [
                'ok' => false,
                'mensaje' => 'El servicio de correo no está configurado. '
                    . 'Defina CORREO_USUARIO y CORREO_CLAVE en config.local.php.',
            ];
        }

        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = Config::get('CORREO_HOST', 'smtp.gmail.com');
            $mail->SMTPAuth = true;
            $mail->Username = $usuario;
            $mail->Password = $clave;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = intval(Config::get('CORREO_PUERTO', 587));
            $mail->CharSet = PHPMailer::CHARSET_UTF8;
            // Tope corto: el envío ocurre dentro del registro del pedido y no
            // debe dejar esperando al cliente si el servidor no responde
            $mail->Timeout = 12;

            $mail->setFrom($usuario, Config::get('CORREO_REMITENTE', 'CornApp'));
            $mail->addAddress($para, $nombrePara);

            if ($adjunto && !empty($adjunto['contenido'])) {
                $mail->addStringAttachment(
                    $adjunto['contenido'],
                    $adjunto['nombre'],
                    PHPMailer::ENCODING_BASE64,
                    'application/pdf'
                );
            }

            $mail->isHTML(true);
            $mail->Subject = $asunto;
            $mail->Body = $cuerpoHtml;
            // Versión en texto plano para los clientes que no muestran HTML
            $mail->AltBody = trim(strip_tags(str_replace(['<br>', '</p>'], "\n", $cuerpoHtml)));

            $mail->send();
            return ['ok' => true, 'mensaje' => 'Correo enviado'];
        } catch (PHPMailerException $e) {
            // ErrorInfo trae el detalle del SMTP, más claro que el de la excepción
            return [
                'ok' => false,
                'mensaje' => 'No se pudo enviar el correo: ' . ($mail->ErrorInfo ?: $e->getMessage()),
            ];
        }
    }

    /**
     * Envía la factura del pedido al correo de la cuenta del cliente, con
     * el PDF adjunto. Se usa al confirmar el pedido, de forma automática.
     */
    public static function enviarFactura($pedido)
    {
        $destino = trim((string) $pedido->correo_cliente);
        if (!filter_var($destino, FILTER_VALIDATE_EMAIL)) {
            return [
                'ok' => false,
                'correo' => $destino,
                'mensaje' => 'La cuenta del cliente no tiene un correo válido registrado',
            ];
        }

        $resultado = self::enviar(
            $destino,
            trim($pedido->nombre_cliente . ' ' . $pedido->apellido_cliente),
            'Factura de su pedido ' . $pedido->numero_pedido . ' — CornApp',
            self::cuerpoFactura($pedido),
            [
                'contenido' => FacturaPDF::generar($pedido),
                'nombre' => FacturaPDF::nombreArchivo($pedido),
            ]
        );
        $resultado['correo'] = $destino;
        return $resultado;
    }

    // Mensaje del correo; el detalle completo va en el PDF adjunto
    private static function cuerpoFactura($pedido)
    {
        $nombre = htmlspecialchars($pedido->nombre_cliente, ENT_QUOTES, 'UTF-8');
        $numero = htmlspecialchars($pedido->numero_pedido, ENT_QUOTES, 'UTF-8');
        $total = '₡' . number_format(floatval($pedido->monto_total), 2, ',', '.');
        $entrega = $pedido->tipo_entrega === 'domicilio'
            ? 'entrega a domicilio'
            : 'retiro en el local';

        return <<<HTML
<div style="font-family: Arial, Helvetica, sans-serif; color: #211206; font-size: 15px;
            line-height: 1.6; max-width: 520px;">
  <h2 style="color: #C2410C; margin-bottom: 4px;">¡Gracias por su compra, {$nombre}!</h2>
  <p>Su pedido <strong>{$numero}</strong> quedó confirmado, con la modalidad de
     {$entrega}. Adjuntamos la factura en PDF.</p>
  <p style="background: #FFF1E7; border-left: 4px solid #FF8E42; padding: 10px 14px;">
     Total facturado: <strong>{$total}</strong>
  </p>
  <p>Los precios ya incluyen el impuesto de ventas; en la factura lo encontrará
     desglosado.</p>
  <p style="color: #8A6A55; font-size: 13px; margin-top: 24px;">
     CornApp · Auténticos corn dogs coreanos<br>
     Alajuela, Costa Rica · Proyecto DEVSHARKS · ISW613
  </p>
</div>
HTML;
    }
}
