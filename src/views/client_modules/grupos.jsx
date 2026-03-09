import React, { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "../../supabaseClient";

const ZONAS = [
  "Caracas - Este",
  "Caracas - Oeste",
  "Miranda - Los Teques",
  "Miranda - Guarenas",
  "La Guaira - Maiquetía",
  "Aragua - Maracay",
  "Carabobo - Valencia",
  "Lara - Barquisimeto",
  "Zulia - Maracaibo",
  "Táchira - San Cristóbal",
  "Bolívar - Ciudad Guayana",
  "Mérida - Mérida",
  "Nueva Esparta - Porlamar"
];

export default function VistaGrupos() {
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [isModalSolicitudOpen, setIsModalSolicitudOpen] = useState(false);
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    nombre_grupo: "",
    zona: "",
    ruta_descripcion: ""
  });
  const [errores, setErrores] = useState({});
  const [sending, setSending] = useState(false);

  const [gruposAprobados, setGruposAprobados] = useState([]);
  const [misGruposPendientes, setMisGruposPendientes] = useState([]);
  const [misGruposAprobados, setMisGruposAprobados] = useState([]);
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMsg, setNuevoMsg] = useState("");
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const canalRef = useRef(null);

  // Cargar perfil al inicio
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
  }, []);

  // Cargar grupos cuando perfilUsuario cambia
  useEffect(() => {
    if (perfilUsuario) {
      cargarGrupos();
    }
    return () => {
      if (canalRef.current) supabase.removeChannel(canalRef.current);
    };
  }, [perfilUsuario]);

  const cargarGrupos = async () => {
    try {
      // Todos los grupos aprobados (con datos del creador)
      const { data: aprobados, error: err1 } = await supabase
        .from("comunidades")
        .select("*, personas!inner(nombres, apellidos)")
        .eq("estado", "aprobado")
        .order("id_comunidad", { ascending: true });
      if (err1) throw err1;
      setGruposAprobados(aprobados || []);

      // Grupos pendientes del usuario actual
      if (perfilUsuario) {
        const cedula = parseInt(perfilUsuario.cedula, 10);
        const { data: pendientes, error: err2 } = await supabase
          .from("comunidades")
          .select("*, personas!inner(nombres, apellidos)")
          .eq("cedula_creador", cedula)
          .eq("estado", "pendiente")
          .order("created_at", { ascending: false });
        if (!err2) setMisGruposPendientes(pendientes || []);

        // Grupos aprobados del usuario actual
        const { data: misAprobados, error: err3 } = await supabase
          .from("comunidades")
          .select("*, personas!inner(nombres, apellidos)")
          .eq("cedula_creador", cedula)
          .eq("estado", "aprobado")
          .order("id_comunidad", { ascending: true });
        if (!err3) setMisGruposAprobados(misAprobados || []);
      }
    } catch (err) {
      console.error("Error cargando grupos:", err);
    }
  };

  // Validaciones
  const validarCampo = (nombre, valor) => {
    if (nombre === "nombre_grupo") {
      return valor.trim() === "" ? "El nombre del grupo es obligatorio." : "";
    }
    if (nombre === "zona") {
      return valor === "" ? "Debes seleccionar una zona." : "";
    }
    if (nombre === "ruta_descripcion") {
      return valor.trim() === "" ? "La descripción de la ruta es obligatoria." : "";
    }
    return "";
  };

  const esFormularioValido = useMemo(() => {
    return (
      nuevaSolicitud.nombre_grupo.trim() !== "" &&
      nuevaSolicitud.zona !== "" &&
      nuevaSolicitud.ruta_descripcion.trim() !== ""
    );
  }, [nuevaSolicitud]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevaSolicitud(prev => ({ ...prev, [name]: value }));
    const error = validarCampo(name, value);
    setErrores(prev => ({ ...prev, [name]: error }));
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    if (!perfilUsuario) {
      alert("Perfil no disponible. Intenta recargar la página.");
      return;
    }

    // Validar todos los campos
    const nuevosErrores = {
      nombre_grupo: validarCampo("nombre_grupo", nuevaSolicitud.nombre_grupo),
      zona: validarCampo("zona", nuevaSolicitud.zona),
      ruta_descripcion: validarCampo("ruta_descripcion", nuevaSolicitud.ruta_descripcion)
    };
    setErrores(nuevosErrores);
    if (Object.values(nuevosErrores).some(e => e !== "")) return;

    // Verificar que no tenga ya una solicitud pendiente
    if (misGruposPendientes.length > 0) {
      alert("Ya tienes una solicitud pendiente. Espera a que sea revisada antes de crear otra.");
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
          estado: "pendiente"
        }
      ]);

      if (error) throw error;

      alert("✅ Solicitud enviada. El administrador la revisará pronto.");

      setIsModalSolicitudOpen(false);
      setNuevaSolicitud({ nombre_grupo: "", zona: "", ruta_descripcion: "" });
      setErrores({});
      cargarGrupos();
    } catch (err) {
      console.error("Error enviando solicitud:", err);
      alert("❌ Error al enviar la solicitud: " + err.message);
    } finally {
      setSending(false);
    }
  };

  // Eliminar grupo propio (solo si es el creador)
  const eliminarGrupoPropio = async (id, estado) => {
    if (!perfilUsuario) return;
    const confirmacion = window.confirm("¿Estás seguro de eliminar este grupo? Esta acción no se puede deshacer.");
    if (!confirmacion) return;

    try {
      const { error } = await supabase
        .from("comunidades")
        .delete()
        .eq("id_comunidad", id)
        .eq("cedula_creador", parseInt(perfilUsuario.cedula, 10)); // Seguridad extra

      if (error) throw error;
      alert("Grupo eliminado correctamente.");
      cargarGrupos();
    } catch (err) {
      console.error("Error eliminando grupo:", err);
      alert("No se pudo eliminar el grupo: " + err.message);
    }
  };

  // Chat (sin cambios)
  useEffect(() => {
    if (!grupoActivo) return;
    let isMounted = true;
    const cargarMensajes = async () => {
      try {
        setLoadingMensajes(true);
        const { data } = await supabase
          .from("mensajes_comunidad")
          .select(`*, personas(nombres, apellidos)`)
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
        }
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

  const getInitials = (nombre, apellido) => {
    return (nombre?.charAt(0) || '') + (apellido?.charAt(0) || '');
  };

  // Función para determinar si un grupo es del usuario actual
  const esMiGrupo = (grupo) => {
    return perfilUsuario && grupo.cedula_creador === parseInt(perfilUsuario.cedula, 10);
  };

  return (
    <div className="grupos-container">
      <div className="grupos-header">
        <div>
          <h2 className="grupos-title">Comunidad de Moteros</h2>
          <p className="grupos-subtitle">Únete a grupos, crea el tuyo y comparte rutas</p>
        </div>
        <button
          className="grupos-create-btn"
          onClick={() => setIsModalSolicitudOpen(true)}
          disabled={misGruposPendientes.length > 0} // No puede crear si ya tiene una pendiente
        >
          <i className="fas fa-plus"></i> Crear Grupo
        </button>
      </div>

      {/* Modal de creación (igual que antes, sin cambios) */}
      {isModalSolicitudOpen && (
        <div className="modal-overlay" onClick={() => setIsModalSolicitudOpen(false)}>
          <div className="modal-content-grupo" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalSolicitudOpen(false)}>×</button>
            <div className="modal-header-grupo">
              <i className="fas fa-users modal-icon"></i>
              <h2 className="modal-title">Crear nuevo grupo</h2>
              <p className="modal-subtitle">Completa los datos para solicitar la creación de tu grupo</p>
            </div>
            <div className="creador-info-card">
              <div className="creador-avatar"><i className="fas fa-user-circle"></i></div>
              <div className="creador-datos">
                <p className="creador-nombre">{perfilUsuario?.nombres} {perfilUsuario?.apellidos}</p>
                <p className="creador-detalle"><i className="fas fa-id-card"></i> {perfilUsuario?.cedula} | <i className="fas fa-phone"></i> {perfilUsuario?.telefono}</p>
              </div>
            </div>
            <form onSubmit={enviarSolicitud} className="grupo-form" noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label><i className="fas fa-tag"></i> Nombre del grupo *</label>
                  <input
                    type="text"
                    name="nombre_grupo"
                    placeholder="Ej: Moteros de la Cota Mil"
                    value={nuevaSolicitud.nombre_grupo}
                    onChange={handleChange}
                    className={errores.nombre_grupo ? "error" : ""}
                  />
                  {errores.nombre_grupo && <span className="error-message">{errores.nombre_grupo}</span>}
                </div>
                <div className="form-group">
                  <label><i className="fas fa-map-marker-alt"></i> Zona *</label>
                  <select
                    name="zona"
                    value={nuevaSolicitud.zona}
                    onChange={handleChange}
                    className={errores.zona ? "error" : ""}
                  >
                    <option value="">Selecciona una zona</option>
                    {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                  {errores.zona && <span className="error-message">{errores.zona}</span>}
                </div>
              </div>
              <div className="form-group">
                <label><i className="fas fa-road"></i> Descripción de la ruta *</label>
                <textarea
                  name="ruta_descripcion"
                  placeholder="Describe la ruta que suelen hacer o el punto de encuentro"
                  value={nuevaSolicitud.ruta_descripcion}
                  onChange={handleChange}
                  rows="3"
                  className={errores.ruta_descripcion ? "error" : ""}
                />
                {errores.ruta_descripcion && <span className="error-message">{errores.ruta_descripcion}</span>}
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={sending || !esFormularioValido}>
                  {sending ? <><i className="fas fa-spinner fa-spin"></i> Enviando...</> : "Enviar solicitud"}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setIsModalSolicitudOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de grupos */}
      {!grupoActivo ? (
        <div className="grupos-grid">
          {/* Mis solicitudes pendientes */}
          {misGruposPendientes.length > 0 && (
            <div className="grupos-seccion">
              <h3 className="seccion-titulo">Tus solicitudes pendientes</h3>
              <div className="grupos-lista">
                {misGruposPendientes.map((g) => (
                  <div key={g.id_comunidad} className="grupo-card pendiente">
                    <div className="grupo-img">
                      <i className="fas fa-users"></i>
                    </div>
                    <div className="grupo-info">
                      <h4>{g.nombre_grupo} <span className="grupo-badge">Pendiente</span></h4>
                      <p className="grupo-zona"><i className="fas fa-map-marker-alt"></i> {g.zona}</p>
                      <p className="grupo-desc">{g.ruta_descripcion.substring(0, 60)}...</p>
                    </div>
                    <button
                      className="grupo-delete-btn"
                      onClick={() => eliminarGrupoPropio(g.id_comunidad, g.estado)}
                      title="Eliminar mi solicitud"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mis grupos aprobados (destacados) */}
          {misGruposAprobados.length > 0 && (
            <div className="grupos-seccion">
              <h3 className="seccion-titulo">Tus grupos activos</h3>
              <div className="grupos-lista">
                {misGruposAprobados.map((g) => (
                  <div key={g.id_comunidad} className="grupo-card propio">
                    <div className="grupo-img">
                      <i className="fas fa-motorcycle"></i>
                    </div>
                    <div className="grupo-info">
                      <h4>{g.nombre_grupo} <span className="grupo-badge propio">Mi grupo</span></h4>
                      <p className="grupo-zona"><i className="fas fa-map-marker-alt"></i> {g.zona}</p>
                      <p className="grupo-desc">{g.ruta_descripcion.substring(0, 60)}...</p>
                      <div className="grupo-meta">
                        <span className="grupo-responsable">
                          <i className="fas fa-user"></i> {g.personas?.nombres} {g.personas?.apellidos}
                        </span>
                      </div>
                    </div>
                    <div className="grupo-actions">
                      <button className="grupo-btn" onClick={() => setGrupoActivo(g)}>
                        Entrar al chat <i className="fas fa-arrow-right"></i>
                      </button>
                      <button
                        className="grupo-delete-btn"
                        onClick={() => eliminarGrupoPropio(g.id_comunidad, g.estado)}
                        title="Eliminar mi grupo"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grupos de otros usuarios */}
          <div className="grupos-seccion">
            <h3 className="seccion-titulo">Otros grupos activos</h3>
            {gruposAprobados.filter(g => !esMiGrupo(g)).length === 0 ? (
              <div className="empty-state">No hay otros grupos disponibles aún.</div>
            ) : (
              <div className="grupos-lista">
                {gruposAprobados.filter(g => !esMiGrupo(g)).map((g) => (
                  <div key={g.id_comunidad} className="grupo-card">
                    <div className="grupo-img">
                      <i className="fas fa-motorcycle"></i>
                    </div>
                    <div className="grupo-info">
                      <h4>{g.nombre_grupo}</h4>
                      <p className="grupo-zona"><i className="fas fa-map-marker-alt"></i> {g.zona}</p>
                      <p className="grupo-desc">{g.ruta_descripcion.substring(0, 80)}...</p>
                      <div className="grupo-meta">
                        <span className="grupo-responsable">
                          <i className="fas fa-user"></i> {g.personas?.nombres} {g.personas?.apellidos}
                        </span>
                      </div>
                    </div>
                    <button className="grupo-btn" onClick={() => setGrupoActivo(g)}>
                      Entrar al chat <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Chat (sin cambios)
        <div className="chat-container">
          <div className="chat-header">
            <button className="chat-back" onClick={() => setGrupoActivo(null)}>
              <i className="fas fa-arrow-left"></i> Volver
            </button>
            <div className="chat-info">
              <h3>{grupoActivo.nombre_grupo}</h3>
              <span>{grupoActivo.zona}</span>
            </div>
          </div>

          <div className="chat-messages">
            {loadingMensajes ? (
              <div className="chat-loading">Cargando mensajes...</div>
            ) : mensajes.length === 0 ? (
              <div className="chat-empty">No hay mensajes aún. ¡Sé el primero en escribir!</div>
            ) : (
              mensajes.map((m) => {
                const esMio = m.cedula_autor === parseInt(perfilUsuario?.cedula, 10);
                return (
                  <div key={m.id_mensaje || Math.random()} className={`mensaje ${esMio ? 'propio' : 'otro'}`}>
                    {!esMio && (
                      <div className="mensaje-avatar">
                        {getInitials(m.personas?.nombres, m.personas?.apellidos)}
                      </div>
                    )}
                    <div className="mensaje-burbuja">
                      {!esMio && <span className="mensaje-autor">{m.personas?.nombres}</span>}
                      <p>{m.texto}</p>
                      <span className="mensaje-hora">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form className="chat-input-form" onSubmit={enviarMensaje}>
            <input
              type="text"
              value={nuevoMsg}
              onChange={(e) => setNuevoMsg(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="chat-input"
            />
            <button type="submit" className="chat-send-btn" disabled={!nuevoMsg.trim()}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}