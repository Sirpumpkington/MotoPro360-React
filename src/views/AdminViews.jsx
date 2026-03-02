import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import styles from "../assets/css/admin.module.css";

export default function AdminView({ activeTab, usuarios, perfil }) {
  const [locales, setLocales] = useState([]);
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
  // Usuarios administrables desde la base de datos
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

  useEffect(() => {
    if (perfil?.nombre_rol === "admin") {
      cargarDatosAdmin();
      if (activeTab === "formacion") cargarCursos();
      if (activeTab === "usuarios") cargarUsuarios();
    }
  }, [perfil, activeTab]);

  // Cargar usuarios y roles desde la base de datos
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
    // Upsert persona (note: `personas` table does not have `correo` column)
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

    // Upsert role mapping
    // Primero eliminamos rol previo si existe y luego insertamos el nuevo
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

  // Cargar cursos para la sección de formación
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
      const { data, error } = await supabase
        .from("locales")
        .select("*, ubicaciones(latitud, longitud)");
      if (error) {
        console.error("Error cargando locales:", error);
      } else if (data) {
        setLocales(data);
      }

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

  // Cambiar estado de curso (activar/desactivar)
  const toggleCurso = async (id, estadoActual) => {
    const { error } = await supabase
      .from("cursos")
      .update({ activo: !estadoActual })
      .eq("id_curso", id);

    if (!error) {
      cargarCursos();
    }
  };

  // Eliminar curso
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

  // Guardar o actualizar curso
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

  if (perfil?.nombre_rol !== "admin") return null;

  return (
    <div className="content-wrapper fade-in">
      {/* SECCIÓN INICIO */}
      {activeTab === "inicio" && (
        <div className={styles["content-column"]}>
          <div className={`glass-card ${styles["card-left"]}`}>
            <h1
              className="login-title"
              style={{ margin: 0, paddingBottom: "10px" }}
            >
              Panel de Control
            </h1>
            <p className={styles["stat-desc"]}>
              Monitoreo en tiempo real de la flota y aliados estratégicos.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
            }}
          >
            <div className={`glass-card ${styles["card-padding-20"]}`}>
              <i className={`fas fa-motorcycle ${styles["icon-red"]}`}></i>
              <h3 className={styles["stat-value"]}>{totalMotos}</h3>
              <p className={styles["stat-desc"]}>Motos Activas</p>
            </div>
            <div className={`glass-card ${styles["card-padding-20"]}`}>
              <i className={`fas fa-store ${styles["icon-black"]}`}></i>
              <h3 className={styles["stat-value"]}>{locales.length}</h3>
              <p className={styles["stat-desc"]}>Aliados Comerciales</p>
            </div>
            <div className={`glass-card ${styles["card-padding-20"]}`}>
              <i className={`fas fa-users ${styles["icon-red"]}`}></i>
              <h3 className={styles["stat-value"]}>
                {usuariosList.length || 0}
              </h3>
              <p className={styles["stat-desc"]}>Usuarios Totales</p>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN MAPA */}
      {activeTab === "mapa" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            className="glass-card"
            style={{ textAlign: "left", padding: "25px" }}
          >
            <h2
              className="login-title"
              style={{ margin: 0, paddingBottom: "10px" }}
            >
              Mapa de Operaciones
            </h2>
          </div>
          <div className={`glass-card ${styles["map-card"]}`}>
            <MapContainer
              center={[10.4917, -66.8785]}
              zoom={13}
              style={{ height: "500px", width: "100%", borderRadius: "15px" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {locales.map(
                (loc) =>
                  loc.ubicaciones?.latitud && (
                    <Marker
                      key={loc.id_local}
                      position={[
                        loc.ubicaciones.latitud,
                        loc.ubicaciones.longitud,
                      ]}
                    >
                      <Popup>
                        <strong>{loc.nombre_local}</strong>
                        <br />
                        {loc.telefono}
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
        <div
          className="glass-card fade-in"
          style={{ padding: "30px", borderTop: "4px solid var(--primary-red)" }}
        >
          <div className={styles["section-header-row"]}>
            <h2 className="login-title" style={{ margin: 0 }}>
              GESTIÓN DE USUARIOS
            </h2>
            <div
              style={{
                width: "50px",
                height: "3px",
                backgroundColor: "var(--primary-red)",
                marginTop: "5px",
              }}
            ></div>
          </div>

          <div className={styles["table-container"]}>
            <div className={styles["table-actions-row"]}>
              <div></div>
              <button
                className={`${styles["btn-save"]} ${styles["primary-button"]}`}
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
                + Nuevo Usuario
              </button>
            </div>
            <table className={styles["crud-table"]}>
              <thead>
                <tr className={styles["table-header"]}>
                  <th>Cédula</th>
                  <th>Nombre Completo</th>
                  <th className={styles["table-cell-center"]}>Rol</th>
                  <th className={styles["table-cell-right"]}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuariosList.map((u) => {
                  const rol = u.nombre_rol || "cliente";
                  const badgeClass =
                    rol === "admin"
                      ? styles["badge-admin"]
                      : rol === "local"
                        ? styles["badge-local"]
                        : styles["badge-cliente"];
                  return (
                    <tr key={u.cedula}>
                      <td className={styles["table-cell-strong"]}>
                        {u.cedula}
                      </td>
                      <td>
                        {u.nombres} {u.apellidos}
                      </td>
                      <td className={styles["table-cell-center"]}>
                        <span
                          className={`${styles.badge || ""} ${badgeClass || ""}`.trim()}
                        >
                          {rol}
                        </span>
                      </td>
                      <td className={styles["table-cell-right"]}>
                        <button
                          className={`${styles["action-btn"]} ${styles["btn-edit"]} ${styles["action-icon-button"]}`}
                          title="Editar"
                          onClick={() => {
                            setEditingUser(u);
                            setIsUserModalOpen(true);
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className={`${styles["action-btn"]} ${styles["btn-delete"]} ${styles["action-icon-button"]}`}
                          title="Eliminar"
                          onClick={() => eliminarUsuario(u.cedula)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECCIÓN GESTIÓN DE CURSOS */}
      {activeTab === "formacion" && (
        <div
          className="glass-card fade-in"
          style={{ padding: "30px", borderTop: "4px solid var(--primary-red)" }}
        >
          <div className={styles["section-header-row"]}>
            <div>
              <h2 className="login-title" style={{ margin: 0 }}>
                GESTIÓN DE FORMACIÓN
              </h2>
              <div
                style={{
                  width: "50px",
                  height: "3px",
                  backgroundColor: "var(--primary-red)",
                  marginTop: "5px",
                }}
              ></div>
            </div>
            <button
              className={`${styles["primary-button"]}`}
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

          <div style={{ overflowX: "auto" }}>
            {cursos.length === 0 ? (
              <div
                style={{ padding: "30px", textAlign: "center", color: "#888" }}
              >
                No hay cursos registrados actualmente.
              </div>
            ) : (
              <table className={styles["cursos-table"]}>
                <thead>
                  <tr className={styles["table-header"]}>
                    <th className={styles["curso-td"]}>Curso</th>
                    <th className={styles["curso-td"]}>Membresía Mín.</th>
                    <th
                      className={
                        styles["curso-td"] + " " + styles["table-cell-center"]
                      }
                    >
                      Estado
                    </th>
                    <th
                      className={
                        styles["curso-td"] + " " + styles["table-cell-center"]
                      }
                    >
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.map((c) => (
                    <tr key={c.id_curso} className={styles["curso-row"]}>
                      <td
                        className={
                          styles["curso-td"] + " " + styles["curso-td-first"]
                        }
                      >
                        <div className={styles["curso-title"]}>{c.titulo}</div>
                        <div className={styles["curso-desc"]}>
                          {c.descripcion?.substring(0, 120)}...
                        </div>
                      </td>
                      <td
                        className={
                          styles["curso-td"] + " " + styles["table-cell-center"]
                        }
                      >
                        Nivel {c.id_membresia_minima}
                      </td>
                      <td
                        className={
                          styles["curso-td"] + " " + styles["table-cell-center"]
                        }
                      >
                        <span
                          className={
                            c.activo
                              ? styles["estado-activo"]
                              : styles["estado-inactivo"]
                          }
                        >
                          {c.activo ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </td>
                      <td
                        className={
                          styles["curso-td"] + " " + styles["curso-td-last"]
                        }
                      >
                        <div className={styles["curso-actions"]}>
                          <button
                            onClick={() => toggleCurso(c.id_curso, c.activo)}
                            title={c.activo ? "Desactivar" : "Activar"}
                            className={
                              styles["action-icon-button"] +
                              " " +
                              (c.activo
                                ? styles["btn-toggle-active"]
                                : styles["btn-toggle-inactive"])
                            }
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
                            className={
                              styles["action-icon-button"] +
                              " " +
                              styles["btn-edit"]
                            }
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => eliminarCurso(c.id_curso)}
                            title="Eliminar curso"
                            className={
                              styles["action-icon-button"] +
                              " " +
                              styles["btn-delete"]
                            }
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal (top-level, outside cards) */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(30,30,30,0.45)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.3s",
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles["modal-content"]}>
            <h2 className={styles["modal-title"] ?? "login-title"}>
              {cursoEditando ? "EDITAR CURSO" : "NUEVO CURSO"}
            </h2>
            <form
              onSubmit={guardarCurso}
              className={styles["modal-form-group"]}
              style={{ marginBottom: 0 }}
            >
              <input
                type="text"
                placeholder="Título del curso"
                className={styles["modal-input"]}
                required
                value={cursoEditando ? cursoEditando.titulo : nuevoCurso.titulo}
                onChange={(e) =>
                  cursoEditando
                    ? setCursoEditando({
                        ...cursoEditando,
                        titulo: e.target.value,
                      })
                    : setNuevoCurso({ ...nuevoCurso, titulo: e.target.value })
                }
              />
              <textarea
                placeholder="Descripción"
                className={styles["modal-input"]}
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
              <input
                type="url"
                placeholder="Link de Google Classroom"
                className={styles["modal-input"]}
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
              <label style={{ fontSize: "12px", color: "#666", marginTop: 8 }}>
                Membresía Mínima:
              </label>
              <select
                className={styles["modal-input"]}
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
                <option value={1}>Básica (Nivel 1)</option>
                <option value={2}>Premium (Nivel 2)</option>
              </select>
              <div className={styles["modal-actions"]}>
                <button type="submit" className={styles["btn-save"]}>
                  GUARDAR
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles["btn-cancel"]}
                >
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUserModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(30,30,30,0.45)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.3s",
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles["modal-content"]}>
            <h2 className={styles["modal-title"] ?? "login-title"}>
              {editingUser ? "EDITAR USUARIO" : "NUEVO USUARIO"}
            </h2>
            <form
              onSubmit={crearOActualizarUsuario}
              className={styles["modal-form-group"]}
            >
              <input
                className={styles["modal-input"]}
                placeholder="Cédula"
                required
                value={editingUser ? editingUser.cedula : nuevoUsuario.cedula}
                onChange={(e) =>
                  editingUser
                    ? setEditingUser({ ...editingUser, cedula: e.target.value })
                    : setNuevoUsuario({
                        ...nuevoUsuario,
                        cedula: e.target.value,
                      })
                }
                disabled={!!editingUser}
              />
              <input
                className={styles["modal-input"]}
                placeholder="Nombres"
                required
                value={editingUser ? editingUser.nombres : nuevoUsuario.nombres}
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
              <input
                className={styles["modal-input"]}
                placeholder="Apellidos"
                required
                value={
                  editingUser ? editingUser.apellidos : nuevoUsuario.apellidos
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
              <input
                className={styles["modal-input"]}
                placeholder="Correo"
                type="email"
                value={editingUser ? editingUser.correo : nuevoUsuario.correo}
                onChange={(e) =>
                  editingUser
                    ? setEditingUser({ ...editingUser, correo: e.target.value })
                    : setNuevoUsuario({
                        ...nuevoUsuario,
                        correo: e.target.value,
                      })
                }
              />
              <input
                className={styles["modal-input"]}
                placeholder="Teléfono"
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
              <label style={{ fontSize: "12px", color: "#666" }}>Rol</label>
              <select
                className={styles["modal-input"]}
                value={
                  editingUser ? editingUser.nombre_rol : nuevoUsuario.nombre_rol
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
              <div className={styles["modal-actions"]}>
                <button type="submit" className={styles["btn-save"]}>
                  GUARDAR
                </button>
                <button
                  type="button"
                  className={styles["btn-cancel"]}
                  onClick={() => {
                    setIsUserModalOpen(false);
                    setEditingUser(null);
                  }}
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
