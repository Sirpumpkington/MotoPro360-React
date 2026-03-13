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
import MotosView from "./client_modules/motos.jsx";
// productos de ejemplo

// Función compartida para promociones
const obtenerPromocionActiva = (producto) => {
  if (!producto.promociones || producto.promociones.length === 0) return null;
  const ahora = new Date();
  return producto.promociones.find(
    (p) => p.activa && new Date(p.fecha_expiracion) >= ahora,
  );
};

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
              {(() => {
                const promo = obtenerPromocionActiva(prod);
                if (promo) {
                  const pFinal = (prod.precio * (1 - promo.descuento_porcentaje / 100)).toFixed(2);
                  return (
                    <>
                      <p className="carousel-precio" style={{ color: "var(--primary-red)" }}>
                        <span style={{ textDecoration: "line-through", color: "#999", fontSize: "0.8rem", marginRight: "6px" }}>${prod.precio}</span>
                        ${pFinal}
                      </p>
                      <span className="offer-badge" style={{ position: "absolute", top: "10px", right: "10px", padding: "4px 8px", background: "var(--primary-red)", color: "white", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold" }}>
                        {promo.descuento_porcentaje}% OFF
                      </span>
                    </>
                  );
                }
                return <p className="carousel-precio">${prod.precio}</p>;
              })()}
              <p className="carousel-stock">Quedan {prod.stock_actual !== undefined ? prod.stock_actual : (prod.stock || "varios")}</p>
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
              {loc.imagen_url || loc.logo ? (
                <img src={loc.imagen_url || loc.logo} alt={loc.nombre_local} />
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
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [localesDestacados, setLocalesDestacados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);

  const ejecutarBusqueda = () => {
    // 1. Si el input está vacío, reseteamos todo para volver al inicio
    if (!busqueda.trim()) {
      setBusquedaRealizada(false);
      setProductosFiltrados([]);
      setProductoSeleccionado(null);
      return;
    }

    // 2. Si hay texto, procedemos con el filtro flexible
    const base = productos || [];
    // Normalizar la búsqueda eliminando acentos y espacios extra
    const q = busqueda.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Crear una expresión regular flexible para permitir plurales (s, es) opcionales al final de las palabras
    // ej: 'freno' o 'frenos' coincidirán con 'freno'
    const words = q.split(/\s+/).filter(w => w.length > 0);
    const regexPattern = words.map(w => {
        // Remover 's' o 'es' final de la palabra de búsqueda si lo tiene para la base de la regex
        let baseWord = w;
        if (w.endsWith('es') && w.length > 3) baseWord = w.slice(0, -2);
        else if (w.endsWith('s') && w.length > 2) baseWord = w.slice(0, -1);
        
        // Coincidir con la palabra base, seguida opcionalmente de otras letras (para cubrir plurales o terminaciones)
        return `(?=.*${baseWord})`; 
    }).join('');
    
    const searchRegex = new RegExp(regexPattern, 'i');

    const resultados = base.filter((prod) => {
      const nombre = (prod.nombre_producto || prod.nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return searchRegex.test(nombre);
    }).sort((a, b) => {
      // Dejamos la prioridad vacía para ahora que no hay membresias en la BD
      return 0;
    });

    setProductosFiltrados(resultados);
    setBusquedaRealizada(true);
    setProductoSeleccionado(null);
  };


  {/*Busqueda de productos por nombre desde la seccion de promociones*/}
  const handleSearchProduct = (nombre) => {
    setBusqueda(nombre);
    
    const base = productos || [];
    const q = nombre.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    {/*Aqui se normaliza el texto para que no haya problemas con las busquedas*/}
    const words = q.split(/\s+/).filter(w => w.length > 0);
    const regexPattern = words.map(w => {
        let baseWord = w;
        if (w.endsWith('es') && w.length > 3) baseWord = w.slice(0, -2);
        else if (w.endsWith('s') && w.length > 2) baseWord = w.slice(0, -1);
        return `(?=.*${baseWord})`; 
    }).join('');
    
    const searchRegex = new RegExp(regexPattern, 'i');


    {/*AQUI SE HACE LA BUSQUEDA Y RESPETA LAS PROMOS*/}
    const resultados = base.filter((prod) => {
      const pNombre = (prod.nombre_producto || prod.nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return searchRegex.test(pNombre);
    });

    setProductosFiltrados(resultados);
    setBusquedaRealizada(true);
    setProductoSeleccionado(null);
    setActiveTab("inicio");
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
      locales (nombre_local, telefono, horario_json, rubros (*), ubicacion_id, ubicaciones (latitud, longitud, direccion_fisica)),
      promociones (*)
    `,
          )
          .eq("status", true);

        if (!error && data) {
           setProductos(data);
           
           const ordenados = [...data].sort((a, b) => {
             const pa = obtenerPromocionActiva(a) ? 1 : 0;
             const pb = obtenerPromocionActiva(b) ? 1 : 0;
             return pb - pa;
           });

           setProductosDestacados(ordenados.slice(0, 10));
        }

        {
          /*Hasta Aquí*/
        }
        const { data: localesData } = await supabase
          .from("locales")
          .select("id_local, nombre_local, imagen_url")
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
      setLoading(false);
    };
    fetchData();
  }, [activeTab, perfil]);

  if (!perfil)
    return <div className="client-view-loading">Cargando perfil...</div>;
  if (perfil?.nombre_rol !== "cliente")
    return <div className="client-view-loading"></div>;

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
              <button className="btn-search" onClick={ejecutarBusqueda}>
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
              <button onClick={ejecutarBusqueda} className="btn-search small">
                Buscar
              </button>
            </div>
            <div className="results-split">
              {/* Lista de Productos Filtrados */}
              <div className="results-list">
                <h3 className="results-count">
                  {productosFiltrados.length} resultados encontrados
                </h3>

                {/*ESTO TAMBIEN ESTA SIENDO MODIFICADO*/}
                {productosFiltrados.map((prod) => {
                  const promoActiva = obtenerPromocionActiva(prod);
                  const precioOriginal = prod.precio;
                  let precioFinal = precioOriginal;
                  let descuento = 0;

                  if (promoActiva) {
                    descuento = promoActiva.descuento_porcentaje;
                    precioFinal = (
                      precioOriginal *
                      (1 - descuento / 100)
                    ).toFixed(2);
                  }

                  return (
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
                        <p className="result-store">
                          {prod.locales?.nombre_local}
                        </p>

                        {/* PRECIO CON OFERTA (si aplica) */}
                        <div className="result-price">
                          {promoActiva ? (
                            <>
                              <span className="old-price">
                                ${precioOriginal}
                              </span>
                              <span className="new-price">${precioFinal}</span>
                              <span className="offer-badge">
                                {descuento}% OFF
                              </span>
                            </>
                          ) : (
                            <span className="normal-price">
                              ${precioOriginal}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/*Hasta aquí*/}
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
                      <h3 className="map-store">
                        {productoSeleccionado?.locales?.nombre_local}
                      </h3>
                      <p className="map-address">
                        <i className="fas fa-map-marker-alt"></i>{" "}
                        {coords.direccion_fisica}
                      </p>
                      <p className="map-phone">
                        <i className="fas fa-phone"></i>{" "}
                        {productoSeleccionado?.locales?.telefono}
                      </p>
                      {productoSeleccionado?.locales?.rubros && (
                        <p className="map-category" style={{ fontSize: "0.9rem", color: "var(--gray)", display: "flex", gap: "8px", alignItems: "center", margin: "4px 0" }}>
                          <i className="fas fa-tag"></i>{" "}
                          {productoSeleccionado.locales.rubros.nombre || productoSeleccionado.locales.rubros.nombre_rubro || productoSeleccionado.locales.rubros.titulo || "Local"}
                        </p>
                      )}
                      {productoSeleccionado?.locales?.horario_json && (
                        <p className="map-hours" style={{ fontSize: "0.9rem", color: "var(--gray)", display: "flex", gap: "8px", alignItems: "center", margin: "4px 0" }}>
                          <i className="fas fa-clock"></i>{" "}
                          {productoSeleccionado.locales.horario_json.apertura 
                            ? `${productoSeleccionado.locales.horario_json.apertura} - ${productoSeleccionado.locales.horario_json.cierre}` 
                            : "Horario no disponible"}
                        </p>
                      )}

                      {/* Info adicional del Producto */}
                      {productoSeleccionado && (
                        <div className="map-product-details" style={{ marginTop: "1rem", padding: "1rem", background: "var(--bg-light)", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "1rem" }}>
                            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                                {productoSeleccionado.imagen_url ? (
                                    <img src={productoSeleccionado.imagen_url} alt={productoSeleccionado.nombre_producto} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />
                                ) : (
                                    <div style={{ width: "80px", height: "80px", background: "#e5e7eb", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <i className="fas fa-box" style={{ fontSize: "2rem", color: "var(--gray)" }}></i>
                                    </div>
                                )}
                                <div>
                                    <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--dark-gray)" }}>{productoSeleccionado.nombre_producto}</h4>
                                    <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-color)", lineHeight: "1.4" }}>
                                        {productoSeleccionado.descripcion || "Sin descripción disponible."}
                                    </p>
                                </div>
                            </div>
                        </div>
                      )}

                      {/* Botones circulares gigantes */}
                      <div className="action-circles">
                        <button
                          className="circle-btn google-circle"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`,
                              "_blank",
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
                              `Hola, vi el producto ${productoSeleccionado.nombre_producto} en MotoPro 360 y me interesa.`,
                            );
                            window.open(
                              `https://wa.me/${productoSeleccionado.locales.telefono}?text=${msg}`,
                              "_blank",
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
        <MotosView perfil={perfil} />
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
        <VistaPromos onVerDetalles={handleSearchProduct} />
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
