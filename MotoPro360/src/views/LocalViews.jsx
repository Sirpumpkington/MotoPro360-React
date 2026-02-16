import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function LocalView({ activeTab, perfil }) {
  // --- ESTADOS GLOBALES ---
  const [localPerfil, setLocalPerfil] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- ESTADOS PARA FORMULARIOS ---
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [creandoProducto, setCreandoProducto] = useState(false);

  //Aqui van los estilos para el local, como el estado de las ofertas, notificaciones, etc.
  useEffect(() => {
    let mounted = true;
    import("../assets/css/local.css").then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, []);
  // --- ESTADOS SIMULADOS (Ofertas y Notificaciones) ---
  const [notificaciones] = useState([
    {
      id: 1,
      tipo: "pregunta",
      usuario: "Carlos M.",
      mensaje: "¿Tienen punto de venta?",
      producto: "Batería 7Amp",
      hace: "5 min",
    },
    {
      id: 2,
      tipo: "interes",
      usuario: "Maria R.",
      mensaje: "Guardó tu producto en favoritos",
      producto: "Casco Integral",
      hace: "20 min",
    },
    {
      id: 3,
      tipo: "alerta",
      usuario: "Sistema",
      mensaje: "Stock bajo (2 unidades)",
      producto: "Pastillas Freno Del.",
      hace: "1 hora",
    },
  ]);

  const [ofertasSimuladas, setOfertasSimuladas] = useState([]); // Lista de IDs de productos en oferta

  // Datos formulario Local
  const [datosLocal, setDatosLocal] = useState({
    nombre_local: "",
    telefono: "",
    direccion_fisica: "",
  });

  // Datos formulario Producto
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_producto: "",
    precio: "",
    descripcion: "",
    stock_actual: "",
    categoria_id: "",
    compatibilidad_manual: "",
  });

  // --- 1. CARGA INICIAL DE DATOS ---
  useEffect(() => {
    if (!perfil) return;

    const fetchLocalData = async () => {
      setLoading(true);

      // Buscar Perfil del Local
      const { data: localData } = await supabase
        .from("locales")
        .select("*, ubicaciones(*)")
        .eq("persona_id", perfil.cedula)
        .maybeSingle();

      if (localData) {
        setLocalPerfil(localData);
        setDatosLocal({
          nombre_local: localData.nombre_local,
          telefono: localData.telefono,
          direccion_fisica: localData.ubicaciones?.direccion_fisica || "",
        });
        fetchProductos(localData.id_local);
      } else {
        // Si es nuevo usuario local, lo mandamos a editar perfil
        setEditandoPerfil(true);
      }

      // Cargar Categorias
      const { data: cats } = await supabase.from("categorias").select("*");
      if (cats) setCategorias(cats);

      setLoading(false);
    };

    fetchLocalData();
  }, [perfil]);

  // Recargar productos
  const fetchProductos = async (idLocal) => {
    const { data } = await supabase
      .from("productos")
      .select("*, categorias(nombre_categoria)")
      .eq("local_id", idLocal)
      .eq("status", true)
      .order("created_at", { ascending: false });
    if (data) setProductos(data);
  };

  // --- FUNCIONES (Guardar Perfil, Productos, Ofertas) ---

  const guardarPerfilLocal = async () => {
    if (!datosLocal.nombre_local || !datosLocal.telefono) {
      alert("Nombre y Teléfono son obligatorios");
      return;
    }
    try {
      setLoading(true);

      // 1. Manejo de Ubicación (AQUÍ DEBERÍAS USAR EL MAPA REAL LUEGO)
      // Por ahora, si ya existe ubicación, la actualizamos. Si no, creamos una nueva.
      let ubicacionId = localPerfil?.ubicacion_id;

      if (!ubicacionId) {
        // Solo insertamos si no existe
        const { data: ubi } = await supabase
          .from("ubicaciones")
          .insert([
            {
              direccion_fisica: datosLocal.direccion_fisica,
              latitud: 0, // OJO: Pendiente integrar mapa real
              longitud: 0,
            },
          ])
          .select()
          .single();
        ubicacionId = ubi.id_ubicacion;
      } else {
        // Actualizamos la dirección texto
        await supabase
          .from("ubicaciones")
          .update({ direccion_fisica: datosLocal.direccion_fisica })
          .eq("id_ubicacion", ubicacionId);
      }

      // 2. Upsert del Local
      const payload = {
        persona_id: perfil.cedula,
        nombre_local: datosLocal.nombre_local,
        telefono: datosLocal.telefono,
        ubicacion_id: ubicacionId,
      };

      const { data: localGuardado, error } = await supabase
        .from("locales")
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;

      setLocalPerfil(localGuardado);
      setEditandoPerfil(false);
      alert("Perfil actualizado correctamente");
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const guardarProducto = async () => {
    if (!localPerfil) return alert("Primero registra tu local en 'Mi Local'");

    try {
      setLoading(true);
      const { error } = await supabase.from("productos").insert([
        {
          local_id: localPerfil.id_local,
          nombre_producto: nuevoProducto.nombre_producto,
          descripcion: nuevoProducto.descripcion,
          precio: parseFloat(nuevoProducto.precio),
          stock_actual: parseInt(nuevoProducto.stock_actual),
          categoria_id: parseInt(nuevoProducto.categoria_id),
          compatibilidad_manual: nuevoProducto.compatibilidad_manual,
          status: true,
        },
      ]);

      if (error) throw error;

      setCreandoProducto(false);
      // Limpiar form
      setNuevoProducto({
        nombre_producto: "",
        precio: "",
        descripcion: "",
        stock_actual: "",
        categoria_id: "",
        compatibilidad_manual: "",
      });
      fetchProductos(localPerfil.id_local);
      alert("Producto publicado");
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleOferta = (idProducto) => {
    // Simulación: Agregamos o quitamos el ID del array de ofertas
    if (ofertasSimuladas.includes(idProducto)) {
      setOfertasSimuladas(ofertasSimuladas.filter((id) => id !== idProducto));
      alert("Oferta desactivada");
    } else {
      setOfertasSimuladas([...ofertasSimuladas, idProducto]);
      alert("¡Oferta Flash activada por 24h! (Simulado)");
    }
  };

  // --- VISTAS ---
  if (perfil?.nombre_rol !== "local") return null;

  // 1. PESTAÑA INICIO (Notificaciones)
  if (activeTab === "inicio") {
    return (
      <div style={{ padding: "20px" }}>
        <div className="welcome-card-local" style={{ marginBottom: "20px" }}>
          <h2>👋 Hola, {localPerfil?.nombre_local || "Comerciante"}</h2>
          <p>Aquí tienes lo que ha pasado mientras no estabas.</p>
        </div>

        <h3 style={{ color: "#555" }}>Actividad Reciente</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {notificaciones.map((notif) => (
            <div
              key={notif.id}
              className="glass-card"
              style={{
                display: "flex",
                gap: "15px",
                alignItems: "center",
                padding: "15px",
                borderLeft: "4px solid var(--primary-red)",
              }}
            >
              <div
                style={{
                  background: "#eee",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className={`fas ${notif.tipo === "pregunta" ? "fa-question" : notif.tipo === "venta" ? "fa-dollar-sign" : "fa-heart"}`}
                  style={{ color: "#666" }}
                ></i>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>
                  {notif.mensaje}
                </p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
                  En:{" "}
                  <span style={{ color: "var(--primary-red)" }}>
                    {notif.producto}
                  </span>{" "}
                  • {notif.usuario}
                </p>
              </div>
              <span style={{ fontSize: "0.7rem", color: "#999" }}>
                {notif.hace}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. PESTAÑA MI LOCAL (Perfil)
  if (activeTab === "mi-local") {
    return (
      <div style={{ padding: "20px" }}>
        <div className="glass-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ margin: 0 }}>🏪 Configuración del Local</h2>
            {!editandoPerfil && (
              <button
                className="btn-secondary"
                onClick={() => setEditandoPerfil(true)}
              >
                <i className="fas fa-pen"></i> Editar
              </button>
            )}
          </div>

          {!editandoPerfil ? (
            <div>
              {localPerfil ? (
                <>
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        background: "#f0f0f0",
                        borderRadius: "50%",
                        margin: "0 auto 10px auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i
                        className="fas fa-store"
                        style={{ fontSize: "2rem", color: "#ccc" }}
                      ></i>
                    </div>
                    <h3 style={{ margin: 0 }}>{localPerfil.nombre_local}</h3>
                    <span
                      className="badge"
                      style={{
                        background: "#d4edda",
                        color: "#155724",
                        padding: "5px 10px",
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                      }}
                    >
                      Activo
                    </span>
                  </div>
                  <div style={{ marginTop: "20px" }}>
                    <p>
                      <strong>Teléfono:</strong> {localPerfil.telefono}
                    </p>
                    <p>
                      <strong>Dirección:</strong>{" "}
                      {datosLocal.direccion_fisica || "No especificada"}
                    </p>
                    <p>
                      <strong>RIF:</strong> J-12345678-9 (Simulado)
                    </p>
                  </div>
                </>
              ) : (
                <p>No hay datos registrados. ¡Configura tu local!</p>
              )}
            </div>
          ) : (
            <div className="form-container">
              <label>Nombre Comercial</label>
              <input
                type="text"
                value={datosLocal.nombre_local}
                onChange={(e) =>
                  setDatosLocal({ ...datosLocal, nombre_local: e.target.value })
                }
              />

              <label>Teléfono (WhatsApp)</label>
              <input
                type="text"
                value={datosLocal.telefono}
                onChange={(e) =>
                  setDatosLocal({ ...datosLocal, telefono: e.target.value })
                }
              />

              <label>Dirección Detallada</label>
              <textarea
                rows="3"
                value={datosLocal.direccion_fisica}
                onChange={(e) =>
                  setDatosLocal({
                    ...datosLocal,
                    direccion_fisica: e.target.value,
                  })
                }
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  className="btn-main-login"
                  onClick={guardarPerfilLocal}
                  disabled={loading}
                >
                  Guardar Cambios
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setEditandoPerfil(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. PESTAÑA PRODUCTOS (Inventario)
  if (activeTab === "productos") {
    return (
      <div style={{ padding: "20px" }}>
        {creandoProducto ? (
          <div className="glass-card">
            <h3>📦 Nuevo Producto</h3>
            <label>Nombre</label>
            <input
              type="text"
              value={nuevoProducto.nombre_producto}
              onChange={(e) =>
                setNuevoProducto({
                  ...nuevoProducto,
                  nombre_producto: e.target.value,
                })
              }
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label>Precio ($)</label>
                <input
                  type="number"
                  value={nuevoProducto.precio}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      precio: e.target.value,
                    })
                  }
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Stock</label>
                <input
                  type="number"
                  value={nuevoProducto.stock_actual}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      stock_actual: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <label>Categoría</label>
            <select
              value={nuevoProducto.categoria_id}
              onChange={(e) =>
                setNuevoProducto({
                  ...nuevoProducto,
                  categoria_id: e.target.value,
                })
              }
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            >
              <option value="">Seleccione...</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre_categoria}
                </option>
              ))}
            </select>

            <label>Descripción</label>
            <textarea
              value={nuevoProducto.descripcion}
              onChange={(e) =>
                setNuevoProducto({
                  ...nuevoProducto,
                  descripcion: e.target.value,
                })
              }
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button className="btn-main-login" onClick={guardarProducto}>
                Publicar
              </button>
              <button
                className="btn-secondary"
                onClick={() => setCreandoProducto(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div
            className="local-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "15px",
            }}
          >
            <div
              className="data-card"
              onClick={() => setCreandoProducto(true)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed var(--primary-red)",
                cursor: "pointer",
                minHeight: "220px",
              }}
            >
              <i
                className="fas fa-plus"
                style={{ fontSize: "2rem", color: "var(--primary-red)" }}
              ></i>
              <p
                style={{
                  marginTop: "10px",
                  color: "var(--primary-red)",
                  fontWeight: "bold",
                }}
              >
                Agregar
              </p>
            </div>

            {productos.map((prod) => (
              <div
                key={prod.id_producto}
                className="data-card"
                style={{ padding: "10px", position: "relative" }}
              >
                <div
                  style={{
                    height: "100px",
                    background: "#f9f9f9",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "10px",
                  }}
                >
                  <i
                    className="fas fa-box"
                    style={{ color: "#ccc", fontSize: "2rem" }}
                  ></i>
                </div>
                <h4 style={{ fontSize: "0.9rem", margin: "0 0 5px 0" }}>
                  {prod.nombre_producto}
                </h4>
                <p style={{ fontWeight: "bold", color: "var(--primary-red)" }}>
                  ${prod.precio}
                </p>
                <span style={{ fontSize: "0.75rem", color: "#666" }}>
                  Stock: {prod.stock_actual}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 4. PESTAÑA OFERTAS (Simulada)
  if (activeTab === "ofertas") {
    return (
      <div style={{ padding: "20px" }}>
        <div
          className="welcome-card-local"
          style={{
            background: "linear-gradient(135deg, #FF9900 0%, #FFCC00 100%)",
            color: "white",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ color: "white" }}>🔥 Zona de Ofertas</h2>
          <p style={{ color: "white" }}>
            Selecciona un producto para aplicar un descuento flash.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "15px",
          }}
        >
          {productos.length === 0 ? (
            <p>No tienes productos para ofertar.</p>
          ) : (
            productos.map((prod) => {
              const enOferta = ofertasSimuladas.includes(prod.id_producto);
              return (
                <div
                  key={prod.id_producto}
                  className="data-card"
                  style={{
                    padding: "15px",
                    border: enOferta ? "2px solid #FF9900" : "1px solid #eee",
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <h4 style={{ margin: 0 }}>{prod.nombre_producto}</h4>
                    {enOferta && (
                      <span
                        className="badge"
                        style={{ background: "red", color: "white" }}
                      >
                        -20% OFF
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "5px 0", color: "#666" }}>
                    Precio regular: ${prod.precio}
                  </p>

                  {enOferta && (
                    <p
                      style={{
                        fontWeight: "bold",
                        color: "#FF9900",
                        fontSize: "1.1rem",
                      }}
                    >
                      Ahora: ${(prod.precio * 0.8).toFixed(2)}
                    </p>
                  )}

                  <button
                    className="btn-main-login"
                    style={{
                      width: "100%",
                      marginTop: "10px",
                      background: enOferta ? "#333" : "#FF9900",
                      border: "none",
                    }}
                    onClick={() => toggleOferta(prod.id_producto)}
                  >
                    {enOferta ? "Terminar Oferta" : "Aplicar Descuento"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return null;
}
