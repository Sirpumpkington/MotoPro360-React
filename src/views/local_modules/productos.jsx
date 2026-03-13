import React, { useState } from "react";
import styles from "../../assets/css/local.module.css";
import Select from "react-select";

// Objeto base para producto vacío
const PRODUCTO_VACIO = {
  nombre_producto: "",
  categoria_id: "",
  precio: "",
  stock_actual: "",
  stock_minimo: "",
  imagen_url: "",
  descripcion: "",
  modelosSeleccionados: [],
  compat_desde: "",
  compat_hasta: "",
  id_producto: null,
};

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
  guardarProducto,           // Función que guarda el producto y su oferta en Supabase
  productosFiltrados,
  editarStock,
  eliminarProducto,
  modelos,
  statsInventario,
  cargarProductoParaEditar,
  onRefresh,
  localPerfil,
}) {
  const [vista, setVista] = useState("grid");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [mostrandoEstadisticas, setMostrandoEstadisticas] = useState(false);



  // Aplicar filtros adicionales
  const productosConFiltros = productosFiltrados.filter(prod => {
    if (filtroEstado === "stockBajo") return prod.stock_actual <= (prod.stock_minimo || 5);
    if (filtroEstado === "sinStock") return prod.stock_actual === 0;
    if (filtroEstado === "destacados") return prod.destacado;
    return true;
  });

  // Función para manejar el clic en una tarjeta (editar)
  const handleCardClick = (producto) => {
    cargarProductoParaEditar(producto);
  };

  // Función para limpiar el formulario al cancelar
  const handleCancelar = () => {
    setNuevoProducto({ ...PRODUCTO_VACIO });
    setCreandoProducto(false);
  };

  // Función para iniciar creación de producto
  const handleAgregarClick = () => {
    const membresiaActual = localPerfil?.nivel_membresia?.toLowerCase() || "gratis";
    if (membresiaActual === "gratis" && (statsInventario?.total || 0) >= 10) {
      alert("Has alcanzado el límite de 10 productos para el plan Gratis. ¡Mejora tu plan para agregar más!");
      return;
    }
    if (membresiaActual === "pro" && (statsInventario?.total || 0) >= 20) {
      alert("Has alcanzado el límite de 20 productos para el plan Pro. ¡Mejora al plan Premium para no tener límites!");
      return;
    }
    setNuevoProducto({ ...PRODUCTO_VACIO });
    setCreandoProducto(true);
  };

  // Manejador del envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Llamar a guardarProducto (que debe ser una función async que guarda en Supabase)
      await guardarProducto();
      
      // Refrescar la lista de productos desde el padre
      if (onRefresh) {
        await onRefresh(); // Se asume que onRefresh es async y recarga los datos
      }
      
      // Salir del modo edición/creación
      handleCancelar();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      alert("Ocurrió un error al guardar el producto.");
    }
  };

  return (
    <div className={styles.productosContainer}>
      {/* Cabecera con estadísticas */}
      <div className={styles.inventarioHeader}>
        <h2><i className="fas fa-boxes"></i> Inventario</h2>
        <div className={styles.statsChips}>
          <div className={styles.statChip} onClick={() => setMostrandoEstadisticas(!mostrandoEstadisticas)}>
            <i className="fas fa-chart-pie"></i>
            <span>{statsInventario?.total || 0} productos</span>
          </div>
          {statsInventario?.stockBajo > 0 && (
            <div className={`${styles.statChip} ${styles.warning}`} onClick={() => setFiltroEstado('stockBajo')}>
              <i className="fas fa-exclamation-triangle"></i>
              <span>{statsInventario.stockBajo} stock bajo</span>
            </div>
          )}
          {statsInventario?.sinStock > 0 && (
            <div className={`${styles.statChip} ${styles.danger}`} onClick={() => setFiltroEstado('sinStock')}>
              <i className="fas fa-times-circle"></i>
              <span>{statsInventario.sinStock} agotados</span>
            </div>
          )}
        </div>
      </div>

      {/* Panel de estadísticas expandible */}
      {mostrandoEstadisticas && (
        <div className={styles.statsPanel}>
          <h4><i className="fas fa-chart-bar"></i> Estadísticas rápidas</h4>
          <div className={styles.statsGridSmall}>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{statsInventario?.total || 0}</span>
              <span className={styles.statLabel}>Total productos</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{categorias?.length || 0}</span>
              <span className={styles.statLabel}>Categorías</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>
                {productosFiltrados.filter(p => p.stock_actual > 0).length}
              </span>
              <span className={styles.statLabel}>Con stock</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>
                {productosFiltrados.filter(p => p.destacado).length}
              </span>
              <span className={styles.statLabel}>Destacados</span>
            </div>
          </div>
        </div>
      )}

      {/* Barra de herramientas */}
      <div className={styles.toolbar}>
        <div className={styles.filtrosBar}>
          <div className={styles.searchWrapper}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar repuesto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            className={styles.categoriaSelect}
          >
            <option value="todas">📁 Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id_categoria} value={cat.id_categoria}>
                {cat.nombre_categoria}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${vista === 'grid' ? styles.active : ''}`}
            onClick={() => setVista('grid')}
            title="Vista cuadrícula"
          >
            <i className="fas fa-th"></i>
          </button>
          <button
            className={`${styles.viewBtn} ${vista === 'list' ? styles.active : ''}`}
            onClick={() => setVista('list')}
            title="Vista lista"
          >
            <i className="fas fa-list"></i>
          </button>
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className={styles.quickFilters}>
        <button
          className={`${styles.filterChip} ${filtroEstado === 'todos' ? styles.active : ''}`}
          onClick={() => setFiltroEstado('todos')}
        >
          <i className="fas fa-asterisk"></i> Todos
        </button>
        <button
          className={`${styles.filterChip} ${filtroEstado === 'destacados' ? styles.active : ''}`}
          onClick={() => setFiltroEstado('destacados')}
        >
          <i className="fas fa-star"></i> Destacados
        </button>
        <button
          className={`${styles.filterChip} ${filtroEstado === 'stockBajo' ? styles.active : ''}`}
          onClick={() => setFiltroEstado('stockBajo')}
        >
          <i className="fas fa-exclamation-triangle"></i> Stock bajo
        </button>
        <button
          className={`${styles.filterChip} ${filtroEstado === 'sinStock' ? styles.active : ''}`}
          onClick={() => setFiltroEstado('sinStock')}
        >
          <i className="fas fa-times-circle"></i> Sin stock
        </button>
      </div>

      {!creandoProducto ? (
        <>
          {/* Grid/Lista de productos */}
          <div className={vista === 'grid' ? styles.productosGrid : styles.productosList}>
            {/* Tarjeta para agregar nuevo */}
            <div
              className={styles.addCard}
              onClick={handleAgregarClick}
              role="button"
              tabIndex={0}
            >
              <i className="fas fa-plus"></i>
              <p>Agregar producto</p>
            </div>

            {productosConFiltros.map((prod) => (
              <div
                key={prod.id_producto}
                className={vista === 'grid' ? styles.productCard : styles.productRow}
                onClick={() => handleCardClick(prod)}
              >
                {vista === 'grid' ? (
                  <>
                    <div className={styles.cardActions}>
                      <button
                        onClick={(e) => { e.stopPropagation(); editarStock(prod.id_producto, prod.stock_actual); }}
                        title="Editar stock"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); eliminarProducto(prod.id_producto); }}
                        title="Eliminar"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                    <div className={styles.cardImagePlaceholder}>
                      {prod.imagen_url ? (
                        <img src={prod.imagen_url} alt={prod.nombre_producto} />
                      ) : (
                        <i className="fas fa-box"></i>
                      )}
                      {prod.destacado && <span className={styles.featuredBadge}>⭐ Destacado</span>}
                    </div>
                    <h4>{prod.nombre_producto}</h4>
                    <div className={styles.productPrice}>${prod.precio}</div>
                    <div
                      className={`${styles.productStock} ${prod.stock_actual <= (prod.stock_minimo || 5) ? styles.lowStock : ''}`}
                      onClick={(e) => { e.stopPropagation(); editarStock(prod.id_producto, prod.stock_actual); }}
                    >
                      <i className="fas fa-boxes"></i> Stock: <strong>{prod.stock_actual}</strong>
                    </div>
                  </>
                ) : (
                  // Vista de lista
                  <div className={styles.productRowContent}>
                    <div className={styles.rowImage}>
                      {prod.imagen_url ? (
                        <img src={prod.imagen_url} alt={prod.nombre_producto} />
                      ) : (
                        <i className="fas fa-box"></i>
                      )}
                    </div>
                    <div className={styles.rowInfo}>
                      <h4>{prod.nombre_producto}</h4>
                      <p className={styles.rowCategory}>{prod.categorias?.nombre_categoria}</p>
                    </div>
                    <div className={styles.rowPrice}>${prod.precio}</div>
                    <div className={styles.rowStock}>
                      <span className={prod.stock_actual <= (prod.stock_minimo || 5) ? styles.lowStock : ''}>
                        {prod.stock_actual} uds
                      </span>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        onClick={(e) => { e.stopPropagation(); editarStock(prod.id_producto, prod.stock_actual); }}
                        title="Editar stock"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); eliminarProducto(prod.id_producto); }}
                        title="Eliminar"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {productosConFiltros.length === 0 && (
              <div className={styles.noResults}>
                <i className="fas fa-box-open"></i>
                <p>No se encontraron productos con los filtros seleccionados.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        // Formulario de creación/edición con descuento
        <div className={styles.productForm}>
          <h2><i className="fas fa-plus-circle"></i> {nuevoProducto.id_producto ? "Editar Producto" : "Nuevo Producto"}</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Nombre *</label>
                <input
                  type="text"
                  value={nuevoProducto.nombre_producto}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre_producto: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Categoría *</label>
                <select
                  value={nuevoProducto.categoria_id}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria_id: e.target.value })}
                  required
                >
                  <option value="">Selecciona</option>
                  {categorias.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Precio ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoProducto.precio}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Stock *</label>
                <input
                  type="number"
                  value={nuevoProducto.stock_actual}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock_actual: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Stock mínimo</label>
              <input
                type="number"
                value={nuevoProducto.stock_minimo}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock_minimo: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Imagen (URL)</label>
              <input
                type="url"
                value={nuevoProducto.imagen_url}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, imagen_url: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Descripción</label>
              <textarea
                rows="3"
                value={nuevoProducto.descripcion}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, descripcion: e.target.value })}
              />
            </div>



            <h3 className={styles.sectionTitle}>Compatibilidad</h3>
            <div className={styles.formGroup}>
              <label>Modelos compatibles</label>
              <Select
                isMulti
                options={modelos.map((m) => ({
                  value: m.id,
                  label: `${m.nombre_modelo} (${m.marcas?.nombre || "Sin marca"})`,
                }))}
                value={modelos
                  .filter((m) => nuevoProducto.modelosSeleccionados.includes(m.id))
                  .map((m) => ({
                    value: m.id,
                    label: `${m.nombre_modelo} (${m.marcas?.nombre || "Sin marca"})`,
                  }))}
                onChange={(selected) => {
                  const ids = selected ? selected.map((s) => s.value) : [];
                  setNuevoProducto({ ...nuevoProducto, modelosSeleccionados: ids });
                }}
                placeholder="Selecciona modelos..."
                styles={{
                  control: (base) => ({ ...base, padding: "2px", borderRadius: "12px", borderColor: "var(--gray)" }),
                  menu: (base) => ({ ...base, zIndex: 10 }),
                }}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Año desde</label>
                <input
                  type="number"
                  placeholder="Ej: 2010"
                  value={nuevoProducto.compat_desde}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, compat_desde: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Año hasta</label>
                <input
                  type="number"
                  placeholder="Ej: 2025"
                  value={nuevoProducto.compat_hasta}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, compat_hasta: e.target.value })}
                />
              </div>
            </div>



            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary}>Guardar</button>
              <button type="button" className={styles.btnSecondary} onClick={handleCancelar}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}