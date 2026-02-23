import { useState } from "react";
import "../assets/css/modal.css";

const EmergencyModal = ({ isOpen, onClose, perfil }) => {
  const [tipoEmergencia, setTipoEmergencia] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);

  // Opciones reducidas con mensajes personalizados
  const opcionesEmergencia = [
    {
      value: "accidente",
      label: "🚑 Accidente de tránsito",
      mensaje:
        "¡URGENTE! He tenido un accidente de tránsito. Necesito asistencia inmediata.",
    },
    {
      value: "mecanica",
      label: "🔧 Falla mecánica",
      mensaje:
        "Mi moto ha sufrido una falla mecánica y estoy varado en la vía. Requiero ayuda.",
    },
    {
      value: "robo",
      label: "⚠️ Robo o asalto",
      mensaje:
        "He sido víctima de un robo/asalto. Necesito ayuda de las autoridades y asistencia.",
    },
    {
      value: "otro",
      label: "📞 Otro (llamada)",
      mensaje:
        "Tengo una emergencia vial diferente. Por favor contactarme lo antes posible.",
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
        },
      );
    });
  };

  const enviarWhatsApp = async () => {
    if (!tipoEmergencia) {
      alert("Por favor selecciona el tipo de emergencia.");
      return;
    }

    setEnviando(true);
    try {
      let ubicacionTexto = "";
      try {
        const coords = await obtenerUbicacion();
        ubicacionTexto = `\n📍 Ubicación: https://maps.google.com/?q=${coords.lat},${coords.lng}`;
      } catch (err) {
        console.warn("Error obteniendo ubicación:", err);
        ubicacionTexto = "\n📍 No se pudo obtener ubicación automática.";
      }

      // Obtener el mensaje personalizado según la opción seleccionada
      const opcion = opcionesEmergencia.find((o) => o.value === tipoEmergencia);
      const mensajePersonalizado =
        opcion?.mensaje || "Emergencia vial reportada.";

      // Construir mensaje completo
      const mensaje = `🚨 *EMERGENCIA VIAL* 🚨
Usuario: ${perfil?.nombres || "Usuario"} (${perfil?.cedula || "Sin cédula"})
Tipo: ${opcion?.label || tipoEmergencia}
${mensajePersonalizado}
${ubicacionTexto}
⏰ Fecha: ${new Date().toLocaleString()}`;

      const numeroWhatsApp = ""; // Déjalo vacío, tú lo completas después
      const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

      if (!numeroWhatsApp) {
        alert(
          "⚠️ Configura el número de WhatsApp en el código (línea numeroWhatsApp).",
        );
      } else {
        window.open(url, "_blank");
      }
      onClose();
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="emergency-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <div className="emergency-header" style={{ justifyContent: "center" }}>
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Emergencia Vial</h2>
        </div>

        <div className="emergency-content" style={{ textAlign: "center" }}>
          <p className="emergency-text" style={{ textAlign: "center" }}>
            Selecciona el tipo de emergencia y presiona el botón para enviar un
            mensaje de auxilio con tu ubicación actual.
          </p>

          <div className="form-group" style={{ textAlign: "left" }}>
            <label
              style={{
                display: "block",
                textAlign: "center",
                marginBottom: "10px",
              }}
            >
              Tipo de emergencia:
            </label>
            <select
              value={tipoEmergencia}
              onChange={(e) => setTipoEmergencia(e.target.value)}
              disabled={enviando}
              style={{ width: "100%", padding: "12px", borderRadius: "8px" }}
            >
              <option value="">Selecciona una opción</option>
              {opcionesEmergencia.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {ubicacion && (
            <div
              className="ubicacion-info"
              style={{ justifyContent: "center" }}
            >
              <i className="fas fa-map-marker-alt"></i> Ubicación obtenida
            </div>
          )}
        </div>

        <div className="emergency-actions" style={{ justifyContent: "center" }}>
          <button
            className="btn-emergency"
            onClick={enviarWhatsApp}
            disabled={enviando || !tipoEmergencia}
            style={{ minWidth: "200px" }}
          >
            {enviando ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Enviando...
              </>
            ) : (
              <>
                <i className="fab fa-whatsapp"></i> Enviar auxilio
              </>
            )}
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal;
