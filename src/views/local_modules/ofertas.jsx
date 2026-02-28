import React from "react";
import styles from "../../assets/css/local.module.css"; // Asegúrate de tener este archivo para estilos específicos

export default function Ofertas({ productos, ofertasSimuladas, toggleOferta }) {
  return (
    <div style={{ padding: "20px" }}>
      <div
        className={styles["welcome-card-local"]}
        style={{
          background: "linear-gradient(135deg, #ff4d00 0%, #FFCC00 100%)",
          color: "white",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ color: "white" }}>🔥 Zona de Ofertas</h2>
        <p style={{ color: "white" }}>
          Selecciona un producto para aplicar un descuento flash.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "15px",
        }}
      >
        {productos && productos.length === 0 ? (
          <p>No tienes productos para ofertar.</p>
        ) : (
          productos.map((prod) => {
            const enOferta = ofertasSimuladas.includes(prod.id_producto);
            return (
              <div
                key={prod.id_producto}
                className="data-card"
                style={{
                  padding: "15px",
                  border: enOferta ? "2px solid #FF9900" : "1px solid #eee",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <h4 style={{ margin: 0 }}>{prod.nombre_producto}</h4>
                  {enOferta && (
                    <span
                      className="badge"
                      style={{ background: "red", color: "white" }}
                    >
                      -20% OFF
                    </span>
                  )}
                </div>
                <p style={{ margin: "5px 0", color: "#666" }}>
                  Precio regular: ${prod.precio}
                </p>

                {enOferta && (
                  <p
                    style={{
                      fontWeight: "bold",
                      color: "#FF9900",
                      fontSize: "1.1rem",
                    }}
                  >
                    Ahora: ${(prod.precio * 0.8).toFixed(2)}
                  </p>
                )}

                <button
                  className="btn-main-login"
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    background: enOferta ? "#333" : "#FF9900",
                    border: "none",
                  }}
                  onClick={() => toggleOferta(prod.id_producto)}
                >
                  {enOferta ? "Terminar Oferta" : "Aplicar Descuento"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
