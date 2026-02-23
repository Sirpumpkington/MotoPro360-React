import React from "react";
import styles from "../../assets/css/local.module.css"; // Asegúrate de tener este archivo para estilos específicos
export default function TabInicio({ localPerfil, notificaciones }) {
  return (
    <div style={{ padding: "20px" }}>
      <div
        className={styles["welcome-card-local"]}
        style={{ marginBottom: "20px" }}
      >
        {/*Tarjeta de bienvenida personalizada para el comerciante */}
        <h2>Hola, {localPerfil?.nombre_local || "Comerciante"}!</h2>
        <p>Aquí tienes lo que ha pasado mientras no estabas.</p>
      </div>

      <h3>Actividad Reciente:</h3>
      {/* Aqui se Muestran Las notificaciones de lo Ocurrido en el sistema
      
        Por ahora se muestra un ejemplo estatico, pero en el futuro se conectara a 
        la base de datos para mostrar las notificaciones reales del comerciante, 
        como preguntas de clientes, ventas realizadas, etc.
      */}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {notificaciones.map((notif) => (
          <div key={notif.id} className={styles["notifi-card"]}>
            <div className={styles["icon-notif"]}>
              <i
                className={`fas ${notif.tipo === "pregunta" ? "fa-question" : notif.tipo === "venta" ? "fa-dollar-sign" : "fa-heart"}`}
                style={{ color: "#666" }}
              ></i>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>
                {notif.mensaje}
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
                En:{" "}
                <span style={{ color: "var(--primary-red)" }}>
                  {notif.producto}
                </span>{" "}
                • {notif.usuario}
              </p>
            </div>
            <span style={{ fontSize: "0.7rem", color: "#999" }}>
              {notif.hace}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
