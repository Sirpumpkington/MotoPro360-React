import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from "../assets/css/local.module.css";
import TabInicio from "./local_modules/tabinicio.jsx";
import MiLocal from "./local_modules/MiLocal.jsx";
import Productos from "./local_modules/productos.jsx";
import Ofertas from "./local_modules/ofertas.jsx";

export default function LocalView({ activeTab, perfil }) {
  // ==========================================================================
  // ESTADOS PRINCIPALES
  // ==========================================================================
  const [localPerfil, setLocalPerfil] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modelos, setModelos] = useState([]);
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
  const [statsInventario, setStatsInventario] = useState({
    total: 0,
    stockBajo: 0,
    sinStock: 0,
  });

  // Estados para MiLocal
  const [metodosPago, setMetodosPago] = useState([]);
  const [horarios, setHorarios] = useState({
    lunes: { abierto: true, apertura: "09:00", cierre: "18:00" },
    martes: { abierto: true, apertura: "09:00", cierre: "18:00" },
    miercoles: { abierto: true, apertura: "09:00", cierre: "18:00" },
    jueves: { abierto: true, apertura: "09:00", cierre: "18:00" },
    viernes: { abierto: true, apertura: "09:00", cierre: "18:00" },
    sabado: { abierto: false, apertura: "", cierre: "" },
    domingo: { abierto: false, apertura: "", cierre: "" },
  });
  const [logoUrl, setLogoUrl] = useState(null);
  const [portadaUrl, setPortadaUrl] = useState(null);

  // Notificaciones
  const [notificaciones] = useState([
    { id: 1, tipo: "pregunta", usuario: "Carlos M.", mensaje: "¿Tienen punto de venta?", producto: "Batería 7Amp", hace: "5 min" },
    { id: 2, tipo: "interes", usuario: "Maria R.", mensaje: "Guardó tu producto en favoritos", producto: "Casco Integral", hace: "20 min" },
    { id: 3, tipo: "alerta", usuario: "Sistema", mensaje: "Stock bajo (2 unidades)", producto: "Pastillas Freno Del.", hace: "1 hora" },
  ]);

  // Datos formulario Local
  const [datosLocal, setDatosLocal] = useState({
    nombre_local: "",
    telefono: "",
    direccion_fisica: "",
    horario_apertura: "",
    horario_cierre: "",
    tipo_comercio: "",
    rif: "",
    descripcion: "",
    email: "",
    sitio_web: "",
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

  // Cargar modelos
  useEffect(() => {
    const fetchModelos = async () => {
      const { data, error } = await supabase
        .from("modelos")
        .select(`id, nombre_modelo, marcas (nombre)`)
        .order("nombre_modelo");
      if (error) console.error(error);
      else setModelos(data);
    };
    fetchModelos();
  }, []);

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
        const [resCat, resMod] = await Promise.all([
          supabase.from("categorias").select("*"),
          supabase.from("modelos").select(`id, nombre_modelo, marcas (nombre)`).order("nombre_modelo"),
        ]);
        if (resCat.data) setCategorias(resCat.data);
        if (resMod.data) setModelos(resMod.data);

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
            horario_apertura: localData.horario_apertura || "",
            horario_cierre: localData.horario_cierre || "",
            tipo_comercio: localData.tipo_comercio || "",
            rif: localData.rif || "",
            descripcion: localData.descripcion || "",
            email: localData.email || "",
            sitio_web: localData.sitio_web || "",
          });
          if (localData.logo_url) setLogoUrl(localData.logo_url);
          if (localData.portada_url) setPortadaUrl(localData.portada_url);
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
      alert("Nombre y Teléfono son obligatorios");
      return;
    }
    try {
      setLoading(true);
      let ubicacionId = localPerfil?.ubicacion_id;

      if (!ubicacionId) {
        const { data: ubi, error: ubiError } = await supabase
          .from("ubicaciones")
          .insert([{ direccion_fisica: datosLocal.direccion_fisica, latitud: 10.4917, longitud: -66.8785, ciudad: "Caracas" }])
          .select()
          .single();
        if (ubiError) throw ubiError;
        ubicacionId = ubi.id_ubicacion;
      }

      const payload = {
        ...(localPerfil?.id_local && { id_local: localPerfil.id_local }),
        persona_id: perfil.cedula,
        nombre_local: datosLocal.nombre_local,
        telefono: datosLocal.telefono,
        ubicacion_id: ubicacionId,
        horario_apertura: datosLocal.horario_apertura,
        horario_cierre: datosLocal.horario_cierre,
        tipo_comercio: datosLocal.tipo_comercio,
        rif: datosLocal.rif || "J-00000000-0",
        descripcion: datosLocal.descripcion,
        email: datosLocal.email,
        sitio_web: datosLocal.sitio_web,
        logo_url: logoUrl,
        portada_url: portadaUrl,
      };

      const { data: localGuardado, error } = await supabase.from("locales").upsert(payload).select().single();
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

  // Manejadores de imagen
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setLogoUrl(URL.createObjectURL(file));
  };
  const handlePortadaUpload = (e) => {
    const file = e.target.files[0];
    if (file) setPortadaUrl(URL.createObjectURL(file));
  };

  // Guardar producto (incluye oferta)
  const guardarProducto = async ({ descuento, fechaExpiracion }) => {
    if (!localPerfil) return alert("Primero registra tu local en 'Mi Local'");
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
            destacado: nuevoProducto.destacado,
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
            destacado: nuevoProducto.destacado,
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

      // Manejar oferta (promoción)
      if (descuento && descuento > 0 && fechaExpiracion) {
        // Verificar si ya existe una promoción para este producto
        const { data: promocionesExistentes } = await supabase
          .from("promociones")
          .select("id")
          .eq("id_producto", idProducto)
          .maybeSingle();

        const payloadPromo = {
          id_producto: idProducto,
          descuento_porcentaje: parseFloat(descuento),
          fecha_expiracion: fechaExpiracion,
          activa: true,
        };

        if (promocionesExistentes) {
          // Actualizar
          await supabase.from("promociones").update(payloadPromo).eq("id", promocionesExistentes.id);
        } else {
          // Insertar
          await supabase.from("promociones").insert([payloadPromo]);
        }
      } else {
        // Si no hay descuento, desactivar cualquier promoción existente
        await supabase.from("promociones").update({ activa: false }).eq("id_producto", idProducto);
      }

      resetProductoForm();
      setCreandoProducto(false);
      fetchProductos(localPerfil.id_local);
      alert(editandoProducto ? "Producto actualizado" : "Producto publicado");
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
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
      alert("Producto eliminado");
    } catch (error) {
      alert("Error: " + error.message);
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
      alert("Stock actualizado");
    } catch (error) {
      alert("Error: " + error.message);
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
  if (activeTab === "inicio") {
    return <TabInicio localPerfil={localPerfil} notificaciones={notificaciones} stats={statsLocal} />;
  }

  if (activeTab === "mi-local") {
    return (
      <MiLocal
        editandoPerfil={editandoPerfil}
        setEditandoPerfil={setEditandoPerfil}
        datosLocal={datosLocal}
        setDatosLocal={setDatosLocal}
        localPerfil={localPerfil}
        guardarPerfilLocal={guardarPerfilLocal}
        loading={loading}
        stats={statsLocal}
        metodosPago={metodosPago}
        setMetodosPago={setMetodosPago}
        horarios={horarios}
        setHorarios={setHorarios}
        logoUrl={logoUrl}
        portadaUrl={portadaUrl}
        handleLogoUpload={handleLogoUpload}
        handlePortadaUpload={handlePortadaUpload}
      />
    );
  }

  if (activeTab === "productos") {
    const productosFiltrados = productos.filter((prod) => {
      const coincideNombre = prod.nombre_producto.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = categoriaSeleccionada === "todas" || prod.categoria_id === parseInt(categoriaSeleccionada);
      return coincideNombre && coincideCategoria;
    });
    return (
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
      />
    );
  }

  if (activeTab === "ofertas") {
    return <Ofertas productos={productos} onRefresh={() => fetchProductos(localPerfil.id_local)} />;
  }

  return (
    <div className={styles.membresias}>
      <h2>Gestión de Membresías</h2>
      <p>Próximamente podrás gestionar tus membresías aquí.</p>
    </div>
  );
}