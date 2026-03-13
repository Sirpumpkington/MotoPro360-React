import React from "react";
import styles from "../../assets/css/local.module.css";

export default function TabInicio({ localPerfil, productos = [], stats }) {
  // Procesar productos con stock bajo
  const productosBajoStock = productos.filter(p => p.stock_actual > 0 && p.stock_actual <= (p.stock_minimo || 5));
  
  // Procesar ofertas expiradas
  const ahora = new Date();
  ahora.setHours(0,0,0,0);
  
  const ofertasExpiradas = productos.filter(p => {
    const promo = p.promociones?.find(pr => pr.activa);
    if (!promo || !promo.fecha_expiracion) return false;
    
    // Parse fecha expiracion as local time to avoid timezone offset issues leading to false expirations
    const [year, month, day] = promo.fecha_expiracion.split('-');
    const fechaExpiracion = new Date(year, month - 1, day);
    
    return fechaExpiracion < ahora;
  });

  return (
    <div className={styles.inicioContainer}>
      {/* Banner de bienvenida */}
      <div className={styles.welcomeBanner}>
        <h1>Hola, {localPerfil?.nombre_local || "Comerciante"}!</h1>
        <p>Aquí tienes lo que ha pasado mientras no estabas.</p>
      </div>

      {/* Estadísticas rápidas */}
      <div className={styles.statsGridLarge}>
        <div className={styles.statCardLarge}>
          <i className="fas fa-box"></i>
          <div>
            <span className={styles.statNumber}>{stats?.totalProductos || 0}</span>
            <span className={styles.statLabel}>Productos en inventario</span>
          </div>
        </div>
        <div className={styles.statCardLarge}>
          <i className="fas fa-tags"></i>
          <div>
            <span className={styles.statNumber}>{stats?.ofertasActivas || 0}</span>
            <span className={styles.statLabel}>Ofertas activas</span>
          </div>
        </div>
        <div className={styles.statCardLarge}>
          <i className="fas fa-id-card"></i>
          <div>
            <span className={styles.statNumber} style={{ textTransform: "capitalize" }}>
              {localPerfil?.nivel_membresia || "Gratis"}
            </span>
            <span className={styles.statLabel}>Nivel de Membresía</span>
          </div>
        </div>
      </div>

      <div className={styles.recentActivity}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Columna: Stock Bajo */}
          <div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>
              <i className="fas fa-exclamation-triangle" style={{ color: 'var(--primary-red)', marginRight: '8px' }}></i> 
              Productos con Stock Bajo
            </h3>
            
            <div className={styles.notificacionesList}>
              {productosBajoStock.length === 0 ? (
                <div className={styles.notificacionCard} style={{ opacity: 0.7 }}>
                  <p>Todo el inventario goza de buen stock.</p>
                </div>
              ) : (
                productosBajoStock.map((prod) => (
                  <div key={prod.id_producto} className={`${styles.notificacionCard} ${styles.alerta}`}>
                    <div className={styles.notifIcon}>
                      <i className="fas fa-box"></i>
                    </div>
                    <div className={styles.notifContent}>
                      <p><strong>{prod.nombre_producto}</strong></p>
                      <span className={styles.notifMeta}>Stock actual: {prod.stock_actual} (Mínimo: {prod.stock_minimo || 5})</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Columna: Ofertas Expiradas */}
          <div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>
               <i className="fas fa-clock" style={{ color: '#eab308', marginRight: '8px' }}></i> 
               Ofertas Expiradas
            </h3>
            
            <div className={styles.notificacionesList}>
               {ofertasExpiradas.length === 0 ? (
                <div className={styles.notificacionCard} style={{ opacity: 0.7 }}>
                  <p>No tienes ofertas expiradas.</p>
                </div>
              ) : (
                ofertasExpiradas.map((prod) => {
                  const promo = prod.promociones.find(pr => pr.activa);
                  return (
                    <div key={prod.id_producto} className={`${styles.notificacionCard} ${styles.pregunta}`}>
                      <div className={styles.notifIcon}>
                        <i className="fas fa-tags"></i>
                      </div>
                      <div className={styles.notifContent}>
                        <p><strong>{prod.nombre_producto}</strong></p>
                        <span className={styles.notifMeta}>Expiró el: {new Date(promo.fecha_expiracion).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}