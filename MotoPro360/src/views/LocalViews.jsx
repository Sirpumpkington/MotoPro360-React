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
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");

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

    const fetchCategorias = async () => {
      const { data } = await supabase.from("categorias").select("*");
      if (data) setCategorias(data);
    };
    fetchCategorias();

    // 1. CARGA DEL LOCAL
    const fetchLocalData = async () => {
      setLoading(true);
      console.log("Cédula del perfil actual:", perfil?.cedula); // DEPURACIÓN

      const { data: localData, error: localError } = await supabase
        .from("locales")
        .select(
          `
      *,
      ubicaciones!inner ( 
        id_ubicacion,
        direccion_fisica,
        latitud,
        longitud,
        ciudad
      )
    `,
        )
        .eq("persona_id", perfil?.cedula)
        .maybeSingle();

      if (localError) console.error("Error Supabase:", localError.message);

      if (localData) {
        setLocalPerfil(localData);
        setDatosLocal({
          nombre_local: localData.nombre_local,
          telefono: localData.telefono,
          direccion_fisica: localData.ubicaciones?.direccion_fisica || "",
        });
        // IMPORTANTE: Aquí llamamos a los productos usando id_local
        fetchProductos(localData.id_local);
      } else {
        // Si entra aquí es porque la cédula en 'personas' no existe en 'locales'
        console.warn("No se encontró local para la cédula:", perfil?.cedula);
        setEditandoPerfil(true);
      }
      setLoading(false);
    };

    // 2. CARGA DE PRODUCTOS
    const fetchProductos = async (idLocal) => {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("local_id", idLocal); // Según tu captura, la columna es local_id

      if (error) console.error("Error productos:", error.message);
      if (data) setProductos(data);
    };

    //Aqui finaliza La consulta del local, ahora falta traer las categorias para el formulario de productos

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

      let ubicacionId = localPerfil?.ubicacion_id;

      // Si el local no tiene ubicación, creamos una primero
      if (!ubicacionId) {
        const { data: ubi, error: ubiError } = await supabase
          .from("ubicaciones")
          .insert([
            {
              direccion_fisica: datosLocal.direccion_fisica,
              latitud: 10.4917, // Coordenadas por defecto (Caracas)
              longitud: -66.8785,
              ciudad: "Caracas",
            },
          ])
          .select()
          .single();
        if (ubiError) throw ubiError;
        ubicacionId = ubi.id_ubicacion;
      }

      // EL CAMBIO AQUÍ: Incluimos el id_local si ya existe y el RIF
      const payload = {
        ...(localPerfil?.id_local && { id_local: localPerfil.id_local }), // Mantiene el ID si ya existe
        persona_id: perfil.cedula,
        nombre_local: datosLocal.nombre_local,
        telefono: datosLocal.telefono,
        ubicacion_id: ubicacionId,
        rif: localPerfil?.rif || "J-00000000-0", // El RIF es obligatorio en tu tabla
      };

      const { data: localGuardado, error } = await supabase
        .from("locales")
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;

      setLocalPerfil(localGuardado);
      setEditandoPerfil(false);
      alert("Perfil actualizado");
    } catch (error) {
      console.error("Error completo:", error);
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

  const eliminarProducto = async (id) => {
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar este producto?",
    );
    if (!confirmar) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id_producto", id); // Usamos el ID exacto de tu tabla

      if (error) throw error;

      // Actualizamos la lista local para que desaparezca visualmente
      setProductos(productos.filter((p) => p.id_producto !== id));
      alert("Producto eliminado con éxito");
    } catch (error) {
      console.error("Error al eliminar:", error.message);
      alert("No se pudo eliminar el producto");
    } finally {
      setLoading(false);
    }
  };

  const editarStock = async (id, stockActual) => {
    const nuevoStock = window.prompt(
      "Actualizar cantidad en inventario:",
      stockActual,
    );

    // Validamos que sea un número y que no haya cancelado
    if (nuevoStock === null || isNaN(nuevoStock)) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("productos")
        .update({ stock_actual: parseInt(nuevoStock) })
        .eq("id_producto", id);

      if (error) throw error;

      // Actualizamos el estado local para que se vea el cambio de inmediato
      setProductos(
        productos.map((p) =>
          p.id_producto === id
            ? { ...p, stock_actual: parseInt(nuevoStock) }
            : p,
        ),
      );
    } catch (error) {
      console.error("Error al actualizar stock:", error.message);
      alert("No se pudo actualizar el stock");
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
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {!editandoPerfil && (
                <button
                  className="btn-secondary"
                  onClick={() => setEditandoPerfil(true)}
                >
                  <i className="fas fa-pen"></i> Editar
                </button>
              )}
            </div>
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
    const productosFiltrados = productos.filter((prod) => {
      const coincideNombre = prod.nombre_producto
        .toLowerCase()
        .includes(busqueda.toLowerCase());
      const coincideCategoria =
        categoriaSeleccionada === "todas" ||
        prod.categoria_id === parseInt(categoriaSeleccionada);
      return coincideNombre && coincideCategoria;
    });
    return (
      <div style={{ padding: "20px" }}>
        {/* BARRA DE BÚSQUEDA */}
        {/* PANEL DE FILTROS */}
        {!creandoProducto && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            {/* Buscador de texto */}
            <div style={{ position: "relative", flex: 2, minWidth: "200px" }}>
              <i
                className="fas fa-search"
                style={{
                  position: "absolute",
                  left: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#999",
                }}
              ></i>
              <input
                type="text"
                placeholder="Buscar repuesto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  borderRadius: "12px",
                  border: "1px solid #eee",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                }}
              />
            </div>

            {/* Selector de Categorías */}
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              style={{
                flex: 1,
                minWidth: "150px",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #eee",
                background: "white",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              }}
            >
              <option value="todas">📁 Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nombre_categoria}
                </option>
              ))}
            </select>
          </div>
        )}
        {creandoProducto ? (
          <div className="glass-card">
            <h3>Nuevo Producto</h3>
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

            {productosFiltrados.map((prod) => (
              <div
                key={prod.id_producto}
                className="data-card"
                style={{
                  padding: "15px",
                  position: "relative",
                  border: "1px solid #eee",
                }}
              >
                {/* GRUPO DE ACCIONES (Superior Derecha) */}
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    display: "flex",
                    gap: "5px",
                  }}
                >
                  {/* Botón Editar Stock */}
                  <button
                    onClick={() =>
                      editarStock(prod.id_producto, prod.stock_actual)
                    }
                    style={{
                      background: "#f0f0f0",
                      color: "#555",
                      border: "none",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Editar Stock"
                  >
                    <i
                      className="fas fa-edit"
                      style={{ fontSize: "0.8rem" }}
                    ></i>
                  </button>

                  {/* Botón Eliminar */}
                  <button
                    onClick={() => eliminarProducto(prod.id_producto)}
                    style={{
                      background: "rgba(255,0,0,0.1)",
                      color: "red",
                      border: "none",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Eliminar"
                  >
                    <i
                      className="fas fa-trash-alt"
                      style={{ fontSize: "0.8rem" }}
                    ></i>
                  </button>
                </div>

                {/* CONTENIDO DE LA TARJETA */}
                <div
                  style={{
                    height: "80px",
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

                <h4
                  style={{
                    fontSize: "0.9rem",
                    margin: "0 0 5px 0",
                    paddingRight: "50px",
                  }}
                >
                  {prod.nombre_producto}
                </h4>

                <p
                  style={{
                    fontWeight: "bold",
                    color: "var(--primary-red)",
                    margin: "0",
                  }}
                >
                  ${prod.precio}
                </p>

                {/* Stock interactivo */}
                <div
                  onClick={() =>
                    editarStock(prod.id_producto, prod.stock_actual)
                  }
                  style={{
                    marginTop: "8px",
                    fontSize: "0.75rem",
                    color: "#666",
                    cursor: "pointer",
                    display: "inline-block",
                    padding: "2px 5px",
                    borderRadius: "4px",
                    background: "#fdfdfd",
                    border: "1px dashed #ccc",
                  }}
                >
                  <i
                    className="fas fa-boxes"
                    style={{ marginRight: "4px" }}
                  ></i>
                  Stock: <strong>{prod.stock_actual}</strong>
                </div>
                {/* (Se muestra el mensaje de "no resultados" fuera del mapeo) */}
              </div>
            ))}
            {/* Mensaje si no hay resultados */}
            {productosFiltrados.length === 0 && !creandoProducto && (
              <div style={{ gridColumn: "1/-1", textAlign: "center" }}>
                <p
                  style={{
                    color: "#999",
                    marginTop: "20px",
                  }}
                >
                  No se encontraron productos que coincidan con "{busqueda}"
                </p>
              </div>
            )}
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
