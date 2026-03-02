import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import "../../assets/css/client.css";

export default function VistaPromos() {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarOfertas = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("productos")
        .select("*, locales(nombre_local)")
        .eq("en_oferta", true);
      if (data) setOfertas(data);
      setLoading(false);
    };
    cargarOfertas();
  }, []);

  if (loading) {
    return <div className="promos-loading">Cargando promociones...</div>;
  }

  if (ofertas.length === 0) {
    return (
      <div className="promos-empty">
        <p>No hay ofertas disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div className="promos-container">
      <h2 className="promos-title">Promociones Activas</h2>
      <div className="promos-grid">
        {ofertas.map((prod) => (
          <div key={prod.id_producto} className="promo-card">
            <div className="promo-header">
              <h3 className="promo-title">{prod.nombre_producto}</h3>
              <span className="promo-badge">OFERTA</span>
            </div>
            <p className="promo-store">
              <i className="fas fa-store"></i> {prod.locales?.nombre_local || "Local desconocido"}
            </p>
            <div className="promo-prices">
              <span className="promo-old-price">${prod.precio}</span>
              <span className="promo-new-price">${(prod.precio * 0.8).toFixed(2)}</span>
            </div>
            <button className="promo-btn">Ver oferta</button>
          </div>
        ))}
      </div>
    </div>
  );
}