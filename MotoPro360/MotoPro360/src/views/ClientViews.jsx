import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { supabase } from "../supabaseClient"; // Asegúrate de que la ruta sea correcta
import "leaflet/dist/leaflet.css";

export default function ClientView({
  activeTab,
  perfil,
  busquedaRealizada,
  setBusquedaRealizada,
  onAvatarUpdate, // <-- NUEVA PROP para actualizar la foto en el header
}) {
  // --- ESTADOS PARA LA BÚSQUEDA ---
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productosFiltrados, setProductosFiltrados] = useState([]);

  // --- FUNCIÓN PARA BUSCAR (Pegar cerca de tus otras funciones) ---
  const ejecutarBusqueda = () => {
    if (!busqueda.trim()) return;

    // Filtramos por varios campos posibles (nombre_producto, nombre, compatibilidad_manual)
    const base = productos || [];
    const q = busqueda.toLowerCase();
    const resultados = base.filter((prod) => {
      const nombre = (prod.nombre_producto || prod.nombre || "").toLowerCase();
      const compat = (prod.compatibilidad_manual || "").toLowerCase();
      return nombre.includes(q) || compat.includes(q);
    });

    setProductosFiltrados(resultados || []);
    setBusquedaRealizada(true);
    setProductoSeleccionado(null); // Reiniciar mapa al buscar de nuevo
  };
  const [motos, setMotos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [marcas, setMarcas] = useState([]);
  const [modelosFiltrados, setModelosFiltrados] = useState([]);
  const [seleccionMarca, setSeleccionMarca] = useState(""); // Guarda el ID de la marca
  const [nuevaMoto, setNuevaMoto] = useState({
    modelo: "",
    anio: "",
    placa: "",
  });

  // Deferred import of client-specific CSS to enable HMR and avoid loading it until needed
  useEffect(() => {
    let mounted = true;
    // dynamic import of CSS (Vite will handle HMR for files in src)
    import("../assets/css/client.css").then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, []);

  // 1. Efecto para cargar datos dinámicos desde Supabase
  useEffect(() => {
    if (!perfil) return;

    const fetchData = async () => {
      setLoading(true);

      if (activeTab === "inicio") {
        // Busca tu useEffect y reemplaza el bloque .select por este:
        const { data, error } = await supabase
          .from("productos")
          .select(
            `
                *,
                categorias (nombre_categoria),
                locales (
                nombre_local,
                telefono,
                ubicacion_id,
                ubicaciones (
                    latitud,
                    longitud,
                    direccion_fisica
                )
                )
            `,
          )
          .eq("status", true);

        if (error) console.error("Error detallado de Supabase:", error);

        if (!error) setProductos(data || []);
      }
      // Cargar Motos del Cliente
      if (activeTab === "motos") {
        const fetchMarcas = async () => {
          const { data } = await supabase
            .from("marcas")
            .select("*")
            .order("nombre", { ascending: true });
          if (data) setMarcas(data);
        };
        const loadMotos = async () => {
          const { data, error } = await supabase
            .from("motos")
            .select("*")
            .eq("persona_cedula", perfil.cedula)
            .order("id", { ascending: false });
          if (!error) setMotos(data || []);
        };
        fetchMarcas();
        loadMotos();
      }

      // Cargar Productos (Para la vista de inicio/búsqueda)

      setLoading(false);
    };

    fetchData();
  }, [activeTab, perfil]);

  // También exponemos una función para recargar las motos después de insertar
  const loadMotos = async () => {
    if (!perfil) return;
    const { data, error } = await supabase
      .from("motos")
      .select("*")
      .eq("persona_cedula", perfil.cedula)
      .order("id", { ascending: false });
    if (!error) setMotos(data || []);
  };

  // Aqui se filtran los modelos cada vez que cambia la marca seleccionada en el formulario de registro de moto
  useEffect(() => {
    const fetchModelos = async () => {
      if (!seleccionMarca) {
        setModelosFiltrados([]);
        return;
      }
      const { data } = await supabase
        .from("modelos")
        .select("*")
        .eq("marca_id", seleccionMarca)
        .order("nombre_modelo", { ascending: true });

      if (data) setModelosFiltrados(data);
    };
    fetchModelos();
  }, [seleccionMarca]);

  // Validación de Rol
  if (perfil?.nombre_rol !== "cliente") return null;

  // --- RENDERIZADO POR TABS ---

  // ========== NUEVA VISTA: MIS DATOS (PERFIL) ==========
  if (activeTab === "perfil") {
    return <ClientePerfil onAvatarUpdate={onAvatarUpdate} />;
  }

  // TAB: INICIO (Buscador + Mapa)
  if (activeTab === "inicio") {
    // Preparar coordenadas del local seleccionado (si existen)
    // Dentro de if (activeTab === "inicio")
    let coords = null;
    if (productoSeleccionado?.locales?.ubicaciones) {
      const u = productoSeleccionado.locales.ubicaciones;

      // Verificamos que los datos no sean nulos
      if (u.latitud && u.longitud) {
        coords = {
          lat: Number(u.latitud),
          lng: Number(u.longitud),
          direccion_fisica: u.direccion_fisica,
        };
      }
    }

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {!busquedaRealizada ? (
          /* Vista Previa a la búsqueda */
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
            }}
          >
            <div
              className="glass-card"
              style={{
                width: "100%",
                maxWidth: "600px",
                border: "2px solid var(--primary-red)",
                padding: "40px",
              }}
            >
              <h1 style={{ color: "var(--black)", marginBottom: "10px" }}>
                ¿Qué necesitas hoy?
              </h1>
              <p style={{ color: "#666", marginBottom: "25px" }}>
                Encuentra repuestos, talleres y grúas cerca de ti.
              </p>
              <div className="input-group">
                <i className="fas fa-search icon-field"></i>
                <input
                  type="text"
                  placeholder="Ej: Pastillas de freno, Aceite..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ejecutarBusqueda()}
                />
              </div>
              <button
                className="btn-main-login"
                style={{ width: "100%", marginTop: "20px" }}
                onClick={ejecutarBusqueda} // <--- CAMBIO AQUÍ
              >
                BUSCAR DISPONIBILIDAD
              </button>
            </div>
          </div>
        ) : (
          /* Resultados de Búsqueda */
          <>
            <div
              style={{
                background: "white",
                padding: "12px",
                borderRadius: "12px",
                display: "flex",
                gap: "10px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                marginBottom: "10px",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setBusquedaRealizada(false)}
                className="search-back-btn"
                aria-label="Volver búsqueda"
              >
                <i className="fas fa-arrow-left" aria-hidden="true"></i>
              </button>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ejecutarBusqueda()}
                className="search-results-input"
                autoFocus
              />
              <button
                onClick={ejecutarBusqueda}
                className="btn-main-login"
                style={{ marginLeft: "auto" }}
              >
                Buscar
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flex: 1,
                gap: "20px",
                overflow: "hidden",
              }}
              className="responsive-split"
            >
              {/* Lista de Productos Filtrados */}
              <div
                style={{
                  overflowY: "auto",
                  flex: 1,
                  paddingRight: "10px",
                  color: "#333",
                }}
              >
                <h3 style={{ color: "darkgrey" }}>
                  {productosFiltrados.length} resultados encontrados
                </h3>

                {productosFiltrados.map((prod) => (
                  <div
                    key={prod.id_producto}
                    className="data-card"
                    onClick={() => setProductoSeleccionado(prod)} // <--- Seleccionar producto
                    style={{
                      padding: "15px",
                      display: "flex",
                      gap: "15px",
                      marginBottom: "15px",
                      cursor: "pointer",
                      border:
                        productoSeleccionado?.id_producto === prod.id_producto
                          ? "2px solid var(--primary-red)"
                          : "1px solid #eee",
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        background: "#f0f0f0",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="fas fa-box" style={{ color: "#ccc" }}></i>
                    </div>
                    <div>
                      <h4 style={{ margin: 0 }}>{prod.nombre_producto}</h4>
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#666",
                          margin: "2px 0",
                        }}
                      >
                        {prod.locales?.nombre_local}
                      </p>
                      <p
                        style={{
                          color: "var(--primary-red)",
                          fontWeight: "bold",
                          margin: 0,
                        }}
                      >
                        ${prod.precio}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contenedor del Mapa (Solo info si no hay selección) */}
              <div
                style={{
                  flex: 1.5,
                  borderRadius: "15px",
                  overflow: "hidden",
                  background: "#f9f9f9",
                  border: "1px solid #ddd",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {!productoSeleccionado ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                      color: "#999",
                    }}
                  >
                    <i
                      className="fas fa-map-marked-alt"
                      style={{ fontSize: "3rem", marginBottom: "10px" }}
                    ></i>
                    <p>Toca un producto para ver su ubicación</p>
                  </div>
                ) : coords ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <MapContainer
                      center={[coords.lat, coords.lng]}
                      zoom={15}
                      style={{ height: "50%", width: "100%" }}
                      key={productoSeleccionado?.id_producto}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[coords.lat, coords.lng]}>
                        <Popup>
                          {productoSeleccionado?.locales?.nombre_local}
                        </Popup>
                      </Marker>
                    </MapContainer>

                    <div
                      style={{ padding: "20px", background: "white", flex: 1 }}
                    >
                      <h3 style={{ margin: 0, color: "var(--primary-red)" }}>
                        {productoSeleccionado?.locales?.nombre_local}
                      </h3>
                      <p style={{ margin: "10px 0", fontSize: "0.9rem" }}>
                        <i className="fas fa-map-marker-alt"></i>{" "}
                        {coords.direccion_fisica}
                      </p>
                      <p style={{ margin: "5px 0", fontWeight: "bold" }}>
                        <i className="fas fa-phone"></i>{" "}
                        {productoSeleccionado?.locales?.telefono}
                      </p>

                      <button
                        className="btn-main-login"
                        style={{
                          background: "#4285F4",
                          marginTop: "15px",
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "10px",
                        }}
                        // Busca el botón "CÓMO LLEGAR" y cambia el onClick por este:
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`,
                            "_blank",
                          )
                        }
                      >
                        <i className="fab fa-google"></i> CÓMO LLEGAR
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#666",
                    }}
                  >
                    <i
                      className="fas fa-exclamation-triangle"
                      style={{ fontSize: "2rem", color: "orange" }}
                    ></i>
                    <p>Este local no tiene coordenadas registradas.</p>
                    {console.log(
                      "Revisa este objeto en consola:",
                      productoSeleccionado,
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  //Hasta aqui es la parte del buscador y el mapa de resultados, ahora sigue la parte de registro y visualización de motos para el cliente.

  // Función para guardar nueva moto en Supabase
  const guardarMoto = async () => {
    // 1. Validar sesión
    if (!perfil?.cedula) {
      alert("Error: No se identifica al usuario.");
      return;
    } // 2. Validar límite de 3 motos

    if (motos.length >= 3) {
      alert("Lo sentimos, solo puedes registrar un máximo de 3 motos.");
      return;
    } // 3. Validar campos vacíos

    if (!seleccionMarca || !nuevaMoto.modelo || !nuevaMoto.placa) {
      alert("Por favor completa todos los campos: Marca, Modelo, Placa.");
      return;
    }

    try {
      // 4. COMPROBAR SI LA PLACA YA EXISTE
      const { data: existePlaca, error: errorBusqueda } = await supabase
        .from("motos")
        .select("id")
        .eq("placa", nuevaMoto.placa)
        .maybeSingle(); // Retorna un objeto si existe, o null si no

      if (errorBusqueda) throw errorBusqueda;

      if (existePlaca) {
        alert("Esta placa ya se encuentra registrada en el sistema.");
        return;
      } // 5. Insertar la moto (Sin kilometraje y con los tipos de datos corregidos)

      const { error } = await supabase.from("motos").insert([
        {
          modelo: nuevaMoto.modelo,
          placa: nuevaMoto.placa,
          anio: nuevaMoto.anio ? Number(nuevaMoto.anio) : null, // Convertir a Numero
          persona_cedula: Number(perfil.cedula), // Convertir a Numero
          marca_id: Number(seleccionMarca), // Convertir a Numero
        },
      ]);

      if (!error) {
        alert("¡Moto registrada con éxito!");
        setMostrandoFormulario(false);
        setSeleccionMarca("");
        setNuevaMoto({ modelo: "", anio: "", placa: "" }); // Limpiar estado
        await loadMotos(); // Recargar lista desde la BD
      } else {
        throw error;
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Ocurrió un error: " + error.message);
    }
  };

  //Aqui Finaliza el registro de motos y empieza la parte de renderizado de las mismas.

  // TAB: MIS MOTOS
  if (activeTab === "motos") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {/* BOTÓN O FORMULARIO DE REGISTRO */}
        {!mostrandoFormulario ? (
          <div
            className="data-card"
            onClick={() => {
              if (motos.length < 3) setMostrandoFormulario(true);
              else alert("Ya alcanzaste el límite de 3 motos.");
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "2px dashed #ccc",
              cursor: motos.length < 3 ? "pointer" : "not-allowed",
              minHeight: "180px",
              opacity: motos.length < 3 ? 1 : 0.5,
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                background: motos.length < 3 ? "var(--primary-red)" : "#ccc",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                marginBottom: "10px",
              }}
            >
              <i className="fas fa-plus"></i>
            </div>
            <span>
              {motos.length < 3
                ? "Registrar Nueva Moto"
                : "Límite alcanzado (3/3)"}
            </span>
          </div>
        ) : (
          <div
            className="data-card"
            style={{ padding: "20px", border: "2px solid var(--primary-red)" }}
          >
            <h4 style={{ marginBottom: "15px" }}>Nueva Moto</h4>

            {/* Selector de Marca */}
            <select
              style={{
                width: "100%",
                marginBottom: "10px",
                padding: "8px",
                borderRadius: "5px",
                background: "#fff",
              }}
              value={seleccionMarca}
              onChange={(e) => setSeleccionMarca(e.target.value)}
            >
              <option value="">Selecciona Marca...</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>

            {/* Selector de Modelo (Se activa solo si hay marca) */}
            <select
              style={{
                width: "100%",
                marginBottom: "10px",
                padding: "8px",
                borderRadius: "5px",
                background: "#fff",
              }}
              disabled={!seleccionMarca}
              value={nuevaMoto.modelo}
              onChange={(e) =>
                setNuevaMoto({ ...nuevaMoto, modelo: e.target.value })
              }
            >
              <option value="">Selecciona Modelo...</option>
              {modelosFiltrados.map((mod) => (
                <option key={mod.id} value={mod.nombre_modelo}>
                  {mod.nombre_modelo}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Placa (Ej: AA11BB)"
              onChange={(e) =>
                setNuevaMoto({ ...nuevaMoto, placa: e.target.value })
              }
              value={nuevaMoto.placa || ""}
              style={{
                width: "100%",
                marginBottom: "10px",
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                background: "#fff",
              }}
            />

            <input
              type="number"
              placeholder="Año (Ej: 2024)"
              onChange={(e) =>
                setNuevaMoto({ ...nuevaMoto, anio: e.target.value })
              }
              value={nuevaMoto.anio || ""}
              style={{
                width: "100%",
                marginBottom: "10px",
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                background: "#fff",
              }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={guardarMoto}
                className="btn-main-login"
                style={{ flex: 1 }}
              >
                GUARDAR
              </button>
              <button
                onClick={() => setMostrandoFormulario(false)}
                style={{
                  background: "#eee",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                X
              </button>
            </div>
          </div>
        )}

        {/* LISTA DE MOTOS EXISTENTES */}
        {motos.map((moto) => (
          <div key={moto.id} className="data-card moto-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  {marcas.find((m) => m.id === moto.marca_id)?.nombre ||
                    "Marca Desconocida"}{" "}
                  • {moto.modelo}
                </h3>
                <p style={{ color: "#888", fontSize: "0.9rem" }}>{moto.anio}</p>
              </div>
              <i
                className="fas fa-motorcycle"
                style={{ fontSize: "1.5rem", color: "var(--primary-red)" }}
              ></i>
            </div>
            <div
              style={{
                background: "#eee",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "0.8rem",
              }}
            >
              <p>
                <strong>Placa:</strong> {moto.placa || "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // TAB: PROMOCIONES (Placeholder)
  if (activeTab === "promos") {
    return (
      <div className="placeholder-view">
        <h2>Promociones</h2>
        <p>Módulo en construcción</p>
      </div>
    );
  }

  // TAB: FORMACIÓN (Placeholder)
  if (activeTab === "cursos") {
    return (
      <div className="placeholder-view">
        <h2>Formación</h2>
        <p>Módulo en construcción</p>
      </div>
    );
  }

  // TAB: COMUNIDAD (Ejemplo estático mejorado)
  if (activeTab === "comunidad") {
    return (
      <div className="data-card" style={{ padding: "0" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #eee" }}>
          <h3>Grupos Populares</h3>
          <p style={{ color: "#888", fontSize: "0.9rem" }}>
            Únete a otros moteros en tu zona
          </p>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="community-card"
            style={{
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "12px",
                background: "#333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <i className="fas fa-users"></i>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>Moteros de Caracas - Zona Este {i}</h4>
              <p style={{ margin: "5px 0", fontSize: "0.8rem", color: "#666" }}>
                1.2k Miembros
              </p>
            </div>
            <button className="btn-register" style={{ padding: "8px 15px" }}>
              Unirme
            </button>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ================= COMPONENTE DE PERFIL DEL CLIENTE =================
function ClientePerfil({ onAvatarUpdate }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    tipoSangre: '',
    alergias: '',
    numeroSeguro: '',
    fechaNacimiento: '',
    genero: '',
    direccion: '',
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const metadata = user.user_metadata || {};
      setFormData({
        nombre: metadata.full_name || '',
        email: user.email || '',
        telefono: metadata.telefono || '',
        tipoSangre: metadata.tipoSangre || '',
        alergias: metadata.alergias || '',
        numeroSeguro: metadata.numeroSeguro || '',
        fechaNacimiento: metadata.fechaNacimiento || '',
        genero: metadata.genero || '',
        direccion: metadata.direccion || '',
      });
      setAvatarUrl(metadata.avatar_url || null);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      setMessage({ type: '', text: '' });

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      const { data: { user } } = await supabase.auth.getUser();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, avatar_url: avatarUrl },
      });

      if (updateError) throw updateError;

      setAvatarUrl(avatarUrl);
      onAvatarUpdate?.(avatarUrl);
      setMessage({ type: 'success', text: 'Foto actualizada correctamente.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al subir la imagen: ' + err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updatedMetadata = {
        ...user.user_metadata,
        full_name: formData.nombre,
        telefono: formData.telefono,
        tipoSangre: formData.tipoSangre,
        alergias: formData.alergias,
        numeroSeguro: formData.numeroSeguro,
        fechaNacimiento: formData.fechaNacimiento,
        genero: formData.genero,
        direccion: formData.direccion,
      };

      const updates = { data: updatedMetadata };
      if (formData.email !== user.email) {
        updates.email = formData.email;
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      setMessage({ type: 'success', text: 'Datos actualizados correctamente' });
      cargarDatos();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cliente-perfil">
      <h2 className="section-title">Mis Datos</h2>

      <div className="avatar-upload-section">
        <div className="avatar-preview">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="avatar-image" />
          ) : (
            <div className="avatar-placeholder">
              {formData.nombre?.charAt(0) || 'U'}
            </div>
          )}
        </div>
        <div className="avatar-upload">
          <label htmlFor="avatar-input" className="btn-upload">
            {uploading ? 'Subiendo...' : 'Cambiar foto'}
          </label>
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <small className="field-note">JPG, PNG. Máx 2MB</small>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="perfil-form">
        <div className="form-group">
          <label>Nombre completo</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} disabled={loading} required />
        </div>

        <div className="form-group">
          <label>Correo electrónico</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={loading} required />
          <small className="field-note">Si cambias el correo, recibirás un enlace de verificación.</small>
        </div>

        <div className="form-group">
          <label>Teléfono</label>
          <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} disabled={loading} required />
        </div>

        <div className="form-group">
          <label>Fecha de nacimiento</label>
          <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} disabled={loading} />
        </div>

        <div className="form-group">
          <label>Género</label>
          <select name="genero" value={formData.genero} onChange={handleChange} disabled={loading}>
            <option value="">Seleccionar</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
            <option value="prefiero-no-decir">Prefiero no decir</option>
          </select>
        </div>

        <div className="form-group">
          <label>Dirección</label>
          <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} disabled={loading} placeholder="Calle, número, colonia, ciudad" />
        </div>

        <h3 className="subsection-title">Información médica (opcional)</h3>
        <p className="subsection-note">Estos datos pueden ser útiles en caso de emergencia.</p>

        <div className="form-group">
          <label>Tipo de sangre</label>
          <select name="tipoSangre" value={formData.tipoSangre} onChange={handleChange} disabled={loading}>
            <option value="">Seleccionar</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="AB+">AB+</option>
          </select>
        </div>

        <div className="form-group">
          <label>Alergias o condiciones médicas</label>
          <input type="text" name="alergias" value={formData.alergias} onChange={handleChange} disabled={loading} placeholder="Ej: Asma, alergia a penicilina" />
        </div>

        <div className="form-group">
          <label>Número de seguro / póliza</label>
          <input type="text" name="numeroSeguro" value={formData.numeroSeguro} onChange={handleChange} disabled={loading} />
        </div>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button type="button" onClick={cargarDatos} disabled={loading} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}