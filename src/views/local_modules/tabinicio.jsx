import React from "react";
import styles from "../../assets/css/local.module.css";

export default function TabInicio({ localPerfil, notificaciones, stats }) {
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
            <span className={styles.statLabel}>Productos</span>
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
          <i className="fas fa-eye"></i>
          <div>
            <span className={styles.statNumber}>{stats?.visitasMes || 0}</span>
            <span className={styles.statLabel}>Visitas este mes</span>
          </div>
        </div>
        <div className={styles.statCardLarge}>
          <i className="fas fa-phone-alt"></i>
          <div>
            <span className={styles.statNumber}>{stats?.contactosMes || 0}</span>
            <span className={styles.statLabel}>Contactos</span>
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className={styles.recentActivity}>
        <h3><i className="fas fa-bell"></i> Actividad reciente</h3>
        <div className={styles.notificacionesList}>
          {notificaciones.map((notif) => (
            <div key={notif.id} className={`${styles.notificacionCard} ${styles[notif.tipo]}`}>
              <div className={styles.notifIcon}>
                {notif.tipo === "pregunta" && <i className="fas fa-question-circle"></i>}
                {notif.tipo === "interes" && <i className="fas fa-heart"></i>}
                {notif.tipo === "alerta" && <i className="fas fa-exclamation-triangle"></i>}
              </div>
              <div className={styles.notifContent}>
                <p><strong>{notif.usuario}</strong> {notif.mensaje}</p>
                <span className={styles.notifMeta}>{notif.producto} • {notif.hace}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}