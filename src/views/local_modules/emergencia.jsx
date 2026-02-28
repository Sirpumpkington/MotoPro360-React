import { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function Emergencia({ perfil }) {
  const [tipoEmergencia, setTipoEmergencia] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);
  const [mensajeEstado, setMensajeEstado] = useState({ type: "", text: "" });

  const opcionesEmergencia = [
    {
      value: "accidente",
      label: "Accidente de tránsito",
      icon: "🚑",
      desc: "Choque, volcadura o incidente vial",
      mensaje: "¡URGENTE! He tenido un accidente de tránsito. Necesito asistencia inmediata.",
    },
    {
      value: "mecanica",
      label: "Falla mecánica",
      icon: "🔧",
      desc: "Moto averiada, no puedo continuar",
      mensaje: "Mi moto ha sufrido una falla mecánica y estoy varado en la vía. Requiero ayuda.",
    },
    {
      value: "robo",
      label: "Robo o asalto",
      icon: "⚠️",
      desc: "Situación de inseguridad",
      mensaje: "He sido víctima de un robo/asalto. Necesito ayuda de las autoridades y asistencia.",
    },
    {
      value: "otro",
      label: "Otro tipo",
      icon: "📞",
      desc: "Emergencia no especificada",
      mensaje: "Tengo una emergencia vial diferente. Por favor contactarme lo antes posible.",
    },
  ];

  const obtenerUbicacion = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocalización no soportada");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUbicacion(coords);
          resolve(coords);
        },
        (err) => {
          reject("No se pudo obtener ubicación: " + err.message);
        }
      );
    });
  };

  const enviarWhatsApp = async () => {
    if (!tipoEmergencia) {
      setMensajeEstado({
        type: "error",
        text: "Por favor selecciona el tipo de emergencia.",
      });
      return;
    }

    setEnviando(true);
    setMensajeEstado({ type: "", text: "" });

    try {
      let ubicacionTexto = "";
      try {
        const coords = await obtenerUbicacion();
        ubicacionTexto = `\n📍 Ubicación: https://maps.google.com/?q=${coords.lat},${coords.lng}`;
      } catch (err) {
        ubicacionTexto = "\n📍 No se pudo obtener ubicación automática. Intenta compartirla manualmente.";
      }

      const opcion = opcionesEmergencia.find((o) => o.value === tipoEmergencia);
      const mensajePersonalizado = opcion?.mensaje || "Emergencia vial reportada.";

      const mensaje = `🚨 *EMERGENCIA VIAL* 🚨
Usuario: ${perfil?.nombres || "Usuario"} (${perfil?.cedula || "Sin cédula"})
Tipo: ${opcion?.label || tipoEmergencia}
${mensajePersonalizado}
${ubicacionTexto}
⏰ Fecha: ${new Date().toLocaleString()}`;

      // NÚMERO DE WHATSAPP (DEBES CONFIGURARLO)
      const numeroWhatsApp = ""; // Ejemplo: "584141234567"
      if (!numeroWhatsApp) {
        setMensajeEstado({
          type: "error",
          text: "⚠️ Configura el número de WhatsApp en el código (línea numeroWhatsApp).",
        });
        setEnviando(false);
        return;
      }

      const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, "_blank");
      setMensajeEstado({
        type: "success",
        text: "¡Mensaje enviado! Se abrió WhatsApp con la solicitud de auxilio.",
      });
    } catch (error) {
      setMensajeEstado({ type: "error", text: "Error: " + error.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="emergencia-wrapper">
      <div className="emergencia-header">
        <div className="emergencia-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h1>Emergencia Vial</h1>
        <p>Asistencia inmediata • 24/7</p>
      </div>

      <div className="emergencia-card">
        <div className="emergencia-content">
          <p className="emergencia-desc">
            En caso de accidente o emergencia en la vía, selecciona el tipo de situación y envía un mensaje de auxilio con tu ubicación actual.
          </p>

          <div className="emergencia-options">
            {opcionesEmergencia.map((op) => (
              <label
                key={op.value}
                className={`emergencia-option ${tipoEmergencia === op.value ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="tipoEmergencia"
                  value={op.value}
                  checked={tipoEmergencia === op.value}
                  onChange={(e) => setTipoEmergencia(e.target.value)}
                  disabled={enviando}
                />
                <span className="option-icon">{op.icon}</span>
                <div className="option-text">
                  <strong>{op.label}</strong>
                  <small>{op.desc}</small>
                </div>
              </label>
            ))}
          </div>

          {ubicacion && (
            <div className="ubicacion-exito">
              <i className="fas fa-map-marker-alt"></i>
              <span>Ubicación obtenida correctamente</span>
            </div>
          )}

          {mensajeEstado.text && (
            <div className={`mensaje-estado ${mensajeEstado.type}`}>
              <i className={`fas ${mensajeEstado.type === "error" ? "fa-exclamation-circle" : "fa-check-circle"}`}></i>
              <span>{mensajeEstado.text}</span>
            </div>
          )}

          <button
            className="btn-emergencia-principal"
            onClick={enviarWhatsApp}
            disabled={enviando || !tipoEmergencia}
          >
            {enviando ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Enviando...
              </>
            ) : (
              <>
                <i className="fab fa-whatsapp"></i> Enviar auxilio por WhatsApp
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}