import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import styles from "../../assets/css/admin.module.css";

const VistaAprobaciones = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("pendiente");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const cargarSolicitudes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comunidades")
      .select(
        `
        *,
        personas ( nombres, apellidos, telefono )
      `
      )
      .order("created_at", { ascending: false });
    if (data) setSolicitudes(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cambiarEstado = async (id, nuevoEstado) => {
    let confirmMsg = "";
    if (nuevoEstado === "aprobado") {
      confirmMsg = "¿Aprobar este grupo? Se publicará para todos.";
    } else if (nuevoEstado === "rechazado") {
      confirmMsg = "¿Rechazar esta solicitud? El usuario podrá crear una nueva.";
    } else if (nuevoEstado === "eliminar") {
      confirmMsg = "¿Eliminar permanentemente este grupo? Esta acción no se puede deshacer.";
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      if (nuevoEstado === "eliminar") {
        const { error } = await supabase
          .from("comunidades")
          .delete()
          .eq("id_comunidad", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("comunidades")
          .update({ estado: nuevoEstado })
          .eq("id_comunidad", id);
        if (error) throw error;
      }
      alert(`✅ Grupo ${nuevoEstado === "eliminar" ? "eliminado" : "actualizado"} correctamente.`);
      cargarSolicitudes();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  };

  const solicitudesFiltradas = solicitudes
    .filter(s => filtroEstado === "todos" || s.estado === filtroEstado)
    .filter(s => s.nombre_grupo.toLowerCase().includes(searchTerm.toLowerCase()));

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
      {/* Header con título y estadísticas */}
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.adminTitle}>Gestión de Grupos</h1>
          <p className={styles.adminSubtitle}>
            Administra las solicitudes y grupos de la comunidad motera
          </p>
        </div>
        <div className={styles.statsCards}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{solicitudes.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>
              {solicitudes.filter(s => s.estado === "pendiente").length}
            </span>
            <span className={styles.statLabel}>Pendientes</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>
              {solicitudes.filter(s => s.estado === "aprobado").length}
            </span>
            <span className={styles.statLabel}>Aprobados</span>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className={styles.filterSection}>
        <div className={styles.searchBox}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar grupo por nombre..."
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

      {/* Grid de tarjetas */}
      {loading ? (
        <div className={styles.loadingState}>
          <i className="fas fa-spinner fa-spin"></i> Cargando grupos...
        </div>
      ) : solicitudesFiltradas.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-users-slash"></i>
          <p>No hay grupos que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className={styles.gruposGrid}>
          {solicitudesFiltradas.map((s) => (
            <div key={s.id_comunidad} className={styles.grupoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.grupoIcon}>
                  <i className="fas fa-users"></i>
                </div>
                <div className={styles.grupoTitles}>
                  <h3 className={styles.grupoNombre}>{s.nombre_grupo}</h3>
                  <p className={styles.grupoZona}>
                    <i className="fas fa-map-marker-alt"></i> {s.zona}
                  </p>
                </div>
                <div className={styles.grupoEstado}>{getEstadoBadge(s.estado)}</div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.creadorInfo}>
                  <div className={styles.creadorAvatar}>
                    {s.personas?.nombres?.charAt(0)}{s.personas?.apellidos?.charAt(0)}
                  </div>
                  <div className={styles.creadorDetalles}>
                    <p className={styles.creadorNombre}>
                      {s.personas?.nombres} {s.personas?.apellidos}
                    </p>
                    <p className={styles.creadorContacto}>
                      <i className="fas fa-id-card"></i> {s.cedula_creador}
                      {s.personas?.telefono && (
                        <>
                          {" | "}
                          <i className="fas fa-phone"></i> {s.personas.telefono}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className={styles.rutaInfo}>
                  <h4>Ruta propuesta</h4>
                  <p>{s.ruta_descripcion}</p>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.fechaInfo}>
                  <i className="fas fa-calendar-alt"></i>
                  {new Date(s.created_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>

                <div className={styles.actionButtons}>
                  {s.estado === "pendiente" && (
                    <>
                      <button
                        onClick={() => cambiarEstado(s.id_comunidad, "aprobado")}
                        className={`${styles.actionBtn} ${styles.approveBtn}`}
                        title="Aprobar"
                      >
                        <i className="fas fa-check"></i>
                      </button>
                      <button
                        onClick={() => cambiarEstado(s.id_comunidad, "rechazado")}
                        className={`${styles.actionBtn} ${styles.rejectBtn}`}
                        title="Rechazar"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </>
                  )}
                  {s.estado !== "pendiente" && (
                    <button
                      onClick={() => cambiarEstado(s.id_comunidad, s.estado === "aprobado" ? "rechazado" : "aprobado")}
                      className={`${styles.actionBtn} ${styles.toggleBtn}`}
                      title="Cambiar estado"
                    >
                      <i className="fas fa-sync-alt"></i>
                    </button>
                  )}
                  <button
                    onClick={() => cambiarEstado(s.id_comunidad, "eliminar")}
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    title="Eliminar"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VistaAprobaciones;