// ============================================
// COMPONENTE: MotosView
// Ubicación sugerida: /client_modules/MotosView.jsx
// Descripción: Gestiona el registro, edición, eliminación y visualización
//              de las motos del cliente, además de sugerir repuestos
//              compatibles según la moto seleccionada.
// ============================================

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient"; // Ajusta la ruta según tu proyecto

export default function MotosView({ perfil }) {
  // ------------------------------------------------------------
  // ESTADOS LOCALES
  // ------------------------------------------------------------
  const [motos, setMotos] = useState([]); // Lista de motos del usuario
  const [marcas, setMarcas] = useState([]); // Todas las marcas disponibles
  const [modelosFiltrados, setModelosFiltrados] = useState([]); // Modelos según marca
  const [modelosAll, setModelosAll] = useState([]); // Todos los modelos (para búsquedas)

  const [seleccionMarca, setSeleccionMarca] = useState(""); // Marca elegida en el formulario
  const [nuevaMoto, setNuevaMoto] = useState({
    // Datos del formulario
    id_modelo: "",
    anio: "",
    placa: "",
  });

  const [motoEditando, setMotoEditando] = useState(null); // ID de la moto editándose
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false); // Visibilidad form
  const [motoSeleccionada, setMotoSeleccionada] = useState(null); // Moto seleccionada
  const [repuestosSugeridos, setRepuestosSugeridos] = useState([]); // Repuestos sugeridos

  // Estados de carga (NUEVO)
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSugerencias, setIsLoadingSugerencias] = useState(false);

  // ------------------------------------------------------------
  // FUNCIONES PARA SUGERENCIAS DE REPUESTOS
  // ------------------------------------------------------------
  const obtenerSugerencias = async (motoUsuario) => {
    setIsLoadingSugerencias(true);
    try {
      // Obtener el ID del modelo (puede venir como id_modelo o como nombre)
      let modelId = motoUsuario.id_modelo ?? null;
      if (!modelId && motoUsuario.modelo) {
        const found = modelosAll.find(
          (md) => md.nombre_modelo === motoUsuario.modelo,
        );
        modelId = found?.id || null;
      }

      if (!modelId) {
        setRepuestosSugeridos([]);
        return;
      }

      // Buscar en la tabla de compatibilidad
      const { data: compat } = await supabase
        .from("productos_compatibilidad")
        .select("id_producto")
        .eq("id_modelo", modelId)
        .limit(5);

      const ids = (compat || []).map((c) => c.id_producto);
      if (ids.length === 0) {
        setRepuestosSugeridos([]);
        return;
      }

      // Obtener los detalles de los productos
      const { data: prods, error } = await supabase
        .from("productos")
        .select(
          "id_producto, nombre_producto, precio, imagen_url, locales (nombre_local)",
        )
        .in("id_producto", ids)
        .limit(5);

      if (error) throw error;
      setRepuestosSugeridos(prods || []);
    } catch (err) {
      console.error("Error sugerencias:", err);
      setRepuestosSugeridos([]);
    } finally {
      setIsLoadingSugerencias(false);
    }
  };

  // ------------------------------------------------------------
  // FUNCIONES CRUD DE MOTOS
  // ------------------------------------------------------------
  // Envuelto en useCallback para evitar warnings en el useEffect (CORRECCIÓN)
  const loadMotos = useCallback(async () => {
    if (!perfil) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("motos")
      .select("*")
      .eq("persona_cedula", perfil.cedula)
      .order("id", { ascending: false });

    if (!error) setMotos(data || []);
    setIsLoading(false);
  }, [perfil]);

  const eliminarMoto = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta moto?"))
      return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("motos").delete().eq("id", id);
      if (error) throw error;

      setMotos(motos.filter((m) => m.id !== id));

      // Limpiar selección si se elimina la moto activa (CORRECCIÓN)
      if (motoSeleccionada?.id === id) {
        setMotoSeleccionada(null);
        setRepuestosSugeridos([]);
      }

      alert("Moto eliminada correctamente.");
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const prepararEdicion = (moto) => {
    setMotoEditando(moto.id);
    setSeleccionMarca(moto.marca_id);
    setNuevaMoto({
      id_modelo: moto.id_modelo || "", // Evita fallos si viene nulo (CORRECCIÓN)
      anio: moto.anio || "",
      placa: moto.placa || "",
    });
    setMostrandoFormulario(true);
  };

  const guardarMotoModificada = async () => {
    if (!perfil?.cedula) return;
    if (!seleccionMarca || !nuevaMoto.id_modelo || !nuevaMoto.placa) {
      alert("Completa todos los campos obligatorios.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        id_modelo: Number(nuevaMoto.id_modelo),
        placa: nuevaMoto.placa, // Ya viene en mayúsculas desde el input
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
    } finally {
      setIsLoading(false);
    }
  };

  const cancelarEdicion = () => {
    setMostrandoFormulario(false);
    setMotoEditando(null);
    setSeleccionMarca("");
    setNuevaMoto({ id_modelo: "", anio: "", placa: "" });
  };

  // ------------------------------------------------------------
  // EFECTOS SECUNDARIOS (CARGA DE DATOS)
  // ------------------------------------------------------------
  useEffect(() => {
    if (!perfil) return;

    const fetchMarcas = async () => {
      const { data } = await supabase
        .from("marcas")
        .select("*")
        .order("nombre", { ascending: true });
      if (data) setMarcas(data);
    };

    const fetchAllModelos = async () => {
      const { data } = await supabase
        .from("modelos")
        .select("id, nombre_modelo, marca_id, marcas ( nombre )");
      if (data) setModelosAll(data);
    };

    fetchMarcas();
    fetchAllModelos();
    loadMotos();
  }, [perfil, loadMotos]); // loadMotos ahora es estable gracias a useCallback

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

  // ------------------------------------------------------------
  // RENDERIZADO DE LA VISTA
  // ------------------------------------------------------------
  if (!perfil) return null;

  return (
    <div className="motos-container">
      {/* Cabecera */}
      <div className="motos-header">
        <h2 className="motos-title">Mis Motos</h2>
        {!mostrandoFormulario && motos.length < 3 && (
          <button
            className="motos-add-btn"
            onClick={() => {
              setMostrandoFormulario(true);
              setMotoEditando(null);
              setNuevaMoto({ id_modelo: "", anio: "", placa: "" });
              setSeleccionMarca("");
            }}
            disabled={isLoading}
          >
            <i className="fas fa-plus"></i> Registrar Moto
          </button>
        )}
      </div>

      {/* Formulario */}
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
                disabled={isLoading}
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
                value={nuevaMoto.id_modelo}
                onChange={(e) =>
                  setNuevaMoto({ ...nuevaMoto, id_modelo: e.target.value })
                }
                disabled={!seleccionMarca || isLoading}
                required
              >
                <option value="">Selecciona un modelo</option>
                {modelosFiltrados.map((mod) => (
                  <option key={mod.id} value={mod.id}>
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
                  setNuevaMoto({
                    ...nuevaMoto,
                    placa: e.target.value.toUpperCase(),
                  })
                } // Fuerza mayúsculas (NUEVO)
                placeholder="Ej: ABC123"
                required
                disabled={isLoading}
                maxLength={10}
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
                disabled={isLoading}
              />
            </div>

            <div className="moto-form-actions">
              <button
                type="button"
                onClick={guardarMotoModificada}
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading
                  ? "Guardando..."
                  : motoEditando
                    ? "Actualizar"
                    : "Guardar"}
              </button>
              <button
                type="button"
                onClick={cancelarEdicion}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de motos registradas */}
      <div className="motos-list">
        {isLoading && motos.length === 0 ? (
          <p className="motos-loading">Cargando tus motos...</p>
        ) : motos.length === 0 && !mostrandoFormulario ? (
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
                  {modelosAll.find((md) => md.id === moto.id_modelo)
                    ?.nombre_modelo || moto.modelo}
                </h3>
                <p className="moto-detalle">
                  <i className="fas fa-calendar-alt"></i>{" "}
                  {moto.anio || "Año no especificado"}
                </p>
                <p className="moto-detalle">
                  <i className="fas fa-id-card"></i> {moto.placa || "Sin placa"}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sugerencias de repuestos */}
      {motoSeleccionada && (
        <div className="moto-sugerencias">
          <h3 className="sugerencias-titulo">
            Repuestos sugeridos para tu {motoSeleccionada.modelo || "moto"}
          </h3>

          {isLoadingSugerencias ? (
            <p className="sugerencias-loading">
              Buscando repuestos compatibles...
            </p>
          ) : repuestosSugeridos.length > 0 ? (
            <div className="sugerencias-grid">
              {repuestosSugeridos.map((prod) => (
                <div key={prod.id_producto} className="sugerencia-card">
                  <div className="sugerencia-img">
                    {prod.imagen_url ? (
                      <img src={prod.imagen_url} alt={prod.nombre_producto} />
                    ) : (
                      <i className="fas fa-box"></i>
                    )}
                  </div>
                  <div className="sugerencia-info">
                    <p className="sugerencia-nombre">{prod.nombre_producto}</p>
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
              No hay sugerencias disponibles para esta moto en este momento.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
