<?php

class CuponModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    // Cupones vigentes (activos y dentro del rango de fechas), con la info
    // del producto o combo al que aplican, para el slider y el listado.
    public function getDisponibles()
    {
        $sql = "SELECT c.id_cupon, c.codigo, c.nombre, c.descripcion,
                       c.tipo_descuento, c.valor_descuento,
                       c.id_producto, c.id_combo, c.fecha_inicio, c.fecha_fin,
                       p.nombre AS nombre_producto, p.precio_base AS precio_producto,
                       co.nombre AS nombre_combo, co.precio_combo AS precio_combo,
                       CASE
                           WHEN c.id_producto IS NOT NULL THEN (SELECT ip.url_imagen FROM imagen_producto ip
                               WHERE ip.id_producto = c.id_producto AND ip.es_principal = 1 LIMIT 1)
                           ELSE (SELECT ic.url_imagen FROM imagen_combo ic
                               WHERE ic.id_combo = c.id_combo AND ic.es_principal = 1 LIMIT 1)
                       END AS imagen
                FROM cupon c
                LEFT JOIN producto p ON c.id_producto = p.id_producto
                LEFT JOIN combo    co ON c.id_combo    = co.id_combo
                WHERE c.esta_activo = 1
                  AND NOW() BETWEEN c.fecha_inicio AND c.fecha_fin
                ORDER BY c.fecha_fin ASC, c.nombre ASC";
        return $this->db->executeSQL($sql);
    }

    // Todos los cupones (activos e inactivos) para el mantenimiento.
    public function getAllMantenimiento()
    {
        $sql = "SELECT c.id_cupon, c.codigo, c.nombre, c.tipo_descuento, c.valor_descuento,
                       c.id_producto, c.id_combo, c.fecha_inicio, c.fecha_fin, c.esta_activo,
                       p.nombre AS nombre_producto, co.nombre AS nombre_combo
                FROM cupon c
                LEFT JOIN producto p ON c.id_producto = p.id_producto
                LEFT JOIN combo    co ON c.id_combo    = co.id_combo
                ORDER BY c.esta_activo DESC, c.fecha_fin DESC, c.nombre ASC";
        return $this->db->executeSQL($sql);
    }

    public function getById($id)
    {
        $id = intval($id);
        $sql = "SELECT c.id_cupon, c.codigo, c.nombre, c.descripcion,
                       c.tipo_descuento, c.valor_descuento,
                       c.id_producto, c.id_combo, c.fecha_inicio, c.fecha_fin, c.esta_activo,
                       p.nombre AS nombre_producto, p.precio_base AS precio_producto,
                       co.nombre AS nombre_combo, co.precio_combo AS precio_combo
                FROM cupon c
                LEFT JOIN producto p ON c.id_producto = p.id_producto
                LEFT JOIN combo    co ON c.id_combo    = co.id_combo
                WHERE c.id_cupon = $id";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    // Cupón vigente para un producto específico (o null). Sirve para el
    // banner de descuento en el detalle del producto.
    public function getPorProducto($idProducto)
    {
        $idProducto = intval($idProducto);
        $sql = "SELECT id_cupon, codigo, nombre, descripcion, tipo_descuento, valor_descuento,
                       fecha_inicio, fecha_fin
                FROM cupon
                WHERE id_producto = $idProducto AND esta_activo = 1
                  AND NOW() BETWEEN fecha_inicio AND fecha_fin
                ORDER BY valor_descuento DESC
                LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    // Cupón vigente para un combo específico (o null).
    public function getPorCombo($idCombo)
    {
        $idCombo = intval($idCombo);
        $sql = "SELECT id_cupon, codigo, nombre, descripcion, tipo_descuento, valor_descuento,
                       fecha_inicio, fecha_fin
                FROM cupon
                WHERE id_combo = $idCombo AND esta_activo = 1
                  AND NOW() BETWEEN fecha_inicio AND fecha_fin
                ORDER BY valor_descuento DESC
                LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    public function existeCodigo($codigo, $idExcluir = null)
    {
        $codigo = $this->db_escape($codigo);
        $sql = "SELECT id_cupon FROM cupon WHERE codigo = '$codigo'";
        if ($idExcluir !== null) {
            $idExcluir = intval($idExcluir);
            $sql .= " AND id_cupon <> $idExcluir";
        }
        $sql .= " LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return is_array($result) && count($result) > 0;
    }

    public function create($data)
    {
        $campos = $this->prepararCampos($data);
        $sql = "INSERT INTO cupon (codigo, nombre, descripcion, tipo_descuento, valor_descuento,
                                   id_producto, id_combo, fecha_inicio, fecha_fin, esta_activo)
                VALUES ('{$campos['codigo']}', '{$campos['nombre']}', '{$campos['descripcion']}',
                        '{$campos['tipo']}', {$campos['valor']}, {$campos['idProducto']}, {$campos['idCombo']},
                        '{$campos['fInicio']}', '{$campos['fFin']}', {$campos['activo']})";
        return $this->db->executeSQL_DML_last($sql);
    }

    public function update($id, $data)
    {
        $id = intval($id);
        $campos = $this->prepararCampos($data);
        $sql = "UPDATE cupon
                SET codigo = '{$campos['codigo']}',
                    nombre = '{$campos['nombre']}',
                    descripcion = '{$campos['descripcion']}',
                    tipo_descuento = '{$campos['tipo']}',
                    valor_descuento = {$campos['valor']},
                    id_producto = {$campos['idProducto']},
                    id_combo = {$campos['idCombo']},
                    fecha_inicio = '{$campos['fInicio']}',
                    fecha_fin = '{$campos['fFin']}',
                    esta_activo = {$campos['activo']}
                WHERE id_cupon = $id";
        $this->db->executeSQL_DML($sql);
        return true;
    }

    // Normaliza los campos del cupón para crear/actualizar. Las fechas se
    // guardan como DATETIME (inicio a las 00:00:00 y fin a las 23:59:59).
    private function prepararCampos($data)
    {
        return [
            'codigo'      => strtoupper($this->db_escape($data['codigo'])),
            'nombre'      => $this->db_escape($data['nombre']),
            'descripcion' => $this->db_escape($data['descripcion'] ?? ''),
            'tipo'        => $this->db_escape($data['tipo_descuento']),
            'valor'       => floatval($data['valor_descuento']),
            'idProducto'  => !empty($data['id_producto']) ? intval($data['id_producto']) : 'NULL',
            'idCombo'     => !empty($data['id_combo']) ? intval($data['id_combo']) : 'NULL',
            'fInicio'     => $this->db_escape($data['fecha_inicio']) . ' 00:00:00',
            'fFin'        => $this->db_escape($data['fecha_fin']) . ' 23:59:59',
            'activo'      => (isset($data['esta_activo']) && !$data['esta_activo']) ? 0 : 1,
        ];
    }

    private function db_escape($value)
    {
        if ($value === null) return '';
        return str_replace(["\\", "'"], ["\\\\", "\\'"], (string)$value);
    }
}
