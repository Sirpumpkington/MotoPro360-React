import React, { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function MembresiasView({ perfil }) {
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [membresiaSeleccionada, setMembresiaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    metodo_pago: "Pago Móvil",
    nro_referencia: "",
    url_comprobante: "", // Mock para el futuro bucket
    meses: 1, // Cantidad de meses a pagar
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Asegurar que meses sea un número si viene de ese campo
    const finalValue = name === "meses" ? parseInt(value) || 1 : value;
    setPaymentData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!perfil?.cedula) {
      alert("Error: No se encontró la cédula del usuario.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("pagos").insert([
        {
          cedula_persona: perfil.cedula,
          id_membresia: membresiaSeleccionada.id,
          monto: membresiaSeleccionada.precio * paymentData.meses,
          metodo_pago: paymentData.metodo_pago,
          nro_referencia: paymentData.nro_referencia,
          url_comprobante: paymentData.url_comprobante || null,
          estado: "pendiente",
        },
      ]);

      if (error) throw error;

      alert("¡Pago registrado con éxito! Un administrador lo revisará pronto.");
      setIsPagoModalOpen(false);
      setPaymentData({ metodo_pago: "Pago Móvil", nro_referencia: "", url_comprobante: "", meses: 1 });
    } catch (error) {
      alert(" Error al registrar el pago: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-column fade-in">
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
                nombre: "Pro",
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
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1100,
            padding: "20px",
          }}
        >
          <div
            className="modal-content glass-card"
            style={{
              maxWidth: "450px",
              width: "100%",
              padding: "30px",
              position: "relative",
            }}
          >
            <h2 className="login-title" style={{ textAlign: "center", marginBottom: "1rem" }}>
              REPORTE DE PAGO
            </h2>
            
            <div
              style={{
                backgroundColor: "rgba(229, 9, 20, 0.05)",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "25px",
                textAlign: "center",
                border: "1px dashed var(--primary-red)"
              }}
            >
              <h3 style={{ margin: "5px 0", color: "var(--primary-red)", fontSize: "1.4rem" }}>
                Plan {membresiaSeleccionada?.nombre}
              </h3>
              <p style={{ fontWeight: "800", fontSize: "1.8rem", margin: "10px 0" }}>
                ${membresiaSeleccionada?.precio * paymentData.meses}
              </p>
              {paymentData.meses > 1 && (
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "5px" }}>
                  (${membresiaSeleccionada?.precio} x {paymentData.meses} meses)
                </p>
              )}
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                 Cédula: {perfil?.cedula}
              </p>
            </div>

            <form
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
              onSubmit={handleSubmit}
            >
              <div className="input-group">
                <i className="fas fa-wallet icon-field"></i>
                <select
                  name="metodo_pago"
                  className="login-input"
                  value={paymentData.metodo_pago}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Efectivo">Efectivo</option>
                </select>
              </div>

              <div className="input-group">
                <i className="fas fa-calendar-alt icon-field"></i>
                <select
                  name="meses"
                  className="login-input"
                  value={paymentData.meses}
                  onChange={handleInputChange}
                  required
                >
                  <option value="1">1 Mes</option>
                  <option value="3">3 Meses</option>
                  <option value="6">6 Meses</option>
                  <option value="12">12 Meses</option>
                </select>
              </div>

              <div className="input-group">
                <i className="fas fa-hashtag icon-field"></i>
                <input
                  type="text"
                  name="nro_referencia"
                  placeholder="Número de Referencia"
                  className="login-input"
                  value={paymentData.nro_referencia}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="input-group">
                <i className="fas fa-file-upload icon-field"></i>
                <input
                  type="text"
                  name="url_comprobante"
                  placeholder="URL del Comprobante (Simulado)"
                  className="login-input"
                  value={paymentData.url_comprobante}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-actions" style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-main-login"
                  style={{ flex: 1, minWidth: "160px", height: "45px", borderRadius: "50px", padding: "0 15px", display: "flex", justifyContent: "center", alignItems: "center" }}
                >
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : "CONFIRMAR PAGO"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  className="btn-cancel"
                  style={{ flex: 1, height: "45px", borderRadius: "50px" }}
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
