import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import styles from "../assets/css/admin.module.css";
import VistaAprobaciones from "./admin_modules/gruposadm.jsx";

// Crear iconos personalizados con DivIcon (no requieren archivos de imagen)
const createIcon = (color, iconClass) => {
  return L.divIcon({
    html: `<i class="${iconClass}" style="color: ${color}; font-size: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);"></i>`,
    className: "custom-marker",
    iconSize: [24, 24],
    popupAnchor: [0, -12],
  });
};

const localIcon = createIcon("#e63946", "fas fa-store");
const motoIcon = createIcon("#4285F4", "fas fa-motorcycle");

export default function AdminView({ activeTab, usuarios, perfil }) {
  const [locales, setLocales] = useState([]);
  const [motosUbicadas, setMotosUbicadas] = useState([]);
  const [totalMotos, setTotalMotos] = useState(0);
  const [cursos, setCursos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cursoEditando, setCursoEditando] = useState(null);
  const [nuevoCurso, setNuevoCurso] = useState({
    titulo: "",
    descripcion: "",
    enlace_classroom: "",
    id_membresia_minima: 1,
    activo: true,
  });
  const [usuariosList, setUsuariosList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    cedula: "",
    nombres: "",
    apellidos: "",
    correo: "",
    telefono: "",
    nombre_rol: "cliente",
  });
  const [filtroRol, setFiltroRol] = useState("todos");
  const [mapFilter, setMapFilter] = useState("todos"); // "todos", "locales", "motos"

  useEffect(() => {
    if (perfil?.nombre_rol === "admin") {
      cargarDatosAdmin();
      if (activeTab === "formacion") cargarCursos();
      if (activeTab === "usuarios") cargarUsuarios();
    }
  }, [perfil, activeTab]);

  const cargarUsuarios = async () => {
    try {
      const { data: personas, error: errP } = await supabase
        .from("personas")
        .select("cedula,nombres,apellidos,telefono,id_membresia");
      const { data: roles, error: errR } = await supabase
        .from("roles")
        .select("persona_cedula,nombre_rol");

      if (errP) {
        console.error("Error cargando personas:", JSON.stringify(errP));
        return;
      }
      if (errR) {
        console.error("Error cargando roles:", JSON.stringify(errR));
      }

      if (roles) setRolesList(roles);
      if (personas) {
        const merged = personas.map((p) => {
          const r = (roles || []).find(
            (x) => String(x.persona_cedula) === String(p.cedula),
          );
          return { ...p, nombre_rol: r?.nombre_rol || "cliente" };
        });
        setUsuariosList(merged);
      } else {
        setUsuariosList([]);
      }
    } catch (err) {
      console.error("Excepción en cargarUsuarios:", err);
    }
  };

  const crearOActualizarUsuario = async (e) => {
    e.preventDefault();
    const payload = editingUser ? editingUser : nuevoUsuario;
    const { error: errPersona } = await supabase.from("personas").upsert(
      [
        {
          cedula: payload.cedula,
          nombres: payload.nombres,
          apellidos: payload.apellidos,
          telefono: payload.telefono || null,
          id_membresia: payload.id_membresia || 1,
        },
      ],
      { onConflict: "cedula" },
    );
    if (errPersona) return alert("Error persona: " + errPersona.message);

    await supabase.from("roles").delete().eq("persona_cedula", payload.cedula);
    const { error: errRole } = await supabase.from("roles").insert([
      {
        persona_cedula: payload.cedula,
        nombre_rol: payload.nombre_rol || "cliente",
      },
    ]);
    if (errRole) return alert("Error rol: " + errRole.message);

    await cargarUsuarios();
    setIsUserModalOpen(false);
    setEditingUser(null);
    setNuevoUsuario({
      cedula: "",
      nombres: "",
      apellidos: "",
      correo: "",
      telefono: "",
      nombre_rol: "cliente",
    });
  };

  const eliminarUsuario = async (cedula) => {
    if (!window.confirm("¿Eliminar usuario?")) return;
    await supabase.from("roles").delete().eq("persona_cedula", cedula);
    const { error } = await supabase
      .from("personas")
      .delete()
      .eq("cedula", cedula);
    if (error) return alert("Error eliminando: " + error.message);
    await cargarUsuarios();
  };

  const cargarCursos = async () => {
    try {
      const { data, error } = await supabase.from("cursos").select("*");
      if (error) {
        console.error("Error cargando cursos:", error);
        setCursos([]);
        return;
      }
      if (data) setCursos(data);
      else setCursos([]);
    } catch (err) {
      console.error("Excepción en cargarCursos:", err);
    }
  };

  const cargarDatosAdmin = async () => {
    try {
      // Cargar locales con ubicación
      const { data: localesData, error } = await supabase
        .from("locales")
        .select("*, ubicaciones(latitud, longitud)");
      if (error) {
        console.error("Error cargando locales:", error);
      } else if (localesData) {
        setLocales(localesData);
      }

      // Cargar motos con ubicación (ajusta según tu esquema)
      const { data: motosData, error: errorMotos } = await supabase
        .from("motos")
        .select(
          `
          *,
          ubicaciones(latitud, longitud),
          personas!inner(nombres, apellidos)
        `,
        )
        .not("ubicacion_id", "is", null); // Solo motos con ubicación

      if (errorMotos) {
        console.error("Error cargando motos con ubicación:", errorMotos);
      } else if (motosData) {
        setMotosUbicadas(motosData);
      }

      // Total de motos (para estadísticas)
      const { count, error: errCount } = await supabase
        .from("motos")
        .select("*", { count: "exact", head: true });
      if (errCount) {
        console.error("Error contando motos:", errCount);
        setTotalMotos(0);
      } else setTotalMotos(count || 0);
    } catch (err) {
      console.error("Excepción en cargarDatosAdmin:", err);
    }
  };

  const toggleCurso = async (id, estadoActual) => {
    const { error } = await supabase
      .from("cursos")
      .update({ activo: !estadoActual })
      .eq("id_curso", id);
    if (!error) cargarCursos();
  };

  const eliminarCurso = async (id) => {
    if (
      window.confirm(
        "¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.",
      )
    ) {
      const { error } = await supabase
        .from("cursos")
        .delete()
        .eq("id_curso", id);
      if (!error) setCursos((prev) => prev.filter((c) => c.id_curso !== id));
    }
  };

  const guardarCurso = async (e) => {
    e.preventDefault();
    const payload = cursoEditando ? cursoEditando : nuevoCurso;
    const { data, error } = await supabase
      .from("cursos")
      .upsert([payload], { onConflict: "id_curso" })
      .select();
    if (!error) {
      cargarCursos();
      setIsModalOpen(false);
      setCursoEditando(null);
      setNuevoCurso({
        titulo: "",
        descripcion: "",
        enlace_classroom: "",
        id_membresia_minima: 1,
        activo: true,
      });
    } else {
      alert("Error al guardar: " + error.message);
    }
  };

  const usuariosFiltrados = usuariosList.filter((u) => {
    if (filtroRol === "todos") return true;
    return u.nombre_rol === filtroRol;
  });

  if (perfil?.nombre_rol !== "admin") return null;

  return (
    <div className={`content-wrapper fade-in ${styles.adminContainer}`}>
      {/* SECCIÓN INICIO */}
      {activeTab === "inicio" && (
        <div className={styles.contentColumn}>
          <div className={styles.welcomeCard}>
            <h1 className={styles.welcomeTitle}>Panel de Control</h1>
            <p className={styles.welcomeText}>
              Monitoreo en tiempo real de la flota y aliados estratégicos.
            </p>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <i className="fas fa-motorcycle"></i>
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{totalMotos}</h3>
                <p className={styles.statLabel}>Motos Activas</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <i className="fas fa-store"></i>
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{locales.length}</h3>
                <p className={styles.statLabel}>Aliados Comerciales</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <i className="fas fa-users"></i>
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{usuariosList.length || 0}</h3>
                <p className={styles.statLabel}>Usuarios Totales</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN MAPA - CON FILTROS Y MARCAS DIFERENCIADAS */}
      {activeTab === "mapa" && (
        <div className={styles.mapSection}>
          <div className={styles.welcomeCard}>
            <h2 className={styles.sectionTitle}>Mapa de Operaciones</h2>
          </div>

          {/* Filtros */}
          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab} ${mapFilter === "todos" ? styles.activeFilter : ""}`}
              onClick={() => setMapFilter("todos")}
            >
              Todos
            </button>
            <button
              className={`${styles.filterTab} ${mapFilter === "locales" ? styles.activeFilter : ""}`}
              onClick={() => setMapFilter("locales")}
            >
              Locales
            </button>
            <button
              className={`${styles.filterTab} ${mapFilter === "motos" ? styles.activeFilter : ""}`}
              onClick={() => setMapFilter("motos")}
            >
              Motos
            </button>
          </div>

          <div className={styles.mapCard}>
            <MapContainer
              center={[10.4917, -66.8785]} // Coordenadas por defecto (Caracas)
              zoom={13}
              style={{ height: "500px", width: "100%", borderRadius: "20px" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Marcadores de locales */}
              {(mapFilter === "todos" || mapFilter === "locales") &&
                locales.map(
                  (loc) =>
                    loc.ubicaciones?.latitud && (
                      <Marker
                        key={`local-${loc.id_local}`}
                        position={[
                          loc.ubicaciones.latitud,
                          loc.ubicaciones.longitud,
                        ]}
                        icon={localIcon}
                      >
                        <Popup>
                          <strong>🏪 {loc.nombre_local}</strong>
                          <br />
                          {loc.telefono}
                        </Popup>
                      </Marker>
                    ),
                )}

              {/* Marcadores de motos */}
              {(mapFilter === "todos" || mapFilter === "motos") &&
                motosUbicadas.map(
                  (moto) =>
                    moto.ubicaciones?.latitud && (
                      <Marker
                        key={`moto-${moto.id}`}
                        position={[
                          moto.ubicaciones.latitud,
                          moto.ubicaciones.longitud,
                        ]}
                        icon={motoIcon}
                      >
                        <Popup>
                          <strong>🏍️ Moto: {moto.modelo}</strong>
                          <br />
                          {moto.placa && `Placa: ${moto.placa}`}
                          <br />
                          Dueño: {moto.personas?.nombres}{" "}
                          {moto.personas?.apellidos}
                        </Popup>
                      </Marker>
                    ),
                )}
            </MapContainer>
          </div>
        </div>
      )}

      {/* SECCIÓN USUARIOS */}
      {activeTab === "usuarios" && (
        <div className={styles.usersSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Gestión de Usuarios</h2>
            <button
              className={styles.primaryButton}
              onClick={() => {
                setEditingUser(null);
                setNuevoUsuario({
                  cedula: "",
                  nombres: "",
                  apellidos: "",
                  correo: "",
                  telefono: "",
                  nombre_rol: "cliente",
                });
                setIsUserModalOpen(true);
              }}
            >
              <i className="fas fa-plus"></i> Nuevo Usuario
            </button>
          </div>

          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab} ${filtroRol === "todos" ? styles.activeFilter : ""}`}
              onClick={() => setFiltroRol("todos")}
            >
              Todos
            </button>
            <button
              className={`${styles.filterTab} ${filtroRol === "cliente" ? styles.activeFilter : ""}`}
              onClick={() => setFiltroRol("cliente")}
            >
              Clientes
            </button>
            <button
              className={`${styles.filterTab} ${filtroRol === "local" ? styles.activeFilter : ""}`}
              onClick={() => setFiltroRol("local")}
            >
              Locales
            </button>
            <button
              className={`${styles.filterTab} ${filtroRol === "admin" ? styles.activeFilter : ""}`}
              onClick={() => setFiltroRol("admin")}
            >
              Administradores
            </button>
          </div>

          <div className={styles.userGrid}>
            {usuariosFiltrados.map((u) => {
              const rol = u.nombre_rol || "cliente";
              const badgeClass =
                rol === "admin"
                  ? styles.badgeAdmin
                  : rol === "local"
                    ? styles.badgeLocal
                    : styles.badgeCliente;
              return (
                <div key={u.cedula} className={styles.userCard}>
                  <div className={styles.userCardHeader}>
                    <div className={styles.userAvatar}>
                      {u.nombres?.charAt(0)}
                      {u.apellidos?.charAt(0)}
                    </div>
                    <div className={styles.userHeaderInfo}>
                      <h3 className={styles.userName}>
                        {u.nombres} {u.apellidos}
                      </h3>
                      <span className={`${styles.userBadge} ${badgeClass}`}>
                        {rol}
                      </span>
                    </div>
                  </div>
                  <div className={styles.userDetails}>
                    <p className={styles.userDetailItem}>
                      <i className="fas fa-id-card"></i> <span>Cédula:</span>{" "}
                      {u.cedula}
                    </p>
                    <p className={styles.userDetailItem}>
                      <i className="fas fa-phone"></i> <span>Teléfono:</span>{" "}
                      {u.telefono || "No registrado"}
                    </p>
                  </div>
                  <div className={styles.userActions}>
                    <button
                      className={styles.actionEdit}
                      onClick={() => {
                        setEditingUser(u);
                        setIsUserModalOpen(true);
                      }}
                      title="Editar usuario"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className={styles.actionDelete}
                      onClick={() => eliminarUsuario(u.cedula)}
                      title="Eliminar usuario"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN FORMACIÓN */}
      {activeTab === "formacion" && (
        <div className={styles.cursosSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Gestión de Formación</h2>
            <button
              className={styles.primaryButton}
              onClick={() => {
                setCursoEditando(null);
                setNuevoCurso({
                  titulo: "",
                  descripcion: "",
                  enlace_classroom: "",
                  id_membresia_minima: 1,
                  activo: true,
                });
                setIsModalOpen(true);
              }}
            >
              <i className="fas fa-plus"></i> Nuevo Curso
            </button>
          </div>

          {cursos.length === 0 ? (
            <div className={styles.emptyState}>
              No hay cursos registrados actualmente.
            </div>
          ) : (
            <div className={styles.cursosGrid}>
              {cursos.map((c) => (
                <div key={c.id_curso} className={styles.cursoCard}>
                  <div className={styles.cursoCardHeader}>
                    <h3 className={styles.cursoTitulo}>{c.titulo}</h3>
                    <span
                      className={
                        c.activo ? styles.estadoActivo : styles.estadoInactivo
                      }
                    >
                      {c.activo ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </div>
                  <p className={styles.cursoDescripcion}>
                    {c.descripcion?.substring(0, 120)}...
                  </p>
                  <div className={styles.cursoMeta}>
                    <span>Membresía mínima: Nivel {c.id_membresia_minima}</span>
                  </div>
                  <div className={styles.cursoActions}>
                    <button
                      onClick={() => toggleCurso(c.id_curso, c.activo)}
                      title={c.activo ? "Desactivar" : "Activar"}
                      className={styles.cursoActionBtn}
                    >
                      <i
                        className={`fas ${c.activo ? "fa-eye" : "fa-eye-slash"}`}
                      ></i>
                    </button>
                    <button
                      onClick={() => {
                        setCursoEditando(c);
                        setIsModalOpen(true);
                      }}
                      title="Editar curso"
                      className={styles.cursoActionBtn}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => eliminarCurso(c.id_curso)}
                      title="Eliminar curso"
                      className={styles.cursoActionBtn}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE USUARIO */}
      {isUserModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h2>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</h2>
              <button
                className={styles.modalClose}
                onClick={() => {
                  setIsUserModalOpen(false);
                  setEditingUser(null);
                }}
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={crearOActualizarUsuario}
              className={styles.modalForm}
            >
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="cedula">Cédula</label>
                  <input
                    type="text"
                    id="cedula"
                    placeholder="Ej: 12345678"
                    required
                    value={
                      editingUser ? editingUser.cedula : nuevoUsuario.cedula
                    }
                    onChange={(e) =>
                      editingUser
                        ? setEditingUser({
                            ...editingUser,
                            cedula: e.target.value,
                          })
                        : setNuevoUsuario({
                            ...nuevoUsuario,
                            cedula: e.target.value,
                          })
                    }
                    disabled={!!editingUser}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="nombres">Nombres</label>
                  <input
                    type="text"
                    id="nombres"
                    placeholder="Ej: Juan"
                    required
                    value={
                      editingUser ? editingUser.nombres : nuevoUsuario.nombres
                    }
                    onChange={(e) =>
                      editingUser
                        ? setEditingUser({
                            ...editingUser,
                            nombres: e.target.value,
                          })
                        : setNuevoUsuario({
                            ...nuevoUsuario,
                            nombres: e.target.value,
                          })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="apellidos">Apellidos</label>
                  <input
                    type="text"
                    id="apellidos"
                    placeholder="Ej: Pérez"
                    required
                    value={
                      editingUser
                        ? editingUser.apellidos
                        : nuevoUsuario.apellidos
                    }
                    onChange={(e) =>
                      editingUser
                        ? setEditingUser({
                            ...editingUser,
                            apellidos: e.target.value,
                          })
                        : setNuevoUsuario({
                            ...nuevoUsuario,
                            apellidos: e.target.value,
                          })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="correo">Correo electrónico</label>
                  <input
                    type="email"
                    id="correo"
                    placeholder="ejemplo@correo.com"
                    value={
                      editingUser ? editingUser.correo : nuevoUsuario.correo
                    }
                    onChange={(e) =>
                      editingUser
                        ? setEditingUser({
                            ...editingUser,
                            correo: e.target.value,
                          })
                        : setNuevoUsuario({
                            ...nuevoUsuario,
                            correo: e.target.value,
                          })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    type="tel"
                    id="telefono"
                    placeholder="04121234567"
                    value={
                      editingUser ? editingUser.telefono : nuevoUsuario.telefono
                    }
                    onChange={(e) =>
                      editingUser
                        ? setEditingUser({
                            ...editingUser,
                            telefono: e.target.value,
                          })
                        : setNuevoUsuario({
                            ...nuevoUsuario,
                            telefono: e.target.value,
                          })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="rol">Rol</label>
                  <select
                    id="rol"
                    value={
                      editingUser
                        ? editingUser.nombre_rol
                        : nuevoUsuario.nombre_rol
                    }
                    onChange={(e) =>
                      editingUser
                        ? setEditingUser({
                            ...editingUser,
                            nombre_rol: e.target.value,
                          })
                        : setNuevoUsuario({
                            ...nuevoUsuario,
                            nombre_rol: e.target.value,
                          })
                    }
                  >
                    <option value="cliente">Cliente</option>
                    <option value="local">Local</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.btnPrimary}>
                  Guardar
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => {
                    setIsUserModalOpen(false);
                    setEditingUser(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CURSO */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h2>{cursoEditando ? "Editar Curso" : "Nuevo Curso"}</h2>
              <button
                className={styles.modalClose}
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={guardarCurso} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Título del curso</label>
                  <input
                    type="text"
                    placeholder="Ej: Mecánica Básica"
                    required
                    value={
                      cursoEditando ? cursoEditando.titulo : nuevoCurso.titulo
                    }
                    onChange={(e) =>
                      cursoEditando
                        ? setCursoEditando({
                            ...cursoEditando,
                            titulo: e.target.value,
                          })
                        : setNuevoCurso({
                            ...nuevoCurso,
                            titulo: e.target.value,
                          })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Descripción</label>
                  <textarea
                    rows="3"
                    placeholder="Breve descripción del curso"
                    value={
                      cursoEditando
                        ? cursoEditando.descripcion
                        : nuevoCurso.descripcion
                    }
                    onChange={(e) =>
                      cursoEditando
                        ? setCursoEditando({
                            ...cursoEditando,
                            descripcion: e.target.value,
                          })
                        : setNuevoCurso({
                            ...nuevoCurso,
                            descripcion: e.target.value,
                          })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Enlace de Google Classroom</label>
                  <input
                    type="url"
                    placeholder="https://classroom.google.com/..."
                    value={
                      cursoEditando
                        ? cursoEditando.enlace_classroom
                        : nuevoCurso.enlace_classroom
                    }
                    onChange={(e) =>
                      cursoEditando
                        ? setCursoEditando({
                            ...cursoEditando,
                            enlace_classroom: e.target.value,
                          })
                        : setNuevoCurso({
                            ...nuevoCurso,
                            enlace_classroom: e.target.value,
                          })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Membresía mínima</label>
                  <select
                    value={
                      cursoEditando
                        ? cursoEditando.id_membresia_minima
                        : nuevoCurso.id_membresia_minima
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      cursoEditando
                        ? setCursoEditando({
                            ...cursoEditando,
                            id_membresia_minima: val,
                          })
                        : setNuevoCurso({
                            ...nuevoCurso,
                            id_membresia_minima: val,
                          });
                    }}
                  >
                    <option value={1}>Gratuito</option>
                    <option value={2}>Pro</option>
                    <option value={3}>Premium</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.btnPrimary}>
                  Guardar
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*SECCION APROBAR GRUPOS */}
      {activeTab === "Grupos" && <VistaAprobaciones />}
    </div>
  );
}
