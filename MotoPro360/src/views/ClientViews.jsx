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
  const [repuestosSugeridos, setRepuestosSugeridos] = useState([]);

  // Estado para la moto seleccionada en sugerencias
  const [motoSeleccionada, setMotoSeleccionada] = useState(null);

  // --- FUNCIÓN PARA OBTENER SUGERENCIAS DE REPUESTOS (Pegar cerca de tus otras funciones) ---
  const obtenerSugerencias = async (motoUsuario) => {
    // motoUsuario.modelo podría ser "BR 200" o "Kobra" según tu tabla 'motos'
    const { data, error } = await supabase
      .from("productos")
      .select(
        `
      id_producto,
      nombre_producto,
      precio,
      imagen_url,
      locales (nombre_local)
    `,
      )
      // Filtramos donde la compatibilidad manual contenga el nombre del modelo
      .ilike("compatibilidad_manual", `%${motoUsuario.modelo}%`)
      .eq("status", true) // Solo productos activos
      .limit(5);

    if (error) console.log("Error sugerencias:", error);
    else setRepuestosSugeridos(data);
  };

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
  const [sugerencias, setSugerencias] = useState([]);

  const buscarSugerencias = async (nombreModelo) => {
    if (!nombreModelo) return;

    // Buscamos productos que mencionen el modelo en su descripción o compatibilidad
    const { data, error } = await supabase
      .from("productos")
      .select("*, locales(nombre_local)")
      .ilike("compatibilidad_manual", `%${nombreModelo}%`) // Busca coincidencias parciales
      .limit(4);

    if (!error) setSugerencias(data);
  };

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
  const eliminarMoto = async (id) => {
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar esta moto?",
    );
    if (!confirmar) return;

    try {
      const { error } = await supabase.from("motos").delete().eq("id", id);
      if (error) throw error;

      setMotos(motos.filter((m) => m.id !== id));
      alert("Moto eliminada correctamente.");
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  };

  const [motoEditando, setMotoEditando] = useState(null);

  const prepararEdicion = (moto) => {
    setMotoEditando(moto.id);
    setSeleccionMarca(moto.marca_id);
    setNuevaMoto({
      modelo: moto.modelo,
      anio: moto.anio,
      placa: moto.placa,
    });
    setMostrandoFormulario(true);
  };

  // Modificamos la función guardarMoto para que detecte si es edición
  const guardarMotoModificada = async () => {
    if (!perfil?.cedula) return;
    if (!seleccionMarca || !nuevaMoto.modelo || !nuevaMoto.placa) {
      alert("Completa todos los campos.");
      return;
    }

    try {
      const payload = {
        modelo: nuevaMoto.modelo,
        placa: nuevaMoto.placa,
        anio: nuevaMoto.anio ? Number(nuevaMoto.anio) : null,
        persona_cedula: Number(perfil.cedula),
        marca_id: Number(seleccionMarca),
      };

      let error;
      if (motoEditando) {
        // MODO EDICIÓN
        const { error: err } = await supabase
          .from("motos")
          .update(payload)
          .eq("id", motoEditando);
        error = err;
      } else {
        // MODO CREACIÓN (incluye tu validación de límite aquí si quieres)
        const { error: err } = await supabase.from("motos").insert([payload]);
        error = err;
      }

      if (error) throw error;

      alert(motoEditando ? "Moto actualizada" : "Moto registrada");
      cancelarEdicion();
      await loadMotos();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const cancelarEdicion = () => {
    setMostrandoFormulario(false);
    setMotoEditando(null);
    setSeleccionMarca("");
    setNuevaMoto({ modelo: "", anio: "", placa: "" });
  };

  // OJO: ESTE codigo es de prueba para editar motos, no olvides integrarlo bien con tu función guardarMoto original y el formulario.

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
            <h4 style={{ marginBottom: "15px" }}>
              {motoEditando ? "Editar Moto" : "Nueva Moto"}
            </h4>

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
                onClick={guardarMotoModificada} // <--- Nueva función
                className="btn-main-login"
                style={{ flex: 1 }}
              >
                {motoEditando ? "ACTUALIZAR" : "GUARDAR"}
              </button>
              <button
                onClick={cancelarEdicion} // <--- Nueva función de limpieza
                style={{
                  background: "#eee",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                }}
              >
                X
              </button>
            </div>
          </div>
        )}

        {/* LISTA DE MOTOS EXISTENTES */}
        {motos.map((moto) => (
          <div
            key={moto.id}
            className="data-card moto-card"
            style={{
              position: "relative",
              cursor: "pointer",
              border:
                motoSeleccionada && motoSeleccionada.id === moto.id
                  ? "2px solid var(--primary-red)"
                  : undefined,
            }}
            onClick={() => {
              setMotoSeleccionada(moto);
              obtenerSugerencias(moto);
            }}
          >
            {/* BOTONES DE ACCIÓN */}
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                onClick={() => prepararEdicion(moto)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#4285F4",
                  cursor: "pointer",
                }}
                title="Editar"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                onClick={() => eliminarMoto(moto.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary-red)",
                  cursor: "pointer",
                }}
                title="Eliminar"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>

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
                    "Marca"}{" "}
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
                width: "fit-content",
              }}
            >
              <p style={{ margin: 0 }}>
                <strong>Placa:</strong> {moto.placa || "—"}
              </p>
            </div>
          </div>
        ))}

        {/* Sección de Sugerencias */}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800">
            {motoSeleccionada
              ? `Repuestos para tu ${motoSeleccionada.modelo}`
              : "Selecciona una moto para ver sugerencias"}
          </h3>
          <div className="flex overflow-x-auto gap-4 py-4">
            {repuestosSugeridos.length > 0 ? (
              repuestosSugeridos.map((prod) => (
                <div
                  key={prod.id_producto}
                  className="sugerencia-repuesto-card"
                >
                  <div className="sugerencia-repuesto-img">
                    {prod.imagen_url ? (
                      <img src={prod.imagen_url} alt={prod.nombre_producto} />
                    ) : (
                      <span className="sugerencia-repuesto-sin-imagen">
                        Sin imagen
                      </span>
                    )}
                  </div>
                  <div className="sugerencia-repuesto-nombre">
                    {prod.nombre_producto}
                  </div>
                  <div className="sugerencia-repuesto-precio">
                    ${prod.precio}
                  </div>
                  <div className="sugerencia-repuesto-local">
                    {prod.locales?.nombre_local}
                  </div>
                </div>
              ))
            ) : (
              <span className="sugerencia-repuesto-sin-imagen">
                No hay sugerencias disponibles
              </span>
            )}
          </div>
        </div>
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
    nombre: "",
    email: "",
    telefono: "",
    tipoSangre: "",
    alergias: "",
    numeroSeguro: "",
    fechaNacimiento: "",
    genero: "",
    direccion: "",
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // 1. Buscamos en la tabla 'personas' usando el id_auth
      const { data: persona, error } = await supabase
        .from("personas")
        .select("*")
        .eq("id_auth", user.id)
        .single();

      if (persona) {
        setFormData({
          nombre: persona.nombres || "",
          apellido: persona.apellidos || "", // Agregamos apellido que faltaba
          email: user.email || "",
          telefono: persona.telefono || "",
          tipoSangre: persona.tipo_sangre || "",
          alergias: persona.alergias || "",
          edad: persona.edad || "", // Usamos edad en vez de fecha si prefieres seguir tu esquema
          genero: persona.genero_id || "", // Usamos el ID de tu tabla generos
        });
      }
      setAvatarUrl(user.user_metadata?.avatar_url || null);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      setMessage({ type: "", text: "" });

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Debes seleccionar una imagen.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, avatar_url: avatarUrl },
      });

      if (updateError) throw updateError;

      setAvatarUrl(avatarUrl);
      onAvatarUpdate?.(avatarUrl);
      setMessage({ type: "success", text: "Foto actualizada correctamente." });
    } catch (err) {
      setMessage({
        type: "error",
        text: "Error al subir la imagen: " + err.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 2. Actualizamos la tabla 'personas'
      const { error: dbError } = await supabase
        .from("personas")
        .update({
          nombres: formData.nombre,
          apellidos: formData.apellido,
          telefono: formData.telefono,
          tipo_sangre: formData.tipoSangre,
          alergias: formData.alergias,
          edad: formData.edad,
          genero_id: formData.genero,
        })
        .eq("id_auth", user.id);

      if (dbError) throw dbError;

      setMessage({
        type: "success",
        text: "Perfil actualizado en base de datos.",
      });
    } catch (error) {
      setMessage({ type: "error", text: "Error: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cliente-perfil fade-in">
      <h2 className="section-title">Mi Perfil</h2>
      <p className="subsection-note">
        Gestiona tu identidad y ficha médica para servicios de emergencia y
        membresías.
      </p>

      {/* SECCIÓN DE AVATAR (Usando tus clases de avatar-upload-section) */}
      <div className="avatar-upload-section">
        <div className="avatar-preview">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="avatar-image" />
          ) : (
            <div className="avatar-placeholder">
              {formData.nombre?.charAt(0) || "U"}
            </div>
          )}
        </div>
        <div className="avatar-upload">
          <label htmlFor="avatar-input" className="btn-upload">
            {uploading ? "Subiendo..." : "Cambiar foto"}
          </label>
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />
          <small className="field-note">JPG, PNG. Máx 2MB</small>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="perfil-form">
        <h3 className="subsection-title">Identidad Personal</h3>

        <div className="form-group">
          <label>Nombre Completo</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            disabled={loading}
            placeholder="Ej: Juan Perez"
            required
          />
        </div>

        <div className="form-group">
          <label>Correo Electrónico</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
            className="input-disabled"
          />
          <small className="field-note">
            El correo está vinculado a tu cuenta y no se puede modificar aquí.
          </small>
        </div>

        <div className="form-group">
          <label>Teléfono de Contacto</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            disabled={loading}
            placeholder="Ej: 0412-1234567"
          />
        </div>

        <h3 className="subsection-title">Información de Salud (Membresía)</h3>
        <p className="subsection-note">
          Esta información es vital en caso de accidentes.
        </p>

        <div className="form-group">
          <label>Tipo de Sangre</label>
          <select
            name="tipoSangre"
            value={formData.tipoSangre}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Seleccionar</option>
            <option value="O+">O Positivo (O+)</option>
            <option value="O-">O Negativo (O-)</option>
            <option value="A+">A Positivo (A+)</option>
            <option value="A-">A Negativo (A-)</option>
            <option value="B+">B Positivo (B+)</option>
            <option value="B-">B Negativo (B-)</option>
            <option value="AB+">AB Positivo (AB+)</option>
            <option value="AB-">AB Negativo (AB-)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Alergias o Condiciones</label>
          <input
            type="text"
            name="alergias"
            value={formData.alergias}
            onChange={handleChange}
            disabled={loading}
            placeholder="Ej: Penicilina, Asma, ninguna..."
          />
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Guardando..." : "Actualizar Información"}
          </button>
          <button
            type="button"
            onClick={cargarDatos}
            disabled={loading}
            className="btn-secondary"
          >
            Deshacer
          </button>
        </div>
      </form>
    </div>
  );
}
