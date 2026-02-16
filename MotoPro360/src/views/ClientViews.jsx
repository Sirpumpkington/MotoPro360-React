import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { supabase } from "../supabaseClient"; // Asegúrate de que la ruta sea correcta
import "leaflet/dist/leaflet.css";

export default function ClientView({
  activeTab,
  perfil,
  busquedaRealizada,
  setBusquedaRealizada,
}) {
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

  // 1. Efecto para cargar datos dinámicos desde Supabase
  useEffect(() => {
    if (!perfil) return;

    const fetchData = async () => {
      setLoading(true);

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
      if (activeTab === "inicio") {
        const { data, error } = await supabase
          .from("productos")
          .select("*, locales(nombre_local, latitud, longitud)");
        if (!error) setProductos(data || []);
      }

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

  // TAB: INICIO (Buscador + Mapa)
  if (activeTab === "inicio") {
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
                />
              </div>
              <button
                className="btn-main-login"
                style={{ width: "100%", marginTop: "20px" }}
                onClick={() => setBusquedaRealizada(true)}
              >
                BUSCAR DISPONIBILIDAD
              </button>
            </div>
          </div>
        ) : (
          /* Resultados de Búsqueda */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              gap: "20px",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "12px",
                display: "flex",
                gap: "10px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              }}
            >
              <button
                onClick={() => setBusquedaRealizada(false)}
                className="search-back-btn"
                aria-label="Volver búsqueda"
                style={{ cursor: "pointer" }}
              >
                <i className="fas fa-arrow-left" aria-hidden="true"></i>
              </button>
              <input
                type="text"
                defaultValue="Resultados de búsqueda"
                className="search-results-input"
                autoFocus
                style={{ width: "100%" }}
              />
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
              {/* Lista de Productos Reales */}
              <div
                style={{
                  overflowY: "auto",
                  flex: 1,
                  paddingRight: "10px",
                  color: "#333",
                }}
              >
                <h3 style={{ color: "darkgrey" }}>
                  {productos.length} resultados encontrados
                </h3>
                {productos.map((prod) => (
                  <div
                    key={prod.id}
                    className="data-card"
                    style={{
                      padding: "15px",
                      display: "flex",
                      gap: "15px",
                      marginBottom: "15px",
                    }}
                  >
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        background: "#040404",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i
                        className="fas fa-box"
                        style={{ color: "#000000" }}
                      ></i>
                    </div>
                    <div>
                      <h4 style={{ margin: 0 }}>{prod.nombre}</h4>
                      <p style={{ fontSize: "0.8rem", color: "#666" }}>
                        {prod.locales?.nombre_local}
                      </p>
                      <p
                        style={{
                          color: "var(--primary-red)",
                          fontWeight: "bold",
                        }}
                      >
                        ${prod.precio}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mapa con Ubicaciones Reales */}
              <div
                style={{
                  flex: 1.5,
                  borderRadius: "15px",
                  overflow: "hidden",
                  minHeight: "300px",
                }}
              >
                <MapContainer
                  center={[10.4806, -66.9036]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {productos.map(
                    (prod) =>
                      prod.locales?.latitud && (
                        <Marker
                          key={prod.id}
                          position={[
                            prod.locales.latitud,
                            prod.locales.longitud,
                          ]}
                        >
                          <Popup>
                            {prod.locales.nombre_local} <br /> {prod.nombre}
                          </Popup>
                        </Marker>
                      ),
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
