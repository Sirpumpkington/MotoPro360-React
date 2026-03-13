import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import "../../assets/css/client.css";

export default function VistaPromos({ onVerDetalles }) {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarOfertas = async () => {
      setLoading(true);

      // OPTIMIZACIÓN: Pedimos solo productos que tengan promociones activas directamente a Supabase
      const { data, error } = await supabase
        .from("productos")
        .select(
          `
          *,
          locales (nombre_local),
          promociones!inner (*) 
        `,
        ) // El !inner hace que solo traiga productos que TENGAN promociones
        .eq("status", true)
        .eq("promociones.activa", true)
        .gte("promociones.fecha_expiracion", new Date().toISOString()); // Solo las que no han vencido

      if (error) {
        console.error("Error cargando promos:", error);
      } else {
        setOfertas(data || []);
      }
      setLoading(false);
    };

    cargarOfertas();
  }, []);

  if (loading)
    return <div className="promos-loading">Cargando promociones...</div>;

  if (ofertas.length === 0) {
    return (
      <div className="promos-empty">
        <i className="fas fa-tag"></i>
        <p>No hay ofertas disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div className="promos-container">
      <h2 className="promos-title"> <i className="fas fa-tags"></i> Promociones</h2>
      <div className="promos-grid">
        {ofertas.map((prod) => {
          // Como usamos !inner, sabemos que promociones[0] existe y es válida
          const promo = prod.promociones[0];
          const precioOriginal = prod.precio;
          const descuento = promo.descuento_porcentaje;
          const precioFinal = (precioOriginal * (1 - descuento / 100)).toFixed(
            2,
          );

          return (
            <div key={prod.id_producto} className="promo-card">
              <div className="promo-header">
                <h3 className="promo-item-name">{prod.nombre_producto}</h3>
                <div className="promo-badge">-{descuento}%</div>
              </div>

              <p className="promo-store">
                <i className="fas fa-store"></i> {prod.locales?.nombre_local}
              </p>

              <div className="promo-prices">
                <span className="promo-old-price">${precioOriginal}</span>
                <span className="promo-new-price">${precioFinal}</span>
              </div>

              <div className="promo-footer">
                <p className="promo-expiration">
                  <i className="far fa-calendar-alt"></i> Expira:{" "}
                  {new Date(promo.fecha_expiracion).toLocaleDateString()}
                </p>
                <button 
                  className="promo-btn"
                  onClick={() => onVerDetalles && onVerDetalles(prod.nombre_producto)}
                >
                  Ver Detalle
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
