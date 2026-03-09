import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { supabase } from "../supabaseClient";
import "leaflet/dist/leaflet.css";
import Emergencia from "./local_modules/emergencia.jsx";
import VistaPromos from "./client_modules/promociones.jsx";
import VistaCursos from "./client_modules/formacion.jsx";
import "../assets/css/client.css";
import VistaMembresias from "./client_modules/membresias.jsx";
import VistaGrupos from "./client_modules/grupos.jsx";

// productos de ejemplo
const productosEjemplo = [
  {
    id_producto: 1,
    nombre_producto: "Bujías Empire Keeways",
    precio: 150,
    stock: "varios",
    imagen_url: null,
    locales: { nombre_local: "MotoRepuestos CA" },
  },
  {
    id_producto: 2,
    nombre_producto: "Cauchos SBR 90/90",
    precio: 25,
    stock: "varios",
    imagen_url: null,
    locales: { nombre_local: "Taller El Tigre" },
  },
  {
    id_producto: 3,
    nombre_producto: "Pastillas de Freno Delanteras",
    precio: 4.5,
    stock: "varios",
    imagen_url: null,
    locales: { nombre_local: "Mundo Moto" },
  },
  {
    id_producto: 4,
    nombre_producto: "Kit de Pistón Standard SBR",
    precio: 15.99,
    stock: "varios",
    imagen_url: null,
    locales: { nombre_local: "Repuestos Rápidos" },
  },
  {
    id_producto: 5,
    nombre_producto: "Luz LED para moto",
    precio: 15.99,
    stock: 20,
    imagen_url: null,
    locales: { nombre_local: "Accesorios Yamir" },
  },
  {
    id_producto: 6,
    nombre_producto: "Cubierta trasera 120/70",
    precio: 210,
    stock: 2,
    imagen_url: null,
    locales: { nombre_local: "Neumáticos Express" },
  },
  {
    id_producto: 7,
    nombre_producto: "Aceite 20W50 1L",
    precio: 12.5,
    stock: "varios",
    imagen_url: null,
    locales: { nombre_local: "Lubricentes" },
  },
  {
    id_producto: 8,
    nombre_producto: "Filtro de aire",
    precio: 8.99,
    stock: 15,
    imagen_url: null,
    locales: { nombre_local: "MotoPartes" },
  },
  {
    id_producto: 9,
    nombre_producto: "Cadena de transmisión",
    precio: 45.0,
    stock: 5,
    imagen_url: null,
    locales: { nombre_local: "Transmisiones CA" },
  },
];

// Datos de ejemplo para locales
const localesEjemplo = [
  { id_local: 1, nombre_local: "MotoRepuestos CA", logo: null },
  { id_local: 2, nombre_local: "Taller El Tigre", logo: null },
  { id_local: 3, nombre_local: "Mundo Moto", logo: null },
  { id_local: 4, nombre_local: "Repuestos Rápidos", logo: null },
  { id_local: 5, nombre_local: "Accesorios Yamir", logo: null },
  { id_local: 6, nombre_local: "Neumáticos Express", logo: null },
  { id_local: 7, nombre_local: "Motos Venezuela", logo: null },
  { id_local: 8, nombre_local: "Taller Mecánico Pérez", logo: null },
  { id_local: 9, nombre_local: "Repuestos El Tigre", logo: null },
  { id_local: 10, nombre_local: "MotoPartes C.A.", logo: null },
];

