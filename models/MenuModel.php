<?php

class MenuModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    // Listado público: solo menús activos.
    public function getAll()
    {
        $sql = "SELECT m.id_menu, m.nombre, m.descripcion, m.esta_activo, m.creado_en,
                       m.tipo_disponibilidad, m.fecha_inicio, m.fecha_fin, m.hora_inicio, m.hora_fin,
                       (SELECT COUNT(*) FROM menu_producto mp WHERE mp.id_menu = m.id_menu)
                        + (SELECT COUNT(*) FROM menu_combo mc WHERE mc.id_menu = m.id_menu) AS total_items
                FROM menu m
                WHERE m.esta_activo = 1
                ORDER BY m.fecha_inicio DESC, m.creado_en DESC";
        $menus = $this->db->executeSQL($sql);
        return $this->adjuntarDias($menus);
    }

    // Listado de mantenimiento: todos los menús (activos e inactivos).
    public function getAllMantenimiento()
    {
        $sql = "SELECT m.id_menu, m.nombre, m.descripcion, m.esta_activo, m.creado_en,
                       m.tipo_disponibilidad, m.fecha_inicio, m.fecha_fin, m.hora_inicio, m.hora_fin,
                       (SELECT COUNT(*) FROM menu_producto mp WHERE mp.id_menu = m.id_menu)
                        + (SELECT COUNT(*) FROM menu_combo mc WHERE mc.id_menu = m.id_menu) AS total_items
                FROM menu m
                ORDER BY m.esta_activo DESC, m.creado_en DESC";
        $menus = $this->db->executeSQL($sql);
        return $this->adjuntarDias($menus);
    }

    public function getById($id)
    {
        $id = intval($id);
        $sql = "SELECT m.id_menu, m.nombre, m.descripcion, m.esta_activo, m.creado_en, m.editado_en,
                       m.tipo_disponibilidad, m.fecha_inicio, m.fecha_fin, m.hora_inicio, m.hora_fin
                FROM menu m
                WHERE m.id_menu = $id";
        $result = $this->db->executeSQL($sql);
        if (!is_array($result) || count($result) === 0) {
            return null;
        }
        $menu = $result[0];
        $menu->dias = $this->getDias($id);
        return $menu;
    }

    public function getDias($id)
    {
        $id = intval($id);
        $sql = "SELECT dia_semana FROM menu_dia WHERE id_menu = $id ORDER BY dia_semana ASC";
        $result = $this->db->executeSQL($sql);
        $dias = [];
        if (is_array($result)) {
            foreach ($result as $row) {
                $dias[] = intval($row->dia_semana);
            }
        }
        return $dias;
    }

    // Menú disponible ahora mismo (solo 1). Considera ambos tipos de
    // disponibilidad y prioriza el menú por fechas (evento especial) sobre
    // el recurrente por días; luego el rango más específico y el más reciente.
    public function getDisponible()
    {
        $sql = "SELECT m.id_menu, m.nombre, m.descripcion, m.esta_activo,
                       m.tipo_disponibilidad, m.fecha_inicio, m.fecha_fin, m.hora_inicio, m.hora_fin
                FROM menu m
                WHERE m.esta_activo = 1
                  AND m.hora_inicio IS NOT NULL AND m.hora_fin IS NOT NULL
                  AND CURTIME() BETWEEN m.hora_inicio AND m.hora_fin
                  AND (
                        (m.tipo_disponibilidad = 'fechas'
                            AND m.fecha_inicio IS NOT NULL AND m.fecha_fin IS NOT NULL
                            AND CURDATE() BETWEEN m.fecha_inicio AND m.fecha_fin)
                     OR (m.tipo_disponibilidad = 'dias'
                            AND EXISTS (SELECT 1 FROM menu_dia md
                                        WHERE md.id_menu = m.id_menu
                                          AND md.dia_semana = DAYOFWEEK(CURDATE()) - 1))
                      )
                ORDER BY (m.tipo_disponibilidad = 'fechas') DESC,
                         DATEDIFF(COALESCE(m.fecha_fin, '9999-12-31'), COALESCE(m.fecha_inicio, '1000-01-01')) ASC,
                         m.creado_en DESC
                LIMIT 1";
        $result = $this->db->executeSQL($sql);
        if (!is_array($result) || count($result) === 0) {
            return null;
        }
        $menu = $result[0];
        $menu->dias = $this->getDias($menu->id_menu);
        return $menu;
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
        $tipo = ($data['tipo_disponibilidad'] ?? 'fechas') === 'dias' ? 'dias' : 'fechas';
        $nombre = $this->db_escape($data['nombre']);
        $descripcion = $this->db_escape($data['descripcion'] ?? '');
        $hInicio = $this->db_escape($data['hora_inicio']);
        $hFin = $this->db_escape($data['hora_fin']);
        // Las fechas solo se guardan para el tipo 'fechas'
        $fInicio = $tipo === 'fechas' ? "'" . $this->db_escape($data['fecha_inicio']) . "'" : 'NULL';
        $fFin = $tipo === 'fechas' ? "'" . $this->db_escape($data['fecha_fin']) . "'" : 'NULL';

        $sql = "INSERT INTO menu (nombre, descripcion, tipo_disponibilidad, fecha_inicio, fecha_fin, hora_inicio, hora_fin, esta_activo)
                VALUES ('$nombre', '$descripcion', '$tipo', $fInicio, $fFin, '$hInicio', '$hFin', 1)";
        $idMenu = $this->db->executeSQL_DML_last($sql);

        if ($idMenu) {
            if ($tipo === 'dias') $this->setDias($idMenu, $data['dias'] ?? []);
            if (!empty($data['productos'])) $this->setProductos($idMenu, $data['productos']);
            if (!empty($data['combos'])) $this->setCombos($idMenu, $data['combos']);
        }
        return $idMenu;
    }

    public function update($id, $data)
    {
        $id = intval($id);
        $tipo = ($data['tipo_disponibilidad'] ?? 'fechas') === 'dias' ? 'dias' : 'fechas';
        $nombre = $this->db_escape($data['nombre']);
        $descripcion = $this->db_escape($data['descripcion'] ?? '');
        $hInicio = $this->db_escape($data['hora_inicio']);
        $hFin = $this->db_escape($data['hora_fin']);
        $fInicio = $tipo === 'fechas' ? "'" . $this->db_escape($data['fecha_inicio']) . "'" : 'NULL';
        $fFin = $tipo === 'fechas' ? "'" . $this->db_escape($data['fecha_fin']) . "'" : 'NULL';

        $sql = "UPDATE menu
                SET nombre = '$nombre',
                    descripcion = '$descripcion',
                    tipo_disponibilidad = '$tipo',
                    fecha_inicio = $fInicio,
                    fecha_fin = $fFin,
                    hora_inicio = '$hInicio',
                    hora_fin = '$hFin'
                WHERE id_menu = $id";
        $this->db->executeSQL_DML($sql);

        // Reemplaza los días: si es por fechas, se limpian.
        $this->setDias($id, $tipo === 'dias' ? ($data['dias'] ?? []) : []);
        if (isset($data['productos'])) $this->setProductos($id, $data['productos']);
        if (isset($data['combos'])) $this->setCombos($id, $data['combos']);
        return true;
    }

    // Menús por rango de fechas que ya vencieron (fecha_fin pasada) y siguen
    // activos. Los menús por días no vencen (son recurrentes).
    public function getVencidos()
    {
        $sql = "SELECT id_menu, nombre, fecha_fin
                FROM menu
                WHERE esta_activo = 1
                  AND tipo_disponibilidad = 'fechas'
                  AND fecha_fin IS NOT NULL
                  AND fecha_fin < CURDATE()
                ORDER BY fecha_fin ASC";
        $result = $this->db->executeSQL($sql);
        return is_array($result) ? $result : [];
    }

    // Tarea: desactiva (borrado lógico) los menús vencidos y devuelve la
    // lista de los que se desactivaron (para el log de la tarea programada).
    public function desactivarVencidos()
    {
        $vencidos = $this->getVencidos();
        foreach ($vencidos as $menu) {
            $this->setActivo($menu->id_menu, false);
        }
        return $vencidos;
    }

    public function setActivo($id, $activo)
    {
        $id = intval($id);
        $activo = $activo ? 1 : 0;
        $sql = "UPDATE menu SET esta_activo = $activo WHERE id_menu = $id";
        return $this->db->executeSQL_DML($sql);
    }

    private function setDias($idMenu, $dias)
    {
        $idMenu = intval($idMenu);
        $this->db->executeSQL_DML("DELETE FROM menu_dia WHERE id_menu = $idMenu");
        if (empty($dias) || !is_array($dias)) return;

        $values = [];
        $vistos = [];
        foreach ($dias as $d) {
            $dia = intval($d);
            if ($dia >= 0 && $dia <= 6 && !in_array($dia, $vistos, true)) {
                $values[] = "($idMenu, $dia)";
                $vistos[] = $dia;
            }
        }
        if (!empty($values)) {
            $this->db->executeSQL_DML("INSERT INTO menu_dia (id_menu, dia_semana) VALUES " . implode(',', $values));
        }
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

    // Adjunta el arreglo de días a cada menú de una lista (para listados).
    private function adjuntarDias($menus)
    {
        if (!is_array($menus)) return $menus;
        foreach ($menus as $menu) {
            $menu->dias = $menu->tipo_disponibilidad === 'dias' ? $this->getDias($menu->id_menu) : [];
        }
        return $menus;
    }

    private function db_escape($value)
    {
        if ($value === null) return '';
        return str_replace(["\\", "'"], ["\\\\", "\\'"], (string)$value);
    }
}
