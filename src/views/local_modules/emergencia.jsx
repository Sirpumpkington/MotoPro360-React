import { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function Emergencia({ perfil }) {
  const [tipoEmergencia, setTipoEmergencia] = useState("");
  const [subTipoMecanica, setSubTipoMecanica] = useState("");
  const [otroTexto, setOtroTexto] = useState(""); // <-- nuevo estado
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
      // El mensaje se construirá según la subopción
    },
    {
      value: "otro",
      label: "Otro tipo",
      icon: "📞",
      desc: "Describe tu emergencia",
      // No tiene mensaje fijo, se usará el texto ingresado
    },
  ];

  // Subopciones para falla mecánica
  const subOpcionesMecanica = [
    {
      value: "no_arranca",
      label: "Motor no arranca",
      desc: "El motor no enciende o no tiene chispa",
      mensaje: "Mi moto no arranca. He intentado encenderla varias veces sin éxito. Necesito asistencia mecánica.",
    },
    {
      value: "electrico",
      label: "Falla en el sistema eléctrico",
      desc: "Luces, tablero o batería sin funcionar",
      mensaje: "Tengo una falla eléctrica: las luces no encienden o el tablero no funciona. Requiero ayuda.",
    },
    {
      value: "transmision",
      label: "Problemas con la transmisión",
      desc: "Cadena, embrague o caja de cambios",
      mensaje: "La transmisión de mi moto falla: la cadena se ha saltado, el embrague no responde o la caja de cambios tiene problemas. Necesito asistencia.",
    },
    {
      value: "frenos",
      label: "Frenos no responden",
      desc: "Frenos delanteros o traseros inoperativos",
      mensaje: "¡URGENTE! Los frenos de mi moto no responden correctamente. Es una situación peligrosa. Necesito ayuda inmediata.",
    },
    {
      value: "sobrecalentamiento",
      label: "Sobrecalentamiento del motor",
      desc: "Motor se calienta demasiado",
      mensaje: "El motor de mi moto se está sobrecalentando. He tenido que detenerme. Requiero asistencia mecánica.",
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

    // Validaciones específicas
    if (tipoEmergencia === "mecanica" && !subTipoMecanica) {
      setMensajeEstado({
        type: "error",
        text: "Por favor selecciona el tipo de falla mecánica.",
      });
      return;
    }
    if (tipoEmergencia === "otro" && !otroTexto.trim()) {
      setMensajeEstado({
        type: "error",
        text: "Por favor describe tu emergencia.",
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

      let mensajePersonalizado = "";
      let opcionLabel = "";

      if (tipoEmergencia === "mecanica") {
        const sub = subOpcionesMecanica.find(s => s.value === subTipoMecanica);
        mensajePersonalizado = sub?.mensaje || "Tengo una falla mecánica y necesito ayuda.";
        opcionLabel = sub?.label || "Falla mecánica";
      } else if (tipoEmergencia === "otro") {
        mensajePersonalizado = otroTexto.trim();
        opcionLabel = "Otro tipo de emergencia";
      } else {
        const opcion = opcionesEmergencia.find(o => o.value === tipoEmergencia);
        mensajePersonalizado = opcion?.mensaje || "Emergencia vial reportada.";
        opcionLabel = opcion?.label || "Emergencia";
      }

      const mensaje = `🚨 *EMERGENCIA VIAL* 🚨
Usuario: ${perfil?.nombres || "Usuario"} (${perfil?.cedula || "Sin cédula"})
Tipo: ${opcionLabel}
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
                  onChange={(e) => {
                    setTipoEmergencia(e.target.value);
                    // Resetear subtipos si cambia
                    if (e.target.value !== "mecanica") setSubTipoMecanica("");
                    if (e.target.value !== "otro") setOtroTexto("");
                  }}
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

          {/* Subopciones de falla mecánica */}
          {tipoEmergencia === "mecanica" && (
            <div className="subopciones-container">
              <p className="subopciones-titulo">Selecciona el tipo de falla:</p>
              <div className="subopciones-grid">
                {subOpcionesMecanica.map((sub) => (
                  <button
                    key={sub.value}
                    className={`subopcion-btn ${subTipoMecanica === sub.value ? "active" : ""}`}
                    onClick={() => setSubTipoMecanica(sub.value)}
                    disabled={enviando}
                  >
                    <span className="subopcion-icon">🔧</span>
                    <div className="subopcion-texto">
                      <strong>{sub.label}</strong>
                      <small>{sub.desc}</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Campo de texto para "Otro tipo" */}
          {tipoEmergencia === "otro" && (
            <div className="otro-container">
              <p className="otro-titulo">Describe tu emergencia:</p>
              <textarea
                className="otro-textarea"
                placeholder="Ej: Me quedé sin gasolina, necesito que me traigan..."
                value={otroTexto}
                onChange={(e) => setOtroTexto(e.target.value)}
                disabled={enviando}
                rows={4}
              />
            </div>
          )}

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
            disabled={enviando || !tipoEmergencia || (tipoEmergencia === "mecanica" && !subTipoMecanica) || (tipoEmergencia === "otro" && !otroTexto.trim())}
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