// Componente Carrusel de Productos
const ProductCarousel = ({ productos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = React.useRef(null);
  const itemRefs = React.useRef([]);

  useEffect(() => {
    if (!productos || productos.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % productos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [productos]);

  useEffect(() => {
    if (
      carouselRef.current &&
      productos?.length > 0 &&
      itemRefs.current[currentIndex]
    ) {
      const item = itemRefs.current[currentIndex];
      const container = carouselRef.current;
      const scrollLeft = item.offsetLeft - container.offsetLeft;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [currentIndex, productos]);

  if (!productos || productos.length === 0) return null;

  return (
    <div className="carousel-container">
      <div className="carousel-track" ref={carouselRef}>
        {productos.map((prod, index) => (
          <div
            key={prod.id_producto}
            ref={(el) => (itemRefs.current[index] = el)}
            className={`carousel-item ${index === currentIndex ? "active" : ""}`}
          >
            <div className="carousel-image">
              {prod.imagen_url ? (
                <img src={prod.imagen_url} alt={prod.nombre_producto} />
              ) : (
                <i className="fas fa-box"></i>
              )}
            </div>
            <div className="carousel-content">
              <p className="carousel-precio">${prod.precio}</p>
              <p className="carousel-stock">Quedan {prod.stock || "varios"}</p>
              <p className="carousel-nombre">{prod.nombre_producto}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="carousel-dots">
        {productos.map((_, idx) => (
          <span
            key={idx}
            className={`dot ${idx === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
};

// Componente Carrusel de Locales
const LocalCarousel = ({ locales }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = React.useRef(null);

  useEffect(() => {
    if (!locales || locales.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % locales.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [locales]);

  useEffect(() => {
    if (carouselRef.current && locales?.length > 0) {
      const itemWidth = carouselRef.current.children[0]?.offsetWidth + 16;
      carouselRef.current.scrollTo({
        left: currentIndex * itemWidth,
        behavior: "smooth",
      });
    }
  }, [currentIndex, locales]);

  if (!locales || locales.length === 0) return null;

  return (
    <div className="locales-carousel-container">
      <div className="locales-carousel-track" ref={carouselRef}>
        {locales.map((loc) => (
          <div key={loc.id_local} className="locales-carousel-item">
            <div className="locales-carousel-image">
              {loc.logo ? (
                <img src={loc.logo} alt={loc.nombre_local} />
              ) : (
                <i className="fas fa-store"></i>
              )}
            </div>
            <p className="locales-carousel-nombre">{loc.nombre_local}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ClientView({
  activeTab,
  setActiveTab,
  perfil,
  busquedaRealizada,
  setBusquedaRealizada,
  onAvatarUpdate,
}) {
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [repuestosSugeridos, setRepuestosSugeridos] = useState([]);
  const [motoSeleccionada, setMotoSeleccionada] = useState(null);
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [localesDestacados, setLocalesDestacados] = useState([]);
  const [motos, setMotos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [marcas, setMarcas] = useState([]);
  const [modelosFiltrados, setModelosFiltrados] = useState([]);
  const [seleccionMarca, setSeleccionMarca] = useState("");
  const [nuevaMoto, setNuevaMoto] = useState({
    modelo: "",
    anio: "",
    placa: "",
  });
  const [sugerencias, setSugerencias] = useState([]);
  const [motoEditando, setMotoEditando] = useState(null);

  // Funciones de sugerencias y búsqueda
  const obtenerSugerencias = async (motoUsuario) => {
    const { data, error } = await supabase
      .from("productos")
      .select(
        "id_producto, nombre_producto, precio, imagen_url, locales (nombre_local)",
      )
      .ilike("compatibilidad_manual", `%${motoUsuario.modelo}%`)
      .eq("status", true)
      .limit(5);
    if (error) console.log("Error sugerencias:", error);
    else setRepuestosSugeridos(data);
  };

  const ejecutarBusqueda = () => {
    if (!busqueda.trim()) return;
    const base = productos || [];
    const q = busqueda.toLowerCase();
    const resultados = base.filter((prod) => {
      const nombre = (prod.nombre_producto || prod.nombre || "").toLowerCase();
      const compat = (prod.compatibilidad_manual || "").toLowerCase();
      return nombre.includes(q) || compat.includes(q);
    });
    setProductosFiltrados(resultados || []);
    setBusquedaRealizada(true);
    setProductoSeleccionado(null);
  };

  const buscarSugerencias = async (nombreModelo) => {
    if (!nombreModelo) return;
    const { data, error } = await supabase
      .from("productos")
      .select("*, locales(nombre_local)")
      .ilike("compatibilidad_manual", `%${nombreModelo}%`)
      .limit(4);
    if (!error) setSugerencias(data);
  };

  // Cargar CSS
  useEffect(() => {
    let mounted = true;
    import("../assets/css/client.css").then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Cargar datos según la pestaña
  useEffect(() => {
    if (!perfil) return;
    const fetchData = async () => {
      setLoading(true);
      if (activeTab === "inicio") {
        const { data, error } = await supabase
          .from("productos")
          .select(
            `
            *,
            categorias (nombre_categoria),
            locales (nombre_local, telefono, ubicacion_id, ubicaciones (latitud, longitud, direccion_fisica))
          `,
          )
          .eq("status", true);
        if (!error) setProductos(data || []);
        setProductosDestacados(productosEjemplo);
        const { data: localesData } = await supabase
          .from("locales")
          .select("id_local, nombre_local, logo_url")
          .limit(10);
        if (localesData && localesData.length > 0) {
          if (localesData.length < 10) {
            const complemento = localesEjemplo.slice(
              0,
              10 - localesData.length,
            );
            setLocalesDestacados([...localesData, ...complemento]);
          } else {
            setLocalesDestacados(localesData);
          }
        } else {
          setLocalesDestacados(localesEjemplo);
        }
      }
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
      setLoading(false);
    };
    fetchData();
  }, [activeTab, perfil]);

  const loadMotos = async () => {
    if (!perfil) return;
    const { data, error } = await supabase
      .from("motos")
      .select("*")
      .eq("persona_cedula", perfil.cedula)
      .order("id", { ascending: false });
    if (!error) setMotos(data || []);
  };

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

  if (!perfil)
    return <div className="client-view-loading">Cargando perfil...</div>;
  if (perfil?.nombre_rol !== "cliente")
    return <div className="client-view-loading"></div>;

  // Funciones de motos
  const eliminarMoto = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta moto?"))
      return;
    try {
      const { error } = await supabase.from("motos").delete().eq("id", id);
      if (error) throw error;
      setMotos(motos.filter((m) => m.id !== id));
      alert("Moto eliminada correctamente.");
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  };

  const prepararEdicion = (moto) => {
    setMotoEditando(moto.id);
    setSeleccionMarca(moto.marca_id);
    setNuevaMoto({ modelo: moto.modelo, anio: moto.anio, placa: moto.placa });
    setMostrandoFormulario(true);
  };

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
        const { error: err } = await supabase
          .from("motos")
          .update(payload)
          .eq("id", motoEditando);
        error = err;
      } else {
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

  // ========== VISTAS ==========
  if (activeTab === "emergencia") {
    return <Emergencia perfil={perfil} />;
  }

  if (activeTab === "perfil") {
    return (
      <>
        <ClientePerfil onAvatarUpdate={onAvatarUpdate} />
        <button
          className="emergency-fab"
          onClick={() => setActiveTab("emergencia")}
        >
          <i className="fas fa-exclamation-triangle"></i>
          <span>Emergencia Vial</span>
        </button>
      </>
    );
  }

  if (activeTab === "inicio") {
    let coords = null;
    if (productoSeleccionado?.locales?.ubicaciones) {
      const u = productoSeleccionado.locales.ubicaciones;
      if (u.latitud && u.longitud) {
        coords = {
          lat: Number(u.latitud),
          lng: Number(u.longitud),
          direccion_fisica: u.direccion_fisica,
        };
      }
    }
    return (
      <div
        className="client-view"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          margin: 0,
          padding: 0,
        }}
      >
        {!busquedaRealizada ? (
          <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
            <ProductCarousel productos={productosDestacados} />
            <div className="search-card glass-card">
              <h1 className="search-title">¿Qué necesitas hoy?</h1>
              <p className="search-subtitle">
                Encuentra repuestos, talleres y grúas cerca de ti.
              </p>
              <div className="input-group search-input-group">
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
                className="btn-search"
                onClick={ejecutarBusqueda}
              >
                BUSCAR DISPONIBILIDAD
              </button>
            </div>
            <LocalCarousel locales={localesDestacados} />
          </div>
        ) : (
          <>
            <div className="search-results-header">
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
                className="btn-search small"
              >
                Buscar
              </button>
            </div>
            <div className="results-split">
              {/* Lista de Productos Filtrados */}
              <div className="results-list">
                <h3 className="results-count">
                  {productosFiltrados.length} resultados encontrados
                </h3>
                {productosFiltrados.map((prod) => (
                  <div
                    key={prod.id_producto}
                    className={`result-card ${productoSeleccionado?.id_producto === prod.id_producto ? "selected" : ""}`}
                    onClick={() => setProductoSeleccionado(prod)}
                  >
                    <div className="result-img">
                      <i className="fas fa-box"></i>
                    </div>
                    <div className="result-info">
                      <h4 className="result-title">{prod.nombre_producto}</h4>
                      <p className="result-store">{prod.locales?.nombre_local}</p>
                      <div className="result-price">
                        {prod.en_oferta ? (
                          <>
                            <span className="old-price">${prod.precio}</span>
                            <span className="new-price">${(prod.precio * 0.8).toFixed(2)}</span>
                            <span className="offer-badge">Oferta</span>
                          </>
                        ) : (
                          <span className="normal-price">${prod.precio}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Contenedor del Mapa */}
              <div className="map-container">
                {!productoSeleccionado ? (
                  <div className="map-placeholder">
                    <i className="fas fa-map-marked-alt"></i>
                    <p>Toca un producto para ver su ubicación</p>
                  </div>
                ) : coords ? (
                  <div className="map-wrapper">
                    <MapContainer
                      center={[coords.lat, coords.lng]}
                      zoom={15}
                      className="map-leaflet"
                      key={productoSeleccionado?.id_producto}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[coords.lat, coords.lng]}>
                        <Popup>
                          {productoSeleccionado?.locales?.nombre_local}
                        </Popup>
                      </Marker>
                    </MapContainer>
                    <div className="map-details">
                      <h3 className="map-store">{productoSeleccionado?.locales?.nombre_local}</h3>
                      <p className="map-address">
                        <i className="fas fa-map-marker-alt"></i> {coords.direccion_fisica}
                      </p>
                      <p className="map-phone">
                        <i className="fas fa-phone"></i> {productoSeleccionado?.locales?.telefono}
                      </p>

                      {/* Botones circulares gigantes */}
                      <div className="action-circles">
                        <button
                          className="circle-btn google-circle"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`,
                              "_blank"
                            )
                          }
                        >
                          <i className="fab fa-google"></i>
                          <span>Cómo llegar</span>
                        </button>
                        <button
                          className="circle-btn whatsapp-circle"
                          onClick={() => {
                            const msg = encodeURIComponent(
                              `Hola, vi el producto ${productoSeleccionado.nombre_producto} en MotoPro 360 y me interesa.`
                            );
                            window.open(
                              `https://wa.me/${productoSeleccionado.locales.telefono}?text=${msg}`,
                              "_blank"
                            );
                          }}
                        >
                          <i className="fab fa-whatsapp"></i>
                          <span>WhatsApp</span>
                        </button>
                        <a
                          href={`tel:${productoSeleccionado.locales.telefono}`}
                          className="circle-btn call-circle"
                        >
                          <i className="fas fa-phone-alt"></i>
                          <span>Llamar</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="map-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>Este local no tiene coordenadas registradas.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        <button
          className="emergency-fab"
          onClick={() => setActiveTab("emergencia")}
        >
          <i className="fas fa-exclamation-triangle"></i>
          <span>Emergencia Vial</span>
        </button>
      </div>
    );
  }

  if (activeTab === "motos") {
    return (
      <>
        <div className="motos-container">
          <div className="motos-header">
            <h2 className="motos-title">Mis Motos</h2>
            {!mostrandoFormulario && motos.length < 3 && (
              <button
                className="motos-add-btn"
                onClick={() => {
                  setMostrandoFormulario(true);
                  setMotoEditando(null);
                  setNuevaMoto({ modelo: "", anio: "", placa: "" });
                  setSeleccionMarca("");
                }}
              >
                <i className="fas fa-plus"></i> Registrar Moto
              </button>
            )}
          </div>
          {mostrandoFormulario && (
            <div className="moto-form-card">
              <h3>{motoEditando ? "Editar Moto" : "Registrar nueva moto"}</h3>
              <form onSubmit={(e) => e.preventDefault()} className="moto-form">
                <div className="form-group">
                  <label>Marca</label>
                  <select
                    value={seleccionMarca}
                    onChange={(e) => setSeleccionMarca(e.target.value)}
                    required
                  >
                    <option value="">Selecciona una marca</option>
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Modelo</label>
                  <select
                    value={nuevaMoto.modelo}
                    onChange={(e) =>
                      setNuevaMoto({ ...nuevaMoto, modelo: e.target.value })
                    }
                    disabled={!seleccionMarca}
                    required
                  >
                    <option value="">Selecciona un modelo</option>
                    {modelosFiltrados.map((mod) => (
                      <option key={mod.id} value={mod.nombre_modelo}>
                        {mod.nombre_modelo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Placa</label>
                  <input
                    type="text"
                    value={nuevaMoto.placa}
                    onChange={(e) =>
                      setNuevaMoto({ ...nuevaMoto, placa: e.target.value })
                    }
                    placeholder="Ej: ABC123"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Año</label>
                  <input
                    type="number"
                    value={nuevaMoto.anio}
                    onChange={(e) =>
                      setNuevaMoto({ ...nuevaMoto, anio: e.target.value })
                    }
                    placeholder="Ej: 2020"
                  />
                </div>
                <div className="moto-form-actions">
                  <button
                    type="button"
                    onClick={guardarMotoModificada}
                    className="btn-primary"
                  >
                    {motoEditando ? "Actualizar" : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelarEdicion}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
          <div className="motos-list">
            {motos.length === 0 && !mostrandoFormulario ? (
              <p className="motos-empty">
                Aún no has registrado ninguna moto. ¡Agrega una!
              </p>
            ) : (
              motos.map((moto) => (
                <div
                  key={moto.id}
                  className={`moto-card ${motoSeleccionada?.id === moto.id ? "selected" : ""}`}
                  onClick={() => {
                    setMotoSeleccionada(moto);
                    obtenerSugerencias(moto);
                  }}
                >
                  <div className="moto-avatar">
                    <i className="fas fa-motorcycle"></i>
                  </div>
                  <div className="moto-info">
                    <h3 className="moto-nombre">
                      {marcas.find((m) => m.id === moto.marca_id)?.nombre ||
                        "Marca"}{" "}
                      {moto.modelo}
                    </h3>
                    <p className="moto-detalle">
                      <i className="fas fa-calendar-alt"></i>{" "}
                      {moto.anio || "Año no especificado"}
                    </p>
                    <p className="moto-detalle">
                      <i className="fas fa-id-card"></i>{" "}
                      {moto.placa || "Sin placa"}
                    </p>
                  </div>
                  <div className="moto-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prepararEdicion(moto);
                      }}
                      className="moto-edit-btn"
                      title="Editar"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarMoto(moto.id);
                      }}
                      className="moto-delete-btn"
                      title="Eliminar"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {motoSeleccionada && (
            <div className="moto-sugerencias">
              <h3 className="sugerencias-titulo">
                Repuestos sugeridos para tu {motoSeleccionada.modelo}
              </h3>
              {repuestosSugeridos.length > 0 ? (
                <div className="sugerencias-grid">
                  {repuestosSugeridos.map((prod) => (
                    <div key={prod.id_producto} className="sugerencia-card">
                      <div className="sugerencia-img">
                        {prod.imagen_url ? (
                          <img
                            src={prod.imagen_url}
                            alt={prod.nombre_producto}
                          />
                        ) : (
                          <i className="fas fa-box"></i>
                        )}
                      </div>
                      <div className="sugerencia-info">
                        <p className="sugerencia-nombre">
                          {prod.nombre_producto}
                        </p>
                        <p className="sugerencia-precio">${prod.precio}</p>
                        <p className="sugerencia-local">
                          {prod.locales?.nombre_local || "Local desconocido"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="sugerencias-vacio">
                  No hay sugerencias disponibles para esta moto.
                </p>
              )}
            </div>
          )}
        </div>
        <button
          className="emergency-fab"
          onClick={() => setActiveTab("emergencia")}
        >
          <i className="fas fa-exclamation-triangle"></i>
          <span>Emergencia Vial</span>
        </button>
      </>
    );
  }

  if (activeTab === "promos") {
    return (
      <>
        <VistaPromos />
        <button
          className="emergency-fab"
          onClick={() => setActiveTab("emergencia")}
        >
          <i className="fas fa-exclamation-triangle"></i>
          <span>Emergencia Vial</span>
        </button>
      </>
    );
  }

  if (activeTab === "cursos") {
    return (
      <>
        <VistaCursos perfil={perfil} />
        <button
          className="emergency-fab"
          onClick={() => setActiveTab("emergencia")}
        >
          <i className="fas fa-exclamation-triangle"></i>
          <span>Emergencia Vial</span>
        </button>
      </>
    );
  }

  if (activeTab === "comunidad") {
    return (
      <>
        <VistaGrupos perfil={perfil} />
        <button
          className="emergency-fab"
          onClick={() => setActiveTab("emergencia")}
        >
          <i className="fas fa-exclamation-triangle"></i>
          <span>Emergencia Vial</span>
        </button>
      </>
    );
  }

  if (activeTab === "Membresias") {
    return (
      <>
        <VistaMembresias />
      </>
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
      const { data: persona } = await supabase
        .from("personas")
        .select("*")
        .eq("id_auth", user.id)
        .single();
      if (persona) {
        setFormData({
          nombre: persona.nombres || "",
          apellido: persona.apellidos || "",
          email: user.email || "",
          telefono: persona.telefono || "",
          tipoSangre: persona.tipo_sangre || "",
          alergias: persona.alergias || "",
          edad: persona.edad || "",
          genero: persona.genero_id || "",
        });
      }
      setAvatarUrl(user.user_metadata?.avatar_url || null);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      setMessage({ type: "", text: "" });
      if (!event.target.files || event.target.files.length === 0)
        throw new Error("Debes seleccionar una imagen.");
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
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