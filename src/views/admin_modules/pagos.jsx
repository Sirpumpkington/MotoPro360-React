import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import styles from "../../assets/css/admin.module.css";

const Pagos = () => {
  const [pagos, setPagos] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("pendiente");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const cargarPagos = async () => {
    setLoading(true);
    // Hacemos el join con personas y membresias para obtener los nombres reales
    const { data, error } = await supabase
      .from("pagos")
      .select(`
        *,
        personas ( nombres, apellidos, telefono ),
        membresias ( nombre )
      `)
      .order("created_at", { ascending: false });

    if (data) setPagos(data);
    else if (error) console.error("Error al cargar pagos:", error);
    setLoading(false);
  };

  useEffect(() => {
    cargarPagos();
  }, []);

  const cambiarEstado = async (id, nuevoEstado) => {
    let confirmMsg = "";
    if (nuevoEstado === "aprobado") {
      confirmMsg = "¿Aprobar este pago? La membresía del usuario se activará automáticamente.";
    } else if (nuevoEstado === "rechazado") {
      confirmMsg = "¿Rechazar este pago? El usuario deberá generar otro reporte de pago válido.";
    } else if (nuevoEstado === "eliminar") {
      confirmMsg = "¿Eliminar permanentemente este registro de pago? Esta acción no se puede deshacer.";
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      if (nuevoEstado === "eliminar") {
        const { error } = await supabase
          .from("pagos")
          .delete()
          .eq("id_pago", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pagos")
          .update({ 
            estado: nuevoEstado,
            fecha_aprobacion: nuevoEstado === "aprobado" ? new Date().toISOString() : null
          })
          .eq("id_pago", id);
        
        if (error) throw error;
      }
      alert(`✅ Pago ${nuevoEstado === "eliminar" ? "eliminado" : "actualizado"} correctamente.`);
      cargarPagos();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  };

  // Filtrado múltiple (por cédula, nombre, nro referencia)
  const pagosFiltrados = pagos
    .filter(p => filtroEstado === "todos" || p.estado === filtroEstado)
    .filter(p => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const cedulaStr = String(p.cedula_persona);
      const refStr = String(p.nro_referencia || "").toLowerCase();
      const nombreCompleto = `${p.personas?.nombres || ""} ${p.personas?.apellidos || ""}`.toLowerCase();
      return cedulaStr.includes(term) || refStr.includes(term) || nombreCompleto.includes(term);
    });

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "aprobado":
        return <span className={styles.badgeAprobado}>Aprobado</span>;
      case "pendiente":
        return <span className={styles.badgePendiente}>Pendiente</span>;
      case "rechazado":
        return <span className={styles.badgeRechazado}>Rechazado</span>;
      default:
        return <span className={styles.badgePendiente}>{estado}</span>;
    }
  };

  return (
    <div className={styles.gruposAdminContainer}>
      {/* Header */}
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.adminTitle}>Pagos y Membresías</h1>
          <p className={styles.adminSubtitle}>
            Administra reportes de pago y activa los accesos de los usuarios.
          </p>
        </div>
        <div className={styles.statsCards}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{pagos.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>
              {pagos.filter(p => p.estado === "pendiente").length}
            </span>
            <span className={styles.statLabel}>Pendientes</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>
              {pagos.filter(p => p.estado === "aprobado").length}
            </span>
            <span className={styles.statLabel}>Aprobados</span>
          </div>
        </div>
      </div>

      {/* Filtros de Pestañas y Búsqueda */}
      <div className={styles.filterSection}>
        <div className={styles.searchBox}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar por cédula, referencia o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button className={styles.clearSearch} onClick={() => setSearchTerm("")}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className={styles.filterTabsModern}>
          <button
            className={`${styles.filterTabModern} ${filtroEstado === "pendiente" ? styles.activeTab : ""}`}
            onClick={() => setFiltroEstado("pendiente")}
          >
            <i className="fas fa-hourglass-half"></i> Pendientes
          </button>
          <button
            className={`${styles.filterTabModern} ${filtroEstado === "aprobado" ? styles.activeTab : ""}`}
            onClick={() => setFiltroEstado("aprobado")}
          >
            <i className="fas fa-check-circle"></i> Aprobados
          </button>
          <button
            className={`${styles.filterTabModern} ${filtroEstado === "rechazado" ? styles.activeTab : ""}`}
            onClick={() => setFiltroEstado("rechazado")}
          >
            <i className="fas fa-times-circle"></i> Rechazados
          </button>
          <button
            className={`${styles.filterTabModern} ${filtroEstado === "todos" ? styles.activeTab : ""}`}
            onClick={() => setFiltroEstado("todos")}
          >
            <i className="fas fa-list-ul"></i> Todos
          </button>
        </div>
      </div>

      {/* Grid Listado de Pagos */}
      {loading ? (
        <div className={styles.loadingState}>
          <i className="fas fa-spinner fa-spin"></i> Cargando pagos...
        </div>
      ) : pagosFiltrados.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-file-invoice-dollar"></i>
          <p>No hay reportes de pago que coincidan con esta búsqueda.</p>
        </div>
      ) : (
        <div className={styles.gruposGrid}>
          {pagosFiltrados.map((p) => {
            const esAprobado = p.estado === "aprobado";
            const levelColor = p.membresias?.nombre?.toLowerCase() === "premium" ? "#ffd700" : p.membresias?.nombre?.toLowerCase() === "pro" ? "#c0c0c0" : "#ff4500";
            
            return (
              <div key={p.id_pago} className={styles.grupoCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.grupoIcon} style={{ background: levelColor, color: "#111" }}>
                    <i className="fas fa-star"></i>
                  </div>
                  <div className={styles.grupoTitles}>
                    <h3 className={styles.grupoNombre}>
                      Plan {p.membresias?.nombre || "Básico"}
                    </h3>
                    <p className={styles.grupoZona} style={{fontSize: "1.1rem", fontWeight: "bold", color: "var(--primary-red)"}}>
                      ${Number(p.monto).toFixed(2)}
                    </p>
                  </div>
                  <div className={styles.grupoEstado}>{getEstadoBadge(p.estado)}</div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.creadorInfo}>
                    <div className={styles.creadorAvatar}>
                      {p.personas?.nombres?.charAt(0)}{p.personas?.apellidos?.charAt(0)}
                    </div>
                    <div className={styles.creadorDetalles}>
                      <p className={styles.creadorNombre}>
                        {p.personas?.nombres} {p.personas?.apellidos}
                      </p>
                      <p className={styles.creadorContacto}>
                        <i className="fas fa-id-card"></i> {p.cedula_persona}
                        {p.personas?.telefono && (
                          <>
                            {" | "}
                            <i className="fas fa-phone"></i> {p.personas.telefono}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className={styles.rutaInfo}>
                    <h4>Detalles del Pago</h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: "5px 0", fontSize: "0.9rem", color: "#555" }}>
                      <li style={{marginBottom: "5px"}}><i className="fas fa-money-check-alt" style={{marginRight: "5px", color: "#aaa"}}></i> <strong>Método:</strong> {p.metodo_pago}</li>
                      <li><i className="fas fa-hashtag" style={{marginRight: "5px", color: "#aaa"}}></i> <strong>Referencia:</strong> {p.nro_referencia || "No aplicable"}</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.fechaInfo}>
                    <i className="fas fa-calendar-alt"></i>
                    {new Date(p.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  <div className={styles.actionButtons}>
                    {p.estado === "pendiente" && (
                      <>
                        <button
                          onClick={() => cambiarEstado(p.id_pago, "aprobado")}
                          className={`${styles.actionBtn} ${styles.approveBtn}`}
                          title="Aprobar Pago"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button
                          onClick={() => cambiarEstado(p.id_pago, "rechazado")}
                          className={`${styles.actionBtn} ${styles.rejectBtn}`}
                          title="Rechazar Pago"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </>
                    )}
                    {p.estado !== "pendiente" && (
                      <button
                        onClick={() => cambiarEstado(p.id_pago, esAprobado ? "rechazado" : "aprobado")}
                        className={`${styles.actionBtn} ${styles.toggleBtn}`}
                        title="Cambiar estado"
                      >
                         <i className="fas fa-sync-alt"></i>
                      </button>
                    )}
                    <button
                      onClick={() => cambiarEstado(p.id_pago, "eliminar")}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Eliminar Reporte"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Pagos;