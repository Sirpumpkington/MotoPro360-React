import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from "../assets/css/local.module.css"; // Asegúrate de tener este archivo para estilos específicos
import TabInicio from "./local_modules/tabinicio.jsx"; // Importamos la pestaña de inicio para mostrar notificaciones
import MiLocal from "./local_modules/MiLocal.jsx"; // Importamos el componente de Mi Local para editar perfil
import Productos from "./local_modules/Productos.jsx"; // Importamos el componente de Productos para gestionar inventario
import Ofertas from "./local_modules/ofertas.jsx"; // Importamos el componente de Ofertas para gestionar promociones

export default function LocalView({ activeTab, perfil }) {
  // --- ESTADOS GLOBALES ---
  const [localPerfil, setLocalPerfil] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modelos, setModelos] = useState([]); // Para la compatibilidad
  const [loading, setLoading] = useState(false);

  // --- ESTADOS PARA FORMULARIOS ---
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [creandoProducto, setCreandoProducto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");

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
    stock_minimo: 5,
    categoria_id: "",
    compatibilidad_ids: [],
  });

  // --- 1. FUNCIÓN PARA CARGAR PRODUCTOS ---
  // Moviendo esto aquí arriba para que el useEffect la pueda usar sin problemas
  const fetchProductos = async (idLocal) => {
    const { data, error } = await supabase
      .from("productos")
      .select("*, categorias(nombre_categoria)")
      .eq("local_id", idLocal)
      .order("created_at", { ascending: false });

    if (error) console.error("Error productos:", error.message);
    if (data) {
      setProductos(data);
      // Extraemos los IDs que ya están en oferta en la BD para pintar los botones de naranja
      const ofertasActivas = data
        .filter((p) => p.en_oferta)
        .map((p) => p.id_producto);
      setOfertasSimuladas(ofertasActivas);
    }
  }; // Implementada las Ofertas como un campo booleano en productos para pruebas, luego se puede cambiar a una tabla aparte si se desea más complejidad
  //OJO, Prueba con Gemini, si no funciona, vuelve a la versión anterior que usaba un array de IDs en el estado para simular las ofertas. La idea es que cada producto tenga un campo "en_oferta" que se actualice al activar/desactivar la oferta, así evitamos tener que manejar un estado separado para las ofertas simuladas.

  // --- 2. CARGA INICIAL DE DATOS ---
  useEffect(() => {
    if (!perfil) return;

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Traer Categorías y Modelos en paralelo
        const [resCat, resMod] = await Promise.all([
          supabase.from("categorias").select("*"),
          supabase.from("modelos").select("*").order("nombre_modelo"),
        ]);

        if (resCat.data) setCategorias(resCat.data);
        if (resMod.data) setModelos(resMod.data);

        // Cargar Local
        const { data: localData } = await supabase
          .from("locales")
          .select(`*, ubicaciones!inner (*)`)
          .eq("persona_id", perfil?.cedula)
          .maybeSingle();

        if (localData) {
          setLocalPerfil(localData);
          // Actualizamos los datos del formulario con lo que viene de la BD
          setDatosLocal({
            nombre_local: localData.nombre_local,
            telefono: localData.telefono,
            direccion_fisica: localData.ubicaciones?.direccion_fisica || "",
          });
          // Llamar productos ahora que sabemos que existe el local
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
        .eq("id_producto", id); // Usamos el ID exacto de la tabla

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

  const toggleOferta = async (idProducto) => {
    try {
      const estaEnOferta = ofertasSimuladas.includes(idProducto);
      const nuevoEstado = !estaEnOferta; // Cambiamos al estado contrario

      // 1. Guardamos en Supabase
      const { error } = await supabase
        .from("productos")
        .update({ en_oferta: nuevoEstado })
        .eq("id_producto", idProducto);

      if (error) throw error;

      // 2. Actualizamos la vista local
      if (estaEnOferta) {
        setOfertasSimuladas(ofertasSimuladas.filter((id) => id !== idProducto));
        alert("Oferta desactivada");
      } else {
        setOfertasSimuladas([...ofertasSimuladas, idProducto]);
        alert("¡Oferta Flash activada en la base de datos!");
      }
    } catch (error) {
      alert("Error al actualizar la oferta: " + error.message);
    }
  }; //OJO Este también es parte de la implementación real de las ofertas, ahora cada producto tiene un campo "en_oferta" que se actualiza al activar/desactivar la oferta, y el estado local se sincroniza con la base de datos para reflejar los cambios en la UI.

  // --- VISTAS ---
  if (perfil?.nombre_rol !== "local") return null;

  // 1. PESTAÑA INICIO (Notificaciones)
  if (activeTab === "inicio") {
    return (
      <TabInicio localPerfil={localPerfil} notificaciones={notificaciones} />
    );
  }

  // 2. PESTAÑA MI LOCAL (Perfil)
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
      />
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
      />
    );
  }

  // 4. PESTAÑA OFERTAS (Simulada)
  if (activeTab === "ofertas") {
    return (
      <Ofertas
        productos={productos}
        ofertasSimuladas={ofertasSimuladas}
        toggleOferta={toggleOferta}
      />
    );
  }

  if (activeTab === "membresias") {
  }
  return (
    <div className={styles.membresias}>
      <h2>Gestión de Membresías</h2>
      <p>Próximamente podrás gestionar tus membresías aquí.</p>
    </div>
  );

  return null;
}
