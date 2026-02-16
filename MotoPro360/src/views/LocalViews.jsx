import React, { useEffect } from "react";

export default function LocalView({ activeTab, perfil }) {
  // Mostrar solo a locales
  if (perfil?.nombre_rol !== "local") return null;

  // Aqui se importa el CSS de manera dinámica para evitar cargarlo en otras vistas
  useEffect(() => {
    let mounted = true;
    import("../assets/css/local.css").then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Contenido de cada pestaña
  if (activeTab === "inicio") {
    return (
      <div className="welcome-card-local">
        <h1>Bienvenido al Panel del Local</h1>
        <p>
          Desde aquí puedes gestionar tus productos, ver estadísticas de ventas
          y más.
        </p>
      </div>
    );
  }
  if (activeTab == "productos") {
    return (
      <div className="local-grid">
        {/* Tarjeta de "Agregar Nuevo" */}
        <div className="data-card local-card add">
          <i
            className="fas fa-plus"
            style={{
              fontSize: "2.5rem",
              color: "var(--primary-red)",
              marginBottom: "15px",
            }}
          ></i>
          <span style={{ fontWeight: "700", color: "var(--primary-red)" }}>
            Nuevo Producto
          </span>
        </div>

        {/* Productos Simulados */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="data-card local-card">
            <div className="local-thumb">
              <i
                className="fas fa-image"
                style={{ color: "#adb5bd", fontSize: "2rem" }}
              ></i>
            </div>
            <h3 style={{ fontSize: "1.1rem", color: "var(--black)" }}>
              Producto Demo {i}
            </h3>
            <p className="local-price">$25.00</p>
            <button className="local-edit-btn">Editar</button>
          </div>
        ))}
      </div>
    );
  }
}
