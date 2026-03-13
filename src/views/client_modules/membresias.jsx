import React, { useState } from "react";

export default function MembresiasView() {
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [membresiaSeleccionada, setMembresiaSeleccionada] = useState(null);

  return (
    <div className="content-column">
      <div className="section-header-row">
        <div>
          <h2 style={{ fontWeight: "800", color: "var(--dark-gray)" }}>
            PLANES Y PAGOS
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Gestión de membresías para alumnos de MotoPro 360
          </p>
        </div>
      </div>

      <div className="membership-grid">
        <div className="membership-card">
          <h3 className="mem-title">Pro</h3>
          <div className="mem-price">
            $25<span>/mes</span>
          </div>
          <ul className="mem-features">
            <li>
              <span className="check-icon">✔</span> Acceso a Cursos Nivel 1
            </li>
            <li>
              <span className="check-icon">✔</span> Soporte Técnico
            </li>
          </ul>
          <button
            className="btn-cancel"
            style={{ width: "100%", borderRadius: "50px" }}
            onClick={() => {
              setMembresiaSeleccionada({
                id: 1,
                nombre: "Básica",
                precio: 25,
              });
              setIsPagoModalOpen(true);
            }}
          >
            REGISTRAR PAGO
          </button>
        </div>

        {/* NIVEL 2 */}
        <div className="membership-card featured">
          <div
            className="badge badge-admin"
            style={{ position: "absolute", top: "20px", right: "20px" }}
          >
            RECOMENDADO
          </div>
          <h3 className="mem-title">Premium</h3>
          <div className="mem-price">
            $50<span>/mes</span>
          </div>
          <ul className="mem-features">
            <li>
              <span className="check-icon">✔</span> Acceso Total
            </li>
            <li>
              <span className="check-icon">✔</span> Asesoría VIP
            </li>
          </ul>
          <button
            className="btn-main-login"
            style={{ width: "100%", borderRadius: "50px" }}
            onClick={() => {
              setMembresiaSeleccionada({
                id: 2,
                nombre: "Premium",
                precio: 50,
              });
              setIsPagoModalOpen(true);
            }}
          >
            REGISTRAR PAGO
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
              onSubmit={(e) => {
                e.preventDefault();
                alert("Pago enviado a verificación.");
                setIsPagoModalOpen(false);
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
                  <option>Efectivo</option>
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
                  type="submit"
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
