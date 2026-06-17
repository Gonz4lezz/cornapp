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
                       (SELECT COUNT(*) FROM menu_producto mp WHERE mp.id_menu = m.id_menu)
                        + (SELECT COUNT(*) FROM menu_combo mc WHERE mc.id_menu = m.id_menu) AS total_items
                FROM menu m
                ORDER BY m.creado_en DESC";
        return $this->db->executeSQL($sql);
    }

    public function getById($id)
    {
        $id = intval($id);
        $sql = "SELECT m.id_menu, m.nombre, m.descripcion, m.esta_activo, m.creado_en, m.editado_en
                FROM menu m
                WHERE m.id_menu = $id";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    public function getHorarios($id)
    {
        $id = intval($id);
        $sql = "SELECT id_horario, dia_semana, hora_inicio, hora_fin, fecha_inicio, fecha_fin, esta_activo
                FROM horario_menu
                WHERE id_menu = $id
                ORDER BY dia_semana ASC, hora_inicio ASC";
        return $this->db->executeSQL($sql);
    }

    public function getDisponible()
    {
        $sql = "SELECT DISTINCT m.id_menu, m.nombre, m.descripcion, m.esta_activo
                FROM menu m
                INNER JOIN horario_menu hm ON m.id_menu = hm.id_menu
                WHERE m.esta_activo = 1 AND hm.esta_activo = 1
                  AND (
                    (hm.dia_semana IS NOT NULL AND hm.dia_semana = DAYOFWEEK(CURDATE()) - 1
                     AND CURTIME() BETWEEN hm.hora_inicio AND hm.hora_fin)
                    OR
                    (hm.fecha_inicio IS NOT NULL AND hm.fecha_fin IS NOT NULL
                     AND CURDATE() BETWEEN hm.fecha_inicio AND hm.fecha_fin
                     AND CURTIME() BETWEEN hm.hora_inicio AND hm.hora_fin)
                  )
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
}
