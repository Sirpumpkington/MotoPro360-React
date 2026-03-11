import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import "../../assets/css/Ofertas.css";
export default function Ofertas({ productos, onRefresh }) {
  // ------------------------------------------------------------
  // Estado local del componente
  // ------------------------------------------------------------
  const [productoSeleccionado, setProductoSeleccionado] = useState(null); // Producto actual en edición
  const [descuento, setDescuento] = useState(""); // % de descuento
  const [fechaExpiracion, setFechaExpiracion] = useState(""); // Fecha límite (YYYY-MM-DD)
  const [cargando, setCargando] = useState(false); // Para evitar múltiples envíos
  const calcularPrecioConDescuento = (precioOriginal, porcentaje) => {
    if (!porcentaje) return precioOriginal;
    return (precioOriginal * (1 - porcentaje / 100)).toFixed(2);
  };

  // ------------------------------------------------------------
  // Función: Al hacer clic en una tarjeta de producto
  // ------------------------------------------------------------
  const handleSeleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    const promo = producto.promociones?.[0]; // Tomamos la primera promoción (asumimos una activa a la vez)

    if (promo) {
      setDescuento(promo.descuento_porcentaje);
      // Formatear fecha para input type="date" (YYYY-MM-DD)
      if (promo.fecha_expiracion) {
        const fecha = new Date(promo.fecha_expiracion);
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const dia = String(fecha.getDate()).padStart(2, "0");
        setFechaExpiracion(`${año}-${mes}-${dia}`);
      } else {
        setFechaExpiracion("");
      }
    } else {
      // Si no tiene promoción, limpiamos los campos
      setDescuento("");
      setFechaExpiracion("");
    }
  };

  // ------------------------------------------------------------
  // Función: Cerrar el panel flotante
  // ------------------------------------------------------------
  const cerrarPanel = () => {
    setProductoSeleccionado(null);
    setDescuento("");
    setFechaExpiracion("");
  };

  // ------------------------------------------------------------
  // Función: Guardar o actualizar una oferta
  // ------------------------------------------------------------
  const guardarOferta = async () => {
    // Validaciones básicas
    if (!descuento || descuento <= 0) {
      alert("Ingresa un porcentaje válido");
      return;
    }
    if (!fechaExpiracion) {
      alert("Selecciona una fecha de expiración");
      return;
    }

    setCargando(true);
    try {
      const promoExistente = productoSeleccionado.promociones?.[0];
      const payload = {
        id_producto: productoSeleccionado.id_producto,
        descuento_porcentaje: parseFloat(descuento),
        fecha_expiracion: fechaExpiracion,
        activa: true, // Siempre activamos al guardar
      };

      let error;
      if (promoExistente) {
        // Actualizar la promoción existente
        const { error: err } = await supabase
          .from("promociones")
          .update(payload)
          .eq("id", promoExistente.id);
        error = err;
      } else {
        // Insertar nueva promoción
        const { error: err } = await supabase
          .from("promociones")
          .insert([payload]);
        error = err;
      }

      if (error) throw error;

      alert("Oferta guardada correctamente");
      cerrarPanel();
      onRefresh(); // Recargar productos para reflejar cambios
    } catch (error) {
      console.error(error);
      alert("Error al guardar la oferta: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  // ------------------------------------------------------------
  // Función: Desactivar una oferta (sin eliminarla)
  // ------------------------------------------------------------
  const desactivarOferta = async () => {
    const promo = productoSeleccionado.promociones?.[0];
    if (!promo) return;

    if (!window.confirm("¿Desactivar esta oferta?")) return;

    setCargando(true);
    try {
      const { error } = await supabase
        .from("promociones")
        .update({ activa: false })
        .eq("id", promo.id);

      if (error) throw error;

      alert("Oferta desactivada");
      cerrarPanel();
      onRefresh();
    } catch (error) {
      alert("Error al desactivar: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  // ------------------------------------------------------------
  // Renderizado
  // ------------------------------------------------------------
  return (
    <div className="ofertas-admin-view">
      {/* Grilla de productos */}
      <div className="promos-grid">
        {productos.map((prod) => {
          const promo = prod.promociones?.[0];
          const esActiva = promo?.activa;
          const precioConDescuento = esActiva
            ? calcularPrecioConDescuento(
                prod.precio,
                promo.descuento_porcentaje,
              )
            : null;

          return (
            <div
              key={prod.id_producto}
              className={`promo-card ${esActiva ? "active-border" : ""}`}
              onClick={() => handleSeleccionarProducto(prod)}
            >
              <h4>{prod.nombre_producto}</h4>
              <div className="precio-container">
                {esActiva ? (
                  <>
                    <span className="precio-original">${prod.precio}</span>
                    <span className="precio-oferta">${precioConDescuento}</span>
                  </>
                ) : (
                  <span className="precio-normal">${prod.precio}</span>
                )}
              </div>
              {esActiva ? (
                <>
                  <span className="status-on">
                    Oferta: {promo.descuento_porcentaje}%
                  </span>
                  <span className="fecha-expiracion">
                    Hasta:{" "}
                    {new Date(promo.fecha_expiracion).toLocaleDateString()}
                  </span>
                </>
              ) : (
                <span className="status-off">Sin oferta activa</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Panel flotante de configuración (solo visible si hay un producto seleccionado) */}
      {productoSeleccionado && (
        <div className="oferta-floating-panel">
          <h3>Configurar Oferta: {productoSeleccionado.nombre_producto}</h3>

          <label>% Descuento</label>
          {descuento > 0 && (
            <p className="vista-previa">
              Precio con descuento: $
              {calcularPrecioConDescuento(
                productoSeleccionado.precio,
                descuento,
              )}
            </p>
          )}
          <input
            type="number"
            min="1"
            max="100"
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
            disabled={cargando}
          />

          <label>Fecha de Expiración</label>
          <input
            type="date"
            value={fechaExpiracion}
            onChange={(e) => setFechaExpiracion(e.target.value)}
            disabled={cargando}
          />

          <div className="panel-actions">
            <button onClick={guardarOferta} disabled={cargando}>
              {cargando ? "Guardando..." : "Activar Oferta"}
            </button>

            {productoSeleccionado.promociones?.[0]?.activa && (
              <button
                onClick={desactivarOferta}
                disabled={cargando}
                className="btn-desactivar"
              >
                Desactivar Oferta
              </button>
            )}

            <button onClick={cerrarPanel} disabled={cargando}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
