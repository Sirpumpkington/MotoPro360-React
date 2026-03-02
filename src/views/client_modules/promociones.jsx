import React from "react";
import { supabase } from "../../supabaseClient"; // Asegúrate de que la ruta sea correcta

export default function VistaPromos() {
  const [ofertas, setOfertas] = React.useState([]);

  React.useEffect(() => {
    const cargarOfertas = async () => {
      // Traemos todos los productos de toda la app que tengan en_oferta = true
      const { data, error } = await supabase
        .from("productos")
        .select("*, locales(nombre_local)")
        .eq("en_oferta", true);

      if (data) setOfertas(data);
    };
    cargarOfertas();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🔥 Promociones Activas</h2>
      {ofertas.length === 0 ? (
        <p>No hay ofertas disponibles en este momento.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "15px",
          }}
        >
          {ofertas.map((prod) => (
            <div
              key={prod.id_producto}
              style={{
                padding: "15px",
                border: "2px solid #FF9900",
                borderRadius: "8px",
                background: "#fff",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0" }}>{prod.nombre_producto}</h4>
              <p style={{ margin: "0", color: "gray", fontSize: "0.9rem" }}>
                Tienda: {prod.locales?.nombre_local || "Local desconocido"}
              </p>
              <p
                style={{
                  margin: "5px 0",
                  textDecoration: "line-through",
                  color: "#666",
                }}
              >
                Precio normal: ${prod.precio}
              </p>
              <p
                style={{
                  margin: "0",
                  fontWeight: "bold",
                  color: "#FF9900",
                  fontSize: "1.2rem",
                }}
              >
                ¡Oferta: ${(prod.precio * 0.8).toFixed(2)}!
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
