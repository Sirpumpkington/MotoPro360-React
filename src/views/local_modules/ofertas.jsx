import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import styles from "../../assets/css/local.module.css";

export default function Ofertas({ productos, onRefresh, historialOfertas, setHistorialOfertas, estadisticasOfertas, setEstadisticasOfertas }) {
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [descuento, setDescuento] = useState("");
  const [fechaExpiracion, setFechaExpiracion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [vista, setVista] = useState("todos"); // "todos", "activas"

  const calcularPrecioConDescuento = (precioOriginal, porcentaje) => {
    if (!porcentaje) return precioOriginal;
    return (precioOriginal * (1 - porcentaje / 100)).toFixed(2);
  };

  const handleSeleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    const promo = producto.promociones?.[0];
    if (promo) {
      setDescuento(promo.descuento_porcentaje);
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
      setDescuento("");
      setFechaExpiracion("");
    }
  };

  const cerrarPanel = () => {
    setProductoSeleccionado(null);
    setDescuento("");
    setFechaExpiracion("");
  };

  const guardarOferta = async () => {
    if (!descuento || descuento <= 0 || descuento > 100) {
      alert("Ingresa un porcentaje válido (1-100)");
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
        activa: true,
      };
      let error;
      if (promoExistente) {
        const { error: err } = await supabase
          .from("promociones")
          .update(payload)
          .eq("id", promoExistente.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from("promociones")
          .insert([payload]);
        error = err;
      }
      if (error) throw error;

      // Actualizar estadísticas simuladas
      setEstadisticasOfertas({
        clicsSimulados: (estadisticasOfertas?.clicsSimulados || 0) + Math.floor(Math.random() * 10),
        interesSimulado: (estadisticasOfertas?.interesSimulado || 0) + Math.floor(Math.random() * 5),
      });

      alert("Oferta guardada correctamente");
      cerrarPanel();
      onRefresh();
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setCargando(false);
    }
  };

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
      alert("Error: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Productos con ofertas activas
  const ofertasActivas = productos.filter(p => p.promociones?.some(promo => promo.activa));

  return (
    <div className={styles.ofertasContainer}>
      {/* Cabecera con estadísticas */}
      <div className={styles.ofertasHeader}>
        <h2><i className="fas fa-tags"></i> Ofertas</h2>
        <div className={styles.statsChips}>
          <div className={styles.statChip}>
            <i className="fas fa-bolt"></i>
            <span>{ofertasActivas.length} activas</span>
          </div>
          <div className={styles.statChip}>
            <i className="fas fa-box"></i>
            <span>{productos.length} total</span>
          </div>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className={styles.ofertasTabs}>
        <button
          className={`${styles.tabBtn} ${vista === 'todos' ? styles.active : ''}`}
          onClick={() => setVista('todos')}
        >
          Todos los Productos
        </button>
        <button
          className={`${styles.tabBtn} ${vista === 'activas' ? styles.active : ''}`}
          onClick={() => setVista('activas')}
        >
          Ofertas Activas
        </button>
      </div>

      {/* Contenido según pestaña */}
      {vista === 'todos' && (
        <>
          {productos.length === 0 ? (
            <div className={styles.noResults}>
              <i className="fas fa-box-open"></i>
              <p>No tienes productos en tu inventario aún.</p>
            </div>
          ) : (
            <div className={styles.ofertasGrid}>
              {productos.map((prod) => {
                const promoActiva = prod.promociones?.find(promo => promo.activa);
                return (
                  <div
                    key={prod.id_producto}
                    className={styles.ofertaCard}
                    onClick={() => handleSeleccionarProducto(prod)}
                  >
                    <div className={styles.cardImagePlaceholder}>
                       {prod.imagen_url ? (
                        <img src={prod.imagen_url} alt={prod.nombre_producto} />
                      ) : (
                        <i className="fas fa-box"></i>
                      )}
                    </div>
                    <h4>{prod.nombre_producto}</h4>
                    <div className={styles.precios}>
                      <span className={promoActiva ? styles.precioOriginal : styles.precioNormal}>${prod.precio}</span>
                      {promoActiva && (
                        <span className={styles.precioOferta}>
                          ${calcularPrecioConDescuento(prod.precio, promoActiva.descuento_porcentaje)}
                        </span>
                      )}
                    </div>
                    {promoActiva ? (
                       <div className={styles.ofertaBadge}>
                        <span>{promoActiva.descuento_porcentaje}% OFF</span>
                        <small>Hasta {new Date(promoActiva.fecha_expiracion).toLocaleDateString()}</small>
                      </div>
                    ) : (
                        <div className={styles.sinOfertaBadge}>
                          <span>Sin oferta</span>
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {vista === 'activas' && (
        <>
          {ofertasActivas.length === 0 ? (
            <div className={styles.noResults}>
              <i className="fas fa-tag"></i>
              <p>No tienes ofertas activas.</p>
              <button className={styles.btnPrimary} onClick={() => setVista('todos')}>
                Ver productos
              </button>
            </div>
          ) : (
            <div className={styles.ofertasGrid}>
              {ofertasActivas.map((prod) => {
                const promo = prod.promociones?.find(promo => promo.activa);
                return (
                  <div
                    key={prod.id_producto}
                    className={styles.ofertaCard}
                    onClick={() => handleSeleccionarProducto(prod)}
                  >
                    <div className={styles.cardImagePlaceholder}>
                      {prod.imagen_url ? (
                        <img src={prod.imagen_url} alt={prod.nombre_producto} />
                      ) : (
                        <i className="fas fa-box"></i>
                      )}
                    </div>
                    <h4>{prod.nombre_producto}</h4>
                    <div className={styles.precios}>
                      <span className={styles.precioOriginal}>${prod.precio}</span>
                      <span className={styles.precioOferta}>
                        ${calcularPrecioConDescuento(prod.precio, promo.descuento_porcentaje)}
                      </span>
                    </div>
                    <div className={styles.ofertaBadge}>
                      <span>{promo.descuento_porcentaje}% OFF</span>
                      <small>Hasta {new Date(promo.fecha_expiracion).toLocaleDateString()}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}



      {/* Panel de configuración de oferta */}
      {productoSeleccionado && (
        <div className={styles.ofertaPanel}>
          <div className={styles.panelContent}>
            <h3>Configurar oferta</h3>
            <p className={styles.productoNombre}>{productoSeleccionado.nombre_producto}</p>

            <div className={styles.campo}>
              <label>% Descuento</label>
              <input
                type="number"
                min="1"
                max="100"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
                disabled={cargando}
              />
            </div>

            {descuento > 0 && (
              <p className={styles.vistaPrevia}>
                Precio final: ${calcularPrecioConDescuento(productoSeleccionado.precio, descuento)}
              </p>
            )}

            <div className={styles.campo}>
              <label>Fecha de expiración</label>
              <input
                type="date"
                value={fechaExpiracion}
                onChange={(e) => setFechaExpiracion(e.target.value)}
                disabled={cargando}
              />
            </div>

            <div className={styles.panelActions}>
              <button onClick={guardarOferta} disabled={cargando} className={styles.btnActivar}>
                {cargando ? <i className="fas fa-spinner fa-spin"></i> : "Activar Oferta"}
              </button>
              {productoSeleccionado.promociones?.[0]?.activa && (
                <button onClick={desactivarOferta} disabled={cargando} className={styles.btnDesactivar}>
                  Desactivar
                </button>
              )}
              <button onClick={cerrarPanel} className={styles.btnCancelar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}