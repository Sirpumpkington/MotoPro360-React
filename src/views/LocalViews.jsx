import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from "../assets/css/local.module.css";
import TabInicio from "./local_modules/tabinicio.jsx";
import MiLocal from "./local_modules/milocal.jsx";
import Productos from "./local_modules/productos.jsx";
import Ofertas from "./local_modules/ofertas.jsx";
import MembresiasLocal from "./local_modules/membresias.jsx";

export default function LocalView({ activeTab, perfil }) {
  // ==========================================================================
  // ESTADOS PRINCIPALES
  // ==========================================================================
  const [localPerfil, setLocalPerfil] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para formularios
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [creandoProducto, setCreandoProducto] = useState(false);
  const [editandoProducto, setEditandoProducto] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");

  // Estados para estadísticas
  const [statsLocal, setStatsLocal] = useState({
    totalProductos: 0,
    ofertasActivas: 0,
    visitasMes: 1243,
    contactosMes: 87,
  });

  // Estados para Ofertas
  const [historialOfertas, setHistorialOfertas] = useState([]);
  const [estadisticasOfertas, setEstadisticasOfertas] = useState({
    clicsSimulados: 0,
    interesSimulado: 0,
  });
  const [statsInventario, setStatsInventario] = useState({
    total: 0,
    stockBajo: 0,
    sinStock: 0,
  });

  const [logoUrl, setLogoUrl] = useState(null);
  const [portadaUrl, setPortadaUrl] = useState(null);

  // Notificaciones
  const [notificaciones] = useState([
    { id: 1, tipo: "pregunta", usuario: "Carlos M.", mensaje: "¿Tienen punto de venta?", producto: "Batería 7Amp", hace: "5 min" },
    { id: 2, tipo: "interes", usuario: "Maria R.", mensaje: "Guardó tu producto en favoritos", producto: "Casco Integral", hace: "20 min" },
    { id: 3, tipo: "alerta", usuario: "Sistema", mensaje: "Stock bajo (2 unidades)", producto: "Pastillas Freno Del.", hace: "1 hora" },
  ]);

  const [toast, setToast] = useState(null);
  const showToast = (mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  // Datos formulario Local
  const [datosLocal, setDatosLocal] = useState({
    nombre_local: "",
    telefono: "",
    direccion_fisica: "",
    horario_apertura: "",
    horario_cierre: "",
    rubro_id: "",
    rif: "",
    correo: "",
    latitud: null,
    longitud: null,
  });

  // Datos formulario Producto
  const [nuevoProducto, setNuevoProducto] = useState({
    id_producto: null,
    nombre_producto: "",
    precio: "",
    descripcion: "",
    stock_actual: "",
    stock_minimo: 5,
    categoria_id: "",
    modelosSeleccionados: [],
    compat_desde: "",
    compat_hasta: "",
    compatibilidad_manual: "",
    imagen_url: "",
    destacado: false,
  });

  // ==========================================================================
  // FUNCIONES AUXILIARES
  // ==========================================================================
  const resetProductoForm = () => {
    setNuevoProducto({
      id_producto: null,
      nombre_producto: "",
      precio: "",
      descripcion: "",
      stock_actual: "",
      stock_minimo: 5,
      categoria_id: "",
      modelosSeleccionados: [],
      compat_desde: "",
      compat_hasta: "",
      compatibilidad_manual: "",
      imagen_url: "",
      destacado: false,
    });
    setEditandoProducto(null);
  };

  // Nota: Los modelos se cargan dentro de fetchInitialData (useEffect de carga inicial)

  // Cargar productos
  const fetchProductos = async (idLocal) => {
    const { data, error } = await supabase
      .from("productos")
      .select(`*, categorias(nombre_categoria), promociones(*)`)
      .eq("local_id", idLocal)
      .order("created_at", { ascending: false });
    if (error) console.error("Error productos:", error.message);
    if (data) {
      setProductos(data);
      const total = data.length;
      const stockBajo = data.filter(p => p.stock_actual <= (p.stock_minimo || 5)).length;
      const sinStock = data.filter(p => p.stock_actual === 0).length;
      const ofertasActivas = data.filter(p => p.promociones?.some(promo => promo.activa)).length;
      setStatsInventario({ total, stockBajo, sinStock });
      setStatsLocal(prev => ({ ...prev, totalProductos: total, ofertasActivas }));
    }
  };

  // Carga inicial
  useEffect(() => {
    if (!perfil) return;
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [resCat, resMod, resRub] = await Promise.all([
          supabase.from("categorias").select("*"),
          supabase.from("modelos").select(`id, nombre_modelo, marcas (nombre)`).order("nombre_modelo"),
          supabase.from("rubros").select("*"),
        ]);
        if (resCat.data) setCategorias(resCat.data);
        if (resMod.data) setModelos(resMod.data);
        if (resRub.data) setRubros(resRub.data);

        const { data: localData } = await supabase
          .from("locales")
          .select(`*, ubicaciones!inner (*)`)
          .eq("persona_id", perfil?.cedula)
          .maybeSingle();

        if (localData) {
          setLocalPerfil(localData);
          setDatosLocal({
            nombre_local: localData.nombre_local,
            telefono: localData.telefono,
            direccion_fisica: localData.ubicaciones?.direccion_fisica || "",
            horario_apertura: localData.horario_json?.apertura || "",
            horario_cierre: localData.horario_json?.cierre || "",
            rubro_id: localData.rubro_id || "",
            rif: localData.rif || "",
            correo: localData.correo || "",
            latitud: localData.ubicaciones?.latitud || null,
            longitud: localData.ubicaciones?.longitud || null,
          });
          if (localData.imagen_url) setLogoUrl(localData.imagen_url);
          fetchProductos(localData.id_local);
        } else {
          setEditandoPerfil(true);
        }
      } catch (error) {
        console.error("Error inicializando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [perfil]);

  // Guardar perfil del local
  const guardarPerfilLocal = async () => {
    if (!datosLocal.nombre_local || !datosLocal.telefono) {
      showToast("Nombre y Teléfono son obligatorios", "error");
      return;
    }
    try {
      setLoading(true);
      let ubicacionId = localPerfil?.ubicacion_id;

      if (!ubicacionId) {
        const { data: ubi, error: ubiError } = await supabase
          .from("ubicaciones")
          .insert([{ 
            direccion_fisica: datosLocal.direccion_fisica, 
            latitud: datosLocal.latitud || 10.4917, 
            longitud: datosLocal.longitud || -66.8785, 
            ciudad: "Caracas" 
          }])
          .select()
          .single();
        if (ubiError) throw ubiError;
        ubicacionId = ubi.id_ubicacion;
      } else {
        // Actualizar ubicacion existente si ya la hay
        const { error: ubiError } = await supabase
          .from("ubicaciones")
          .update({
            direccion_fisica: datosLocal.direccion_fisica,
            latitud: datosLocal.latitud || 10.4917,
            longitud: datosLocal.longitud || -66.8785,
          })
          .eq("id_ubicacion", ubicacionId);
        if (ubiError) throw ubiError;
      }

      const payload = {
        ...(localPerfil?.id_local && { id_local: localPerfil.id_local }),
        persona_id: perfil.cedula,
        nombre_local: datosLocal.nombre_local,
        telefono: datosLocal.telefono,
        ubicacion_id: ubicacionId,
        horario_json: { apertura: datosLocal.horario_apertura, cierre: datosLocal.horario_cierre },
        rubro_id: datosLocal.rubro_id ? parseInt(datosLocal.rubro_id) : null,
        rif: datosLocal.rif || "J-00000000-0",
        correo: datosLocal.correo,
        imagen_url: logoUrl,
      };

      const { data: localGuardado, error } = await supabase.from("locales").upsert(payload).select().single();
      if (error) throw error;
      setLocalPerfil(localGuardado);
      setEditandoPerfil(false);
      showToast("Perfil actualizado", "success");
    } catch (error) {
      console.error("Error completo:", error);
      showToast("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Manejadores de imagen
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setLogoUrl(URL.createObjectURL(file));
  };
  const handlePortadaUpload = (e) => {
    const file = e.target.files[0];
    if (file) setPortadaUrl(URL.createObjectURL(file));
  };


  // Guardar producto
  const guardarProducto = async () => {
    if (!localPerfil) return showToast("Primero registra tu local en 'Mi Local'", "error");
    try {
      setLoading(true);
      let idProducto;
      
      if (editandoProducto) {
        // Actualizar producto
        const { error: updateErr } = await supabase
          .from("productos")
          .update({
            nombre_producto: nuevoProducto.nombre_producto,
            descripcion: nuevoProducto.descripcion,
            precio: parseFloat(nuevoProducto.precio),
            stock_actual: parseInt(nuevoProducto.stock_actual),
            stock_minimo: parseInt(nuevoProducto.stock_minimo),
            categoria_id: parseInt(nuevoProducto.categoria_id),
            imagen_url: nuevoProducto.imagen_url,
          })
          .eq("id_producto", nuevoProducto.id_producto);
        if (updateErr) throw updateErr;
        idProducto = nuevoProducto.id_producto;
      } else {
        // Insertar nuevo
        const { data: inserted, error: insertErr } = await supabase
          .from("productos")
          .insert([{
            local_id: localPerfil.id_local,
            nombre_producto: nuevoProducto.nombre_producto,
            descripcion: nuevoProducto.descripcion,
            precio: parseFloat(nuevoProducto.precio),
            stock_actual: parseInt(nuevoProducto.stock_actual),
            stock_minimo: parseInt(nuevoProducto.stock_minimo),
            categoria_id: parseInt(nuevoProducto.categoria_id),
            imagen_url: nuevoProducto.imagen_url,
            status: true,
          }])
          .select()
          .single();
        if (insertErr) throw insertErr;
        idProducto = inserted.id_producto || inserted.id;
      }

      // Manejar compatibilidades
      if (editandoProducto) {
        await supabase.from("productos_compatibilidad").delete().eq("id_producto", idProducto);
      }
      if (nuevoProducto.modelosSeleccionados.length > 0) {
        const desde = nuevoProducto.compat_desde ? Number(nuevoProducto.compat_desde) : null;
        const hasta = nuevoProducto.compat_hasta ? Number(nuevoProducto.compat_hasta) : null;
        const compatRows = nuevoProducto.modelosSeleccionados.map((idModelo) => ({
          id_producto: idProducto,
          id_modelo: Number(idModelo),
          anio_desde: desde,
          anio_hasta: hasta,
        }));
        const { error: compatErr } = await supabase.from("productos_compatibilidad").insert(compatRows);
        if (compatErr) throw compatErr;
      }

      resetProductoForm();
      setCreandoProducto(false);
      fetchProductos(localPerfil.id_local);
      showToast(editandoProducto ? "Producto actualizado" : "Producto publicado", "success");
    } catch (error) {
      console.error(error);
      showToast("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar producto
  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      setLoading(true);
      const { error } = await supabase.from("productos").delete().eq("id_producto", id);
      if (error) throw error;
      setProductos(productos.filter((p) => p.id_producto !== id));
      showToast("Producto eliminado", "success");
    } catch (error) {
      showToast("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Editar stock
  const editarStock = async (id, stockActual) => {
    const nuevoStock = window.prompt("Actualizar cantidad en inventario:", stockActual);
    if (nuevoStock === null || isNaN(nuevoStock)) return;
    try {
      setLoading(true);
      const { error } = await supabase.from("productos").update({ stock_actual: parseInt(nuevoStock) }).eq("id_producto", id);
      if (error) throw error;
      setProductos(productos.map((p) => (p.id_producto === id ? { ...p, stock_actual: parseInt(nuevoStock) } : p)));
      showToast("Stock actualizado", "success");
    } catch (error) {
      showToast("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Cargar producto para edición
  const cargarProductoParaEditar = (producto) => {
    setNuevoProducto({
      id_producto: producto.id_producto,
      nombre_producto: producto.nombre_producto,
      precio: producto.precio,
      descripcion: producto.descripcion || "",
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo || 5,
      categoria_id: producto.categoria_id,
      modelosSeleccionados: [],
      compat_desde: "",
      compat_hasta: "",
      compatibilidad_manual: "",
      imagen_url: producto.imagen_url || "",
      destacado: producto.destacado || false,
    });
    setEditandoProducto(producto);
    setCreandoProducto(true);
  };

  // Validación de rol
  if (perfil?.nombre_rol !== "local") return null;

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================
  const renderToast = () => {
    if (!toast) return null;
    return (
      <div style={{
        position: "fixed", bottom: "20px", right: "20px",
        background: toast.tipo === "error" ? "var(--primary-red)" : "#10b981",
        color: "white", padding: "12px 24px", borderRadius: "8px", 
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)", zIndex: 9999,
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <i className={`fas ${toast.tipo === "error" ? "fa-exclamation-circle" : "fa-check-circle"}`}></i>
        {toast.mensaje}
      </div>
    );
  };

  if (activeTab === "inicio") {
    return (
      <>
        <TabInicio localPerfil={localPerfil} productos={productos} stats={statsLocal} notificaciones={notificaciones}/>
        {renderToast()}
      </>
    );
  }

  if (activeTab === "mi-local") {
    return (
      <>
        <MiLocal
          editandoPerfil={editandoPerfil}
          setEditandoPerfil={setEditandoPerfil}
          datosLocal={datosLocal}
          setDatosLocal={setDatosLocal}
          localPerfil={localPerfil}
          guardarPerfilLocal={guardarPerfilLocal}
          loading={loading}
          stats={statsLocal}
          rubros={rubros}
          logoUrl={logoUrl}
          handleLogoUpload={handleLogoUpload}
        />
        {renderToast()}
      </>
    );
  }

  if (activeTab === "productos") {
    const productosFiltrados = productos.filter((prod) => {
      const coincideNombre = prod.nombre_producto.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = categoriaSeleccionada === "todas" || prod.categoria_id === parseInt(categoriaSeleccionada);
      return coincideNombre && coincideCategoria;
    });
    return (
      <>
        <Productos
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          categoriaSeleccionada={categoriaSeleccionada}
          setCategoriaSeleccionada={setCategoriaSeleccionada}
          categorias={categorias}
          creandoProducto={creandoProducto}
          setCreandoProducto={setCreandoProducto}
          nuevoProducto={nuevoProducto}
          setNuevoProducto={setNuevoProducto}
          guardarProducto={guardarProducto}
          productosFiltrados={productosFiltrados}
          editarStock={editarStock}
          eliminarProducto={eliminarProducto}
          modelos={modelos}
          statsInventario={statsInventario}
          cargarProductoParaEditar={cargarProductoParaEditar}
          localPerfil={localPerfil}
        />
        {renderToast()}
      </>
    );
  }

  if (activeTab === "ofertas") {
    return (
      <>
        <Ofertas
          productos={productos}
          onRefresh={() => fetchProductos(localPerfil.id_local)}
          historialOfertas={historialOfertas}
          setHistorialOfertas={setHistorialOfertas}
          estadisticasOfertas={estadisticasOfertas}
          setEstadisticasOfertas={setEstadisticasOfertas}
        />
        {renderToast()}
      </>
    );
  }

  return (
    <>
      <MembresiasLocal localPerfil={localPerfil} />
      {renderToast()}
    </>
  );
}