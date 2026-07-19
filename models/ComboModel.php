<?php

class ComboModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    public function getAll()
    {
        $sql = "SELECT co.id_combo, co.nombre, co.descripcion, co.precio_combo, co.esta_activo,
                       cat.nombre AS categoria,
                       (SELECT ic.url_imagen FROM imagen_combo ic
                        WHERE ic.id_combo = co.id_combo AND ic.es_principal = 1 LIMIT 1) AS imagen
                FROM combo co
                INNER JOIN categoria cat ON co.id_categoria = cat.id_categoria
                WHERE co.esta_activo = 1
                ORDER BY co.nombre ASC";
        return $this->db->executeSQL($sql);
    }

    public function getAllMantenimiento()
    {
        $sql = "SELECT co.id_combo, co.nombre, co.descripcion, co.precio_combo, co.esta_activo,
                       co.creado_en, co.editado_en,
                       cat.nombre AS categoria, cat.id_categoria,
                       (SELECT COUNT(*) FROM combo_producto cp WHERE cp.id_combo = co.id_combo) AS cantidad_productos
                FROM combo co
                INNER JOIN categoria cat ON co.id_categoria = cat.id_categoria
                WHERE co.esta_activo = 1
                ORDER BY co.nombre ASC";
        return $this->db->executeSQL($sql);
    }

    public function getById($id)
    {
        $id = intval($id);
        $sql = "SELECT co.id_combo, co.nombre, co.descripcion, co.precio_combo,
                       co.esta_activo, co.creado_en, co.editado_en,
                       cat.nombre AS categoria, cat.id_categoria
                FROM combo co
                INNER JOIN categoria cat ON co.id_categoria = cat.id_categoria
                WHERE co.id_combo = $id";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    public function getProductos($id)
    {
        $id = intval($id);
        $sql = "SELECT p.id_producto, p.nombre, p.descripcion, p.precio_base,
                       cp.cantidad,
                       (SELECT ip.url_imagen FROM imagen_producto ip
                        WHERE ip.id_producto = p.id_producto AND ip.es_principal = 1 LIMIT 1) AS imagen
                FROM producto p
                INNER JOIN combo_producto cp ON p.id_producto = cp.id_producto
                WHERE cp.id_combo = $id
                ORDER BY p.nombre ASC";
        return $this->db->executeSQL($sql);
    }

    public function getImagenes($id)
    {
        $id = intval($id);
        $sql = "SELECT id_imagen, url_imagen, texto_alt, es_principal
                FROM imagen_combo
                WHERE id_combo = $id
                ORDER BY es_principal DESC";
        return $this->db->executeSQL($sql);
    }

    public function existeNombre($nombre, $idExcluir = null)
    {
        $nombre = $this->db_escape($nombre);
        $sql = "SELECT id_combo FROM combo WHERE nombre = '$nombre'";
        if ($idExcluir !== null) {
            $idExcluir = intval($idExcluir);
            $sql .= " AND id_combo <> $idExcluir";
        }
        $sql .= " LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return is_array($result) && count($result) > 0;
    }

    public function create($data)
    {
        $nombre = $this->db_escape($data['nombre']);
        $descripcion = $this->db_escape($data['descripcion'] ?? '');
        $precio = floatval($data['precio_combo']);
        $idCategoria = intval($data['id_categoria'] ?? 4);

        $sql = "INSERT INTO combo (id_categoria, nombre, descripcion, precio_combo, esta_activo)
                VALUES ($idCategoria, '$nombre', '$descripcion', $precio, 1)";
        $idCombo = $this->db->executeSQL_DML_last($sql);

        if ($idCombo && !empty($data['productos']) && is_array($data['productos'])) {
            $this->setProductos($idCombo, $data['productos']);
        }
        return $idCombo;
    }

    public function update($id, $data)
    {
        $id = intval($id);
        $nombre = $this->db_escape($data['nombre']);
        $descripcion = $this->db_escape($data['descripcion'] ?? '');
        $precio = floatval($data['precio_combo']);
        $idCategoria = intval($data['id_categoria'] ?? 4);

        $sql = "UPDATE combo
                SET id_categoria = $idCategoria,
                    nombre = '$nombre',
                    descripcion = '$descripcion',
                    precio_combo = $precio
                WHERE id_combo = $id";
        $this->db->executeSQL_DML($sql);

        if (isset($data['productos']) && is_array($data['productos'])) {
            $this->setProductos($id, $data['productos']);
        }
        return true;
    }

    private function setProductos($idCombo, $productos)
    {
        $idCombo = intval($idCombo);
        $this->db->executeSQL_DML("DELETE FROM combo_producto WHERE id_combo = $idCombo");
        if (empty($productos)) {
            return;
        }
        $values = [];
        foreach ($productos as $item) {
            if (is_array($item) || is_object($item)) {
                $item = (array)$item;
                $idProd = intval($item['id_producto'] ?? 0);
                $cantidad = intval($item['cantidad'] ?? 1);
            } else {
                $idProd = intval($item);
                $cantidad = 1;
            }
            if ($idProd > 0 && $cantidad > 0) {
                $values[] = "($idCombo, $idProd, $cantidad)";
            }
        }
        if (!empty($values)) {
            $sql = "INSERT INTO combo_producto (id_combo, id_producto, cantidad) VALUES " . implode(',', $values);
            $this->db->executeSQL_DML($sql);
        }
    }

    private function db_escape($value)
    {
        if ($value === null) return '';
        return str_replace(["\\", "'"], ["\\\\", "\\'"], (string)$value);
    }
}