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
}
