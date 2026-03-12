import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import styles from "../../assets/css/local.module.css";

export default function Ofertas({ productos, onRefresh, historialOfertas, setHistorialOfertas, estadisticasOfertas, setEstadisticasOfertas }) {
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [descuento, setDescuento] = useState("");
  const [fechaExpiracion, setFechaExpiracion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [vista, setVista] = useState("activas"); // "activas", "historial", "sugerencias"
  const [sugerencias, setSugerencias] = useState([]);

  // Generar sugerencias de productos para ofertar (stock bajo o sin oferta)
  const generarSugerencias = () => {
    const sugeridos = productos
      .filter(p => {
        const tieneOferta = p.promociones?.some(promo => promo.activa);
        return !tieneOferta && p.stock_actual > 0 && p.stock_actual <= (p.stock_minimo || 5);
      })
      .slice(0, 5);
    setSugerencias(sugeridos);
  };

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
            <i className="fas fa-chart-line"></i>
            <span>{estadisticasOfertas?.clicsSimulados || 0} clics</span>
          </div>
          <div className={styles.statChip}>
            <i className="fas fa-heart"></i>
            <span>{estadisticasOfertas?.interesSimulado || 0} interés</span>
          </div>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className={styles.ofertasTabs}>
        <button
          className={`${styles.tabBtn} ${vista === 'activas' ? styles.active : ''}`}
          onClick={() => setVista('activas')}
        >
          Activas
        </button>
        <button
          className={`${styles.tabBtn} ${vista === 'sugerencias' ? styles.active : ''}`}
          onClick={() => { generarSugerencias(); setVista('sugerencias'); }}
        >
          Sugerencias
        </button>
        <button
          className={`${styles.tabBtn} ${vista === 'historial' ? styles.active : ''}`}
          onClick={() => setVista('historial')}
        >
          Historial
        </button>
      </div>

      {/* Contenido según pestaña */}
      {vista === 'activas' && (
        <>
          {ofertasActivas.length === 0 ? (
            <div className={styles.noResults}>
              <i className="fas fa-tag"></i>
              <p>No tienes ofertas activas.</p>
              <button className={styles.btnPrimary} onClick={() => setVista('sugerencias')}>
                Ver sugerencias
              </button>
            </div>
          ) : (
            <div className={styles.ofertasGrid}>
              {ofertasActivas.map((prod) => {
                const promo = prod.promociones?.[0];
                return (
                  <div
                    key={prod.id_producto}
                    className={styles.ofertaCard}
                    onClick={() => handleSeleccionarProducto(prod)}
                  >
                    <div className={styles.cardImagePlaceholder}>
                      <i className="fas fa-box"></i>
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
                    <div className={styles.ofertaStats}>
                      <span><i className="fas fa-eye"></i> {Math.floor(Math.random() * 50)}</span>
                      <span><i className="fas fa-heart"></i> {Math.floor(Math.random() * 20)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {vista === 'sugerencias' && (
        <div className={styles.sugerenciasContainer}>
          <h4><i className="fas fa-lightbulb"></i> Sugerencias</h4>
          <p className={styles.sugerenciasDesc}>
            Productos con stock bajo que podrías poner en oferta para impulsar sus ventas.
          </p>
          {sugerencias.length === 0 ? (
            <div className={styles.noResults}>
              <p>No hay productos sugeridos en este momento.</p>
            </div>
          ) : (
            <div className={styles.sugerenciasList}>
              {sugerencias.map(prod => (
                <div key={prod.id_producto} className={styles.sugerenciaItem} onClick={() => handleSeleccionarProducto(prod)}>
                  <div className={styles.sugerenciaInfo}>
                    <h4>{prod.nombre_producto}</h4>
                    <p>Stock: {prod.stock_actual} | Precio: ${prod.precio}</p>
                  </div>
                  <button className={styles.btnSmall}>Ofertar</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {vista === 'historial' && (
        <div className={styles.historialContainer}>
          <h4><i className="fas fa-history"></i> Historial</h4>
          <p className={styles.historialDesc}>Últimas ofertas realizadas (simulado).</p>
          <div className={styles.historialList}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={styles.historialItem}>
                <div className={styles.historialHeader}>
                  <span>Producto {i}</span>
                  <span className={styles.historialFecha}>Hace {i * 2} días</span>
                </div>
                <div className={styles.historialDetalle}>
                  <span>Descuento: {10 + i * 5}%</span>
                  <span>Ventas estimadas: {Math.floor(Math.random() * 50)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
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