import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "../assets/css/asistenteia.css";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);

export default function AsistenteIA() {
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [chat, setChat] = useState([
    {
      role: "bot",
      text: "¡Hola! Soy tu asistente de MotoPro 360. ¿En qué puedo ayudarte hoy?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const enviarPregunta = async () => {
    if (!mensaje.trim()) return;

    const nuevaPregunta = { role: "user", text: mensaje };
    setChat([...chat, nuevaPregunta]);
    setMensaje("");
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
      });
      const prompt = `Eres el asistente experto de MotoPro 360. Responde de forma amable y concisa sobre temas de motos, mecánica básica o uso de la app. Pregunta: ${mensaje}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;

      setChat((prev) => [...prev, { role: "bot", text: response.text() }]);
    } catch (error) {
      setChat((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Lo siento, tuve un pequeño corto circuito. Intenta de nuevo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-wrapper">
      {/* Burbuja Flotante */}
      <button className="chat-bubble" onClick={() => setIsOpen(!isOpen)}>
        <i className={isOpen ? "fas fa-times" : "fas fa-robot"}></i>
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="chat-window fade-in">
          <div className="chat-header">
            <h3>MotoPro AI</h3>
          </div>
          <div className="chat-body">
            {chat.map((msg, i) => (
              <div key={i} className={`msg ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {loading && <div className="msg bot">Escribiendo...</div>}
          </div>
          <div className="chat-footer">
            <input
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && enviarPregunta()}
              placeholder="Escribe tu duda..."
            />
            <button onClick={enviarPregunta}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
