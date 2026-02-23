import React from "react";
import styles from "../../assets/css/local.module.css";

export default function Productos({
  busqueda,
  setBusqueda,
  categoriaSeleccionada,
  setCategoriaSeleccionada,
  categorias,
  creandoProducto,
  setCreandoProducto,
  nuevoProducto,
  setNuevoProducto,
  guardarProducto,
  productosFiltrados,
  editarStock,
  eliminarProducto,
}) {
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
                  <i className="fas fa-edit" style={{ fontSize: "0.8rem" }}></i>
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
                onClick={() => editarStock(prod.id_producto, prod.stock_actual)}
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
                <i className="fas fa-boxes" style={{ marginRight: "4px" }}></i>
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
