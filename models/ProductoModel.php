<?php

class ProductoModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    public function getAll()
    {
        $sql = "SELECT p.id_producto, p.nombre, p.descripcion, p.precio_base, p.tiempo_preparacion,
                       p.disponible, p.esta_activo,
                       c.nombre AS categoria, c.id_categoria,
                       (SELECT ip.url_imagen FROM imagen_producto ip
                        WHERE ip.id_producto = p.id_producto AND ip.es_principal = 1 LIMIT 1) AS imagen
                FROM producto p
                INNER JOIN categoria c ON p.id_categoria = c.id_categoria
                WHERE p.esta_activo = 1
                ORDER BY c.orden_display ASC, c.nombre ASC, p.nombre ASC";
        return $this->db->executeSQL($sql);
    }

    public function getAllMantenimiento()
    {
        $sql = "SELECT p.id_producto, p.nombre, p.descripcion, p.precio_base, p.tiempo_preparacion,
                       p.disponible, p.esta_activo, p.creado_en, p.editado_en,
                       c.nombre AS categoria, c.id_categoria,
                       (SELECT ip.url_imagen FROM imagen_producto ip
                        WHERE ip.id_producto = p.id_producto AND ip.es_principal = 1 LIMIT 1) AS imagen,
                       (SELECT COUNT(*) FROM producto_ingrediente pi WHERE pi.id_producto = p.id_producto) AS cantidad_ingredientes
                FROM producto p
                INNER JOIN categoria c ON p.id_categoria = c.id_categoria
                WHERE p.esta_activo = 1
                ORDER BY p.nombre ASC";
        return $this->db->executeSQL($sql);
    }

    public function getById($id)
    {
        $id = intval($id);
        $sql = "SELECT p.id_producto, p.nombre, p.descripcion, p.precio_base, p.tiempo_preparacion,
                       p.disponible, p.esta_activo, p.creado_en, p.editado_en,
                       c.nombre AS categoria, c.id_categoria
                FROM producto p
                INNER JOIN categoria c ON p.id_categoria = c.id_categoria
                WHERE p.id_producto = $id";
        $result = $this->db->executeSQL($sql);
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    public function getIngredientes($id)
    {
        $id = intval($id);
        $sql = "SELECT i.id_ingrediente, i.nombre, i.descripcion, i.es_alergeno,
                       pi.es_ingrediente_principal
                FROM ingrediente i
                INNER JOIN producto_ingrediente pi ON i.id_ingrediente = pi.id_ingrediente
                WHERE pi.id_producto = $id AND i.esta_activo = 1
                ORDER BY pi.es_ingrediente_principal DESC, i.nombre ASC";
        return $this->db->executeSQL($sql);
    }

    public function getImagenes($id)
    {
        $id = intval($id);
        $sql = "SELECT id_imagen, url_imagen, texto_alt, es_principal, orden_display
                FROM imagen_producto
                WHERE id_producto = $id
                ORDER BY es_principal DESC, orden_display ASC";
        return $this->db->executeSQL($sql);
    }

    public function existeNombre($nombre, $idExcluir = null)
    {
        $nombre = $this->db_escape($nombre);
        $sql = "SELECT id_producto FROM producto WHERE nombre = '$nombre'";
        if ($idExcluir !== null) {
            $idExcluir = intval($idExcluir);
            $sql .= " AND id_producto <> $idExcluir";
        }
        $sql .= " LIMIT 1";
        $result = $this->db->executeSQL($sql);
        return is_array($result) && count($result) > 0;
    }

    public function create($data)
    {
        $nombre = $this->db_escape($data['nombre']);
        $descripcion = $this->db_escape($data['descripcion'] ?? '');
        $idCategoria = intval($data['id_categoria']);
        $precio = floatval($data['precio_base']);
        $tiempo = intval($data['tiempo_preparacion'] ?? 0);

        $sql = "INSERT INTO producto (id_categoria, nombre, descripcion, precio_base, tiempo_preparacion, disponible, esta_activo)
                VALUES ($idCategoria, '$nombre', '$descripcion', $precio, $tiempo, 1, 1)";
        $idProducto = $this->db->executeSQL_DML_last($sql);

        if ($idProducto && !empty($data['ingredientes']) && is_array($data['ingredientes'])) {
            $this->setIngredientes($idProducto, $data['ingredientes']);
        }
        if ($idProducto && !empty($data['imagen_url'])) {
            $this->setImagenPrincipal($idProducto, $data['imagen_url'], $data['imagen_alt'] ?? $data['nombre']);
        }
        return $idProducto;
    }

    public function update($id, $data)
    {
        $id = intval($id);
        $nombre = $this->db_escape($data['nombre']);
        $descripcion = $this->db_escape($data['descripcion'] ?? '');
        $idCategoria = intval($data['id_categoria']);
        $precio = floatval($data['precio_base']);
        $tiempo = intval($data['tiempo_preparacion'] ?? 0);

        $sql = "UPDATE producto
                SET id_categoria = $idCategoria,
                    nombre = '$nombre',
                    descripcion = '$descripcion',
                    precio_base = $precio,
                    tiempo_preparacion = $tiempo
                WHERE id_producto = $id";
        $this->db->executeSQL_DML($sql);

        if (isset($data['ingredientes']) && is_array($data['ingredientes'])) {
            $this->setIngredientes($id, $data['ingredientes']);
        }
        if (!empty($data['imagen_url'])) {
            $this->setImagenPrincipal($id, $data['imagen_url'], $data['imagen_alt'] ?? $data['nombre']);
        }
        return true;
    }

    private function setIngredientes($idProducto, $ingredientes)
    {
        $idProducto = intval($idProducto);
        $this->db->executeSQL_DML("DELETE FROM producto_ingrediente WHERE id_producto = $idProducto");
        if (empty($ingredientes)) {
            return;
        }
        $values = [];
        foreach ($ingredientes as $ing) {
            $idIng = intval(is_array($ing) ? ($ing['id_ingrediente'] ?? 0) : $ing);
            if ($idIng > 0) {
                $values[] = "($idProducto, $idIng, 1)";
            }
        }
        if (!empty($values)) {
            $sql = "INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES " . implode(',', $values);
            $this->db->executeSQL_DML($sql);
        }
    }

    private function setImagenPrincipal($idProducto, $urlImagen, $alt)
    {
        $idProducto = intval($idProducto);
        $urlImagen = $this->db_escape($urlImagen);
        $alt = $this->db_escape($alt);

        $sqlExiste = "SELECT id_imagen FROM imagen_producto WHERE id_producto = $idProducto AND es_principal = 1 LIMIT 1";
        $existe = $this->db->executeSQL($sqlExiste);

        if (is_array($existe) && count($existe) > 0) {
            $idImagen = intval($existe[0]->id_imagen);
            $sql = "UPDATE imagen_producto SET url_imagen = '$urlImagen', texto_alt = '$alt' WHERE id_imagen = $idImagen";
            $this->db->executeSQL_DML($sql);
        } else {
            $sql = "INSERT INTO imagen_producto (id_producto, url_imagen, texto_alt, es_principal, orden_display)
                    VALUES ($idProducto, '$urlImagen', '$alt', 1, 1)";
            $this->db->executeSQL_DML($sql);
        }
    }

    private function db_escape($value)
    {
        if ($value === null) return '';
        return str_replace(["\\", "'"], ["\\\\", "\\'"], (string)$value);
    }
}
