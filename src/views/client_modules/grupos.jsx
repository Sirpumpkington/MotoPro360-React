import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";

export default function VistaGrupos() {
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [isModalSolicitudOpen, setIsModalSolicitudOpen] = useState(false);
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    nombre_grupo: "",
    zona: "",
    ruta_descripcion: "",
  });
  const [sending, setSending] = useState(false);

  const [gruposAprobados, setGruposAprobados] = useState([]);
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMsg, setNuevoMsg] = useState("");
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const canalRef = useRef(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("personas")
            .select("cedula, nombres, apellidos, telefono")
            .eq("id_auth", user.id)
            .single();
          if (!error) setPerfilUsuario(data);
        }
      } catch (err) {
        console.error("Error cargando perfil:", err);
      }
    };
    cargarPerfil();
    cargarGruposAprobados();
    // cleanup on unmount
    return () => {
      if (canalRef.current) supabase.removeChannel(canalRef.current);
    };
  }, []);

  const cargarGruposAprobados = async () => {
    try {
      const { data, error } = await supabase
        .from("comunidades")
        .select("*, personas(nombres, apellidos)")
        .eq("estado", "aprobado")
        .order("id_comunidad", { ascending: true });
      if (error) throw error;
      setGruposAprobados(data || []);
    } catch (err) {
      console.error("Error cargando grupos aprobados:", err);
    }
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    if (!perfilUsuario) {
      alert("Perfil no disponible. Intenta recargar la página.");
      return;
    }
    if (
      !nuevaSolicitud.nombre_grupo.trim() ||
      !nuevaSolicitud.zona.trim() ||
      !nuevaSolicitud.ruta_descripcion.trim()
    ) {
      alert("Completa todos los campos antes de enviar la solicitud.");
      return;
    }
    try {
      setSending(true);
      const { error } = await supabase.from("comunidades").insert([
        {
          nombre_grupo: nuevaSolicitud.nombre_grupo,
          zona: nuevaSolicitud.zona,
          ruta_descripcion: nuevaSolicitud.ruta_descripcion,
          cedula_creador: parseInt(perfilUsuario.cedula, 10),
          estado: "pendiente",
        },
      ]);
      if (error) throw error;
      alert(
        "Solicitud enviada. El admin revisará tus datos: " +
          perfilUsuario.cedula,
      );
      setIsModalSolicitudOpen(false);
      setNuevaSolicitud({ nombre_grupo: "", zona: "", ruta_descripcion: "" });
    } catch (err) {
      console.error("Error enviando solicitud:", err);
      alert("Error al enviar la solicitud: " + err.message);
    } finally {
      setSending(false);
    }
  };

  // Chat: carga mensajes y suscripción
  useEffect(() => {
    if (!grupoActivo) return;

    let isMounted = true;
    const cargarMensajes = async () => {
      try {
        setLoadingMensajes(true);
        const { data } = await supabase
          .from("mensajes_comunidad")
          .select(`*, personas(nombres)`)
          .eq("id_comunidad", grupoActivo.id_comunidad)
          .order("created_at", { ascending: true });
        if (isMounted) setMensajes(data || []);
      } catch (err) {
        console.error("Error cargando mensajes:", err);
      } finally {
        setLoadingMensajes(false);
      }
    };
    cargarMensajes();

    // Suscripción en tiempo real
    const canal = supabase
      .channel("chat-" + grupoActivo.id_comunidad)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes_comunidad",
          filter: `id_comunidad=eq.${grupoActivo.id_comunidad}`,
        },
        (payload) => {
          setMensajes((prev) => [...prev, payload.new]);
        },
      )
      .subscribe();
    canalRef.current = canal;

    return () => {
      isMounted = false;
      if (canalRef.current) supabase.removeChannel(canalRef.current);
      canalRef.current = null;
      setMensajes([]);
    };
  }, [grupoActivo]);

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMsg.trim() || !perfilUsuario || !grupoActivo) return;
    try {
      const { error } = await supabase.from("mensajes_comunidad").insert([
        {
          id_comunidad: grupoActivo.id_comunidad,
          cedula_autor: parseInt(perfilUsuario.cedula, 10),
          texto: nuevoMsg,
        },
      ]);
      if (error) throw error;
      setNuevoMsg("");
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      alert("No se pudo enviar el mensaje: " + err.message);
    }
  };

  return (
    <div className="content-column">
      <div className="section-header-row">
        <div>
          <h2 style={{ fontWeight: 800, color: "var(--dark-gray)" }}>Grupos</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Crea y únete a grupos de moteros en tu zona.
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button
            className="btn-main-login"
            onClick={() => setIsModalSolicitudOpen(true)}
          >
            Crear Grupo
          </button>
        </div>
      </div>

      {/* Modal creación */}
      {isModalSolicitudOpen && (
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
              maxWidth: 720,
              width: "100%",
              background: "var(--bg-light, #fff)",
              borderRadius: 12,
              padding: 18,
            }}
          >
            <h2 className="login-title">CREAR NUEVO GRUPO</h2>

            <div
              style={{
                padding: 15,
                background: "var(--bg-light)",
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <p style={{ fontSize: 13, margin: 0 }}>
                <strong>Responsable:</strong> {perfilUsuario?.nombres}{" "}
                {perfilUsuario?.apellidos}
              </p>
              <p style={{ fontSize: 13, margin: 0 }}>
                <strong>Cédula:</strong> {perfilUsuario?.cedula} {" | "}
                <strong>Tel:</strong> {perfilUsuario?.telefono}
              </p>
            </div>

            <form onSubmit={enviarSolicitud} className="content-column">
              <input
                type="text"
                placeholder="Nombre del Grupo de Moteros"
                className="login-input"
                required
                value={nuevaSolicitud.nombre_grupo}
                onChange={(e) =>
                  setNuevaSolicitud({
                    ...nuevaSolicitud,
                    nombre_grupo: e.target.value,
                  })
                }
                style={{ width: "100%" }}
              />
              <input
                type="text"
                placeholder="Zona (Ej: Petare, El Hatillo...)"
                className="login-input"
                required
                value={nuevaSolicitud.zona}
                onChange={(e) =>
                  setNuevaSolicitud({ ...nuevaSolicitud, zona: e.target.value })
                }
                style={{ width: "100%" }}
              />
              <textarea
                placeholder="Describe la ruta que suelen hacer..."
                className="login-input"
                style={{ minHeight: 100, width: "100%" }}
                required
                value={nuevaSolicitud.ruta_descripcion}
                onChange={(e) =>
                  setNuevaSolicitud({
                    ...nuevaSolicitud,
                    ruta_descripcion: e.target.value,
                  })
                }
              />

              <div
                className="modal-actions"
                style={{ display: "flex", gap: 12 }}
              >
                <button type="submit" className="btn-save" disabled={sending}>
                  {sending ? "Enviando..." : "ENVIAR PARA APROBACIÓN"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsModalSolicitudOpen(false)}
                >
                  CERRAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de grupos o chat */}
      {!grupoActivo ? (
        <div className="comunidad-lista">
          {gruposAprobados.length === 0 ? (
            <div className="empty-state">No hay grupos disponibles aún.</div>
          ) : (
            gruposAprobados.map((g) => (
              <div key={g.id_comunidad} className="comunidad-item">
                <div className="comunidad-info">
                  <h3 className="comunidad-nombre">{g.nombre_grupo}</h3>
                  <p className="comunidad-miembros">
                    {g.zona} - {g.ruta_descripcion}
                  </p>
                  <small style={{ color: "var(--text-muted)" }}>
                    Responsable: {g.personas?.nombres} {g.personas?.apellidos}
                  </small>
                </div>
                <button
                  className="comunidad-btn"
                  onClick={() => setGrupoActivo(g)}
                >
                  Entrar al Chat
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div
          className="chat-container glass-card"
          style={{ height: "70vh", display: "flex", flexDirection: "column" }}
        >
          <div
            className="chat-header"
            style={{
              padding: "15px",
              borderBottom: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <button
              onClick={() => setGrupoActivo(null)}
              className="btn-cancel"
              style={{ padding: "5px 10px" }}
            >
              ← Volver
            </button>
            <h3 style={{ margin: 0 }}>{grupoActivo.nombre_grupo}</h3>
          </div>

          <div
            className="chat-messages"
            style={{ flex: 1, overflowY: "auto", padding: "20px" }}
          >
            {loadingMensajes ? (
              <div> Cargando mensajes...</div>
            ) : mensajes.length === 0 ? (
              <div style={{ color: "var(--text-muted)" }}>
                No hay mensajes aún.
              </div>
            ) : (
              mensajes.map((m) => (
                <div
                  key={m.id_mensaje || Math.random()}
                  style={{
                    alignSelf:
                      m.cedula_autor === perfilUsuario?.cedula
                        ? "flex-end"
                        : "flex-start",
                    backgroundColor:
                      m.cedula_autor === perfilUsuario?.cedula
                        ? "var(--primary-red)"
                        : "#eee",
                    color:
                      m.cedula_autor === perfilUsuario?.cedula
                        ? "white"
                        : "black",
                    padding: "10px 15px",
                    borderRadius: "15px",
                    marginBottom: "10px",
                    maxWidth: "80%",
                  }}
                >
                  <small
                    style={{ display: "block", fontSize: "10px", opacity: 0.8 }}
                  >
                    {m.personas?.nombres || "Usuario"}
                  </small>
                  {m.texto}
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={enviarMensaje}
            style={{ padding: "15px", display: "flex", gap: "10px" }}
          >
            <input
              value={nuevoMsg}
              onChange={(e) => setNuevoMsg(e.target.value)}
              className="login-input"
              placeholder="Escribe un mensaje..."
            />
            <button type="submit" className="btn-save">
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
