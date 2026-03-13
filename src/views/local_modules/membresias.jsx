import React, { useState } from "react";

export default function MembresiasLocal({ localPerfil }) {
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [membresiaSeleccionada, setMembresiaSeleccionada] = useState(null);

  // Determinar membresía actual
  const membresiaActual = localPerfil?.nivel_membresia?.toLowerCase() || "gratis";

  return (
    <div className="content-column" style={{ padding: "2rem" }}>
      <div className="section-header-row" style={{ marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontWeight: "800", color: "var(--dark-gray)", fontSize: "2rem", marginBottom: "0.5rem" }}>
            PLANES PARA COMERCIANTES
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>
            Elige el plan que mejor se adapte a tu negocio y aumenta tus ventas.
          </p>
        </div>
      </div>

      <div style={{ background: "var(--bg-light)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--primary-red)", marginBottom: "2rem", display: "inline-block" }}>
        <h3 style={{ margin: 0, color: "var(--dark-gray)" }}>
          <i className="fas fa-id-card" style={{ color: "var(--primary-red)", marginRight: "8px" }}></i>
          Tu plan actual: <span style={{ color: "var(--primary-red)", textTransform: "capitalize" }}>{membresiaActual}</span>
        </h3>
      </div>

      <div className="membership-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        {/* GRATIS */}
        <div className="membership-card" style={{ background: "#fff", padding: "2rem", borderRadius: "16px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", border: "1px solid #eaeaea", display: "flex", flexDirection: "column" }}>
          <h3 className="mem-title" style={{ fontSize: "1.5rem", color: "var(--dark-gray)", marginBottom: "1rem" }}>Gratis</h3>
          <div className="mem-price" style={{ fontSize: "2.5rem", fontWeight: "800", color: "var(--primary-red)", marginBottom: "1.5rem" }}>
            $0<span>/mes</span>
          </div>
          <ul className="mem-features" style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: "2rem", flex: 1, color: "var(--text-muted)", lineHeight: "1.8" }}>
            <li><span className="check-icon" style={{ color: "var(--primary-red)", marginRight: "8px" }}>✔</span> Límite de 10 productos</li>
            <li><span className="check-icon" style={{ color: "var(--primary-red)", marginRight: "8px" }}>✔</span> Perfil de Local Básico</li>
            <li style={{ opacity: 0.5 }}><span className="check-icon" style={{ marginRight: "8px" }}>✖</span> Prioridad en Búsqueda</li>
          </ul>
          <button
            className="btn-cancel"
            style={{ width: "100%", borderRadius: "50px", padding: "12px", background: membresiaActual === "gratis" ? "#f0f0f0" : "transparent", color: membresiaActual === "gratis" ? "#999" : "var(--dark-gray)", border: "1px solid #ccc", cursor: membresiaActual === "gratis" ? "default" : "pointer" }}
            disabled={membresiaActual === "gratis"}
          >
            {membresiaActual === "gratis" ? "PLAN ACTUAL" : "SELECCIONAR"}
          </button>
        </div>

        {/* PRO */}
        <div className="membership-card" style={{ background: "#fff", padding: "2rem", borderRadius: "16px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", border: "1px solid #eaeaea", display: "flex", flexDirection: "column" }}>
          <h3 className="mem-title" style={{ fontSize: "1.5rem", color: "var(--dark-gray)", marginBottom: "1rem" }}>Pro</h3>
          <div className="mem-price" style={{ fontSize: "2.5rem", fontWeight: "800", color: "var(--primary-red)", marginBottom: "1.5rem" }}>
            $25<span>/mes</span>
          </div>
          <ul className="mem-features" style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: "2rem", flex: 1, color: "var(--text-muted)", lineHeight: "1.8" }}>
            <li><span className="check-icon" style={{ color: "var(--primary-red)", marginRight: "8px" }}>✔</span> Límite de 20 productos</li>
            <li><span className="check-icon" style={{ color: "var(--primary-red)", marginRight: "8px" }}>✔</span> Prioridad en Búsqueda</li>
            <li><span className="check-icon" style={{ color: "var(--primary-red)", marginRight: "8px" }}>✔</span> Soporte Técnico</li>
          </ul>
          <button
            className="btn-main-login"
            style={{ width: "100%", borderRadius: "50px", padding: "12px", background: membresiaActual === "pro" ? "#f0f0f0" : "var(--primary-red)", color: membresiaActual === "pro" ? "#999" : "#fff", border: "none", cursor: membresiaActual === "pro" ? "default" : "pointer", fontWeight: "bold" }}
            onClick={() => {
              if (membresiaActual !== "pro") {
                setMembresiaSeleccionada({ id: 1, nombre: "Plan Pro", precio: 25 });
                setIsPagoModalOpen(true);
              }
            }}
            disabled={membresiaActual === "pro"}
          >
            {membresiaActual === "pro" ? "PLAN ACTUAL" : "MEJORAR A PRO"}
          </button>
        </div>

        {/* PREMIUM */}
        <div className="membership-card featured" style={{ background: "#fff", padding: "2rem", borderRadius: "16px", boxShadow: "0 10px 20px rgba(220,38,38,0.15)", border: "2px solid var(--primary-red)", display: "flex", flexDirection: "column", position: "relative" }}>
          <div className="badge badge-admin" style={{ position: "absolute", top: "-12px", right: "20px", background: "var(--primary-red)", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
            RECOMENDADO
          </div>
          <h3 className="mem-title" style={{ fontSize: "1.5rem", color: "var(--dark-gray)", marginBottom: "1rem" }}>Premium</h3>
          <div className="mem-price" style={{ fontSize: "2.5rem", fontWeight: "800", color: "var(--primary-red)", marginBottom: "1.5rem" }}>
            $50<span>/mes</span>
          </div>
          <ul className="mem-features" style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: "2rem", flex: 1, color: "var(--text-muted)", lineHeight: "1.8" }}>
            <li><span className="check-icon" style={{ color: "var(--primary-red)", marginRight: "8px" }}>✔</span> <strong>Sin límite</strong> de productos</li>
            <li><span className="check-icon" style={{ color: "var(--primary-red)", marginRight: "8px" }}>✔</span> Máxima Prioridad de Búsqueda</li>
            <li><span className="check-icon" style={{ color: "var(--primary-red)", marginRight: "8px" }}>✔</span> Asesoría VIP / Destacados</li>
          </ul>
          <button
            className="btn-main-login"
            style={{ width: "100%", borderRadius: "50px", padding: "12px", background: membresiaActual === "premium" ? "#f0f0f0" : "var(--primary-red)", color: membresiaActual === "premium" ? "#999" : "#fff", border: "none", cursor: membresiaActual === "premium" ? "default" : "pointer", fontWeight: "bold" }}
            onClick={() => {
              if (membresiaActual !== "premium") {
                setMembresiaSeleccionada({ id: 2, nombre: "Plan Premium", precio: 50 });
                setIsPagoModalOpen(true);
              }
            }}
            disabled={membresiaActual === "premium"}
          >
             {membresiaActual === "premium" ? "PLAN ACTUAL" : "MEJORAR A PREMIUM"}
          </button>
        </div>
      </div>

      {isPagoModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            zIndex: 1100,
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: "450px",
              width: "100%",
              background: "var(--card-bg, #2a2a2a)",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              padding: "24px",
            }}
          >
            <h2 className="login-title" style={{ textAlign: "center", marginBottom: "1rem" }}>NUEVO PAGO</h2>
            <div
              style={{
                backgroundColor: "var(--card-bg, rgba(0,0,0,0.1))",
                padding: "15px",
                borderRadius: "12px",
                marginBottom: "20px",
                textAlign: "center",
                border: "1px dashed var(--border-color)"
              }}
            >
              <h3 style={{ margin: "5px 0", color: "var(--primary-red)" }}>
                {membresiaSeleccionada?.nombre}
              </h3>
              <p style={{ fontWeight: "800", fontSize: "1.2rem" }}>
                Monto: ${membresiaSeleccionada?.precio}
              </p>
            </div>

            <form
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <input
                type="text"
                placeholder="Ingrese su correo"
                className="login-input"
                required
                style={{ width: "100%", padding: "12px", borderRadius: "8px" }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <select
                  className="login-input"
                  style={{ flex: 1, width: "100%", padding: "12px", borderRadius: "8px" }}
                >
                  <option>Zelle</option>
                  <option>Transferencia</option>
                  <option>Pago Móvil</option>
                </select>
                <input
                  type="text"
                  placeholder="Referencia"
                  className="login-input"
                  style={{ flex: 2, width: "100%", padding: "12px", borderRadius: "8px" }}
                  required
                />
              </div>
              <div className="modal-actions" style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    alert("Pago enviado a verificación. Pronto actualizaremos su membresía.");
                    setIsPagoModalOpen(false);
                  }}
                  style={{ flex: 1, padding: "12px", background: "var(--primary-red)", color: "#fff", border: "none", borderRadius: "50px", fontWeight: "bold", cursor: "pointer" }}
                >
                  CONFIRMAR
                </button>
                <button
                  type="button"
                  style={{ flex: 1, padding: "12px", background: "transparent", color: "inherit", border: "1px solid var(--border-color)", borderRadius: "50px", fontWeight: "bold", cursor: "pointer" }}
                  onClick={() => setIsPagoModalOpen(false)}
                >
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
