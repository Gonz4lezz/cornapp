<?php

class MenuModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    public function getAll()
    {
        $sql = "SELECT m.id_menu, m.nombre, m.descripcion, m.esta_activo, m.creado_en,
                       m.fecha_inicio, m.fecha_fin, m.hora_inicio, m.hora_fin,
                       (SELECT COUNT(*) FROM menu_producto mp WHERE mp.id_menu = m.id_menu)
                        + (SELECT COUNT(*) FROM menu_combo mc WHERE mc.id_menu = m.id_menu) AS total_items
                FROM menu m
                ORDER BY m.fecha_inicio DESC, m.creado_en DESC";
        return $this->db->executeSQL($sql);
    }

    public function getById($id)
    {
        $id = intval($id);
        $sql = "SELECT m.id_menu, m.nombre, m.descripcion, m.esta_activo, m.creado_en, m.editado_en,
                       m.fecha_inicio, m.fecha_fin, m.hora_inicio, m.hora_fin
                FROM menu m
                WHERE m.id_menu = $id";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    public function getDisponible()
    {
        $sql = "SELECT m.id_menu, m.nombre, m.descripcion, m.esta_activo,
                       m.fecha_inicio, m.fecha_fin, m.hora_inicio, m.hora_fin
                FROM menu m
                WHERE m.esta_activo = 1
                  AND m.fecha_inicio IS NOT NULL AND m.fecha_fin IS NOT NULL
                  AND m.hora_inicio IS NOT NULL AND m.hora_fin IS NOT NULL
                  AND CURDATE() BETWEEN m.fecha_inicio AND m.fecha_fin
                  AND CURTIME() BETWEEN m.hora_inicio AND m.hora_fin
                ORDER BY DATEDIFF(m.fecha_fin, m.fecha_inicio) ASC, m.creado_en DESC
                LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    public function getProductosPorMenu($id)
    {
        $id = intval($id);
        $sql = "SELECT p.id_producto, p.nombre, p.descripcion, p.precio_base,
                       c.nombre AS categoria, c.id_categoria, c.orden_display AS categoria_orden,
                       mp.orden_display,
                       (SELECT ip.url_imagen FROM imagen_producto ip
                        WHERE ip.id_producto = p.id_producto AND ip.es_principal = 1 LIMIT 1) AS imagen
                FROM producto p
                INNER JOIN menu_producto mp ON p.id_producto = mp.id_producto
                INNER JOIN categoria c ON p.id_categoria = c.id_categoria
                WHERE mp.id_menu = $id AND p.esta_activo = 1
                ORDER BY c.orden_display ASC, mp.orden_display ASC";
        return $this->db->executeSQL($sql);
    }

    public function getCombosPorMenu($id)
    {
        $id = intval($id);
        $sql = "SELECT co.id_combo, co.nombre, co.descripcion, co.precio_combo,
                       cat.nombre AS categoria, cat.id_categoria, cat.orden_display AS categoria_orden,
                       mc.orden_display,
                       (SELECT ic.url_imagen FROM imagen_combo ic
                        WHERE ic.id_combo = co.id_combo AND ic.es_principal = 1 LIMIT 1) AS imagen
                FROM combo co
                INNER JOIN menu_combo mc ON co.id_combo = mc.id_combo
                INNER JOIN categoria cat ON co.id_categoria = cat.id_categoria
                WHERE mc.id_menu = $id AND co.esta_activo = 1
                ORDER BY cat.orden_display ASC, mc.orden_display ASC";
        return $this->db->executeSQL($sql);
    }

    public function existeNombre($nombre, $idExcluir = null)
    {
        $nombre = $this->db_escape($nombre);
        $sql = "SELECT id_menu FROM menu WHERE nombre = '$nombre'";
        if ($idExcluir !== null) {
            $idExcluir = intval($idExcluir);
            $sql .= " AND id_menu <> $idExcluir";
        }
        $sql .= " LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return is_array($result) && count($result) > 0;
    }

    public function create($data)
    {
        $nombre = $this->db_escape($data['nombre']);
        $descripcion = $this->db_escape($data['descripcion'] ?? '');
        $fInicio = $this->db_escape($data['fecha_inicio']);
        $fFin = $this->db_escape($data['fecha_fin']);
        $hInicio = $this->db_escape($data['hora_inicio']);
        $hFin = $this->db_escape($data['hora_fin']);

        $sql = "INSERT INTO menu (nombre, descripcion, fecha_inicio, fecha_fin, hora_inicio, hora_fin, esta_activo)
                VALUES ('$nombre', '$descripcion', '$fInicio', '$fFin', '$hInicio', '$hFin', 1)";
        $idMenu = $this->db->executeSQL_DML_last($sql);

        if ($idMenu) {
            if (!empty($data['productos'])) $this->setProductos($idMenu, $data['productos']);
            if (!empty($data['combos'])) $this->setCombos($idMenu, $data['combos']);
        }
        return $idMenu;
    }

    public function update($id, $data)
    {
        $id = intval($id);
        $nombre = $this->db_escape($data['nombre']);
        $descripcion = $this->db_escape($data['descripcion'] ?? '');
        $fInicio = $this->db_escape($data['fecha_inicio']);
        $fFin = $this->db_escape($data['fecha_fin']);
        $hInicio = $this->db_escape($data['hora_inicio']);
        $hFin = $this->db_escape($data['hora_fin']);

        $sql = "UPDATE menu
                SET nombre = '$nombre',
                    descripcion = '$descripcion',
                    fecha_inicio = '$fInicio',
                    fecha_fin = '$fFin',
                    hora_inicio = '$hInicio',
                    hora_fin = '$hFin'
                WHERE id_menu = $id";
        $this->db->executeSQL_DML($sql);

        if (isset($data['productos'])) $this->setProductos($id, $data['productos']);
        if (isset($data['combos'])) $this->setCombos($id, $data['combos']);
        return true;
    }

    private function setProductos($idMenu, $productos)
    {
        $idMenu = intval($idMenu);
        $this->db->executeSQL_DML("DELETE FROM menu_producto WHERE id_menu = $idMenu");
        if (empty($productos)) return;

        $values = [];
        $orden = 1;
        foreach ($productos as $item) {
            $idProd = is_array($item) || is_object($item) ? intval(((array)$item)['id_producto'] ?? 0) : intval($item);
            if ($idProd > 0) {
                $values[] = "($idMenu, $idProd, $orden)";
                $orden++;
            }
        }
        if (!empty($values)) {
            $this->db->executeSQL_DML("INSERT INTO menu_producto (id_menu, id_producto, orden_display) VALUES " . implode(',', $values));
        }
    }

    private function setCombos($idMenu, $combos)
    {
        $idMenu = intval($idMenu);
        $this->db->executeSQL_DML("DELETE FROM menu_combo WHERE id_menu = $idMenu");
        if (empty($combos)) return;

        $values = [];
        $orden = 1;
        foreach ($combos as $item) {
            $idCombo = is_array($item) || is_object($item) ? intval(((array)$item)['id_combo'] ?? 0) : intval($item);
            if ($idCombo > 0) {
                $values[] = "($idMenu, $idCombo, $orden)";
                $orden++;
            }
        }
        if (!empty($values)) {
            $this->db->executeSQL_DML("INSERT INTO menu_combo (id_menu, id_combo, orden_display) VALUES " . implode(',', $values));
        }
    }

    private function db_escape($value)
    {
        if ($value === null) return '';
        return str_replace(["\\", "'"], ["\\\\", "\\'"], (string)$value);
    }
}
