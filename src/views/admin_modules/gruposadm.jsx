import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const VistaAprobaciones = () => {
  const [solicitudes, setSolicitudes] = useState([]);

  // 1. Cargar solicitudes pendientes con los datos de la persona (JOIN)
  const cargarSolicitudes = async () => {
    const { data } = await supabase
      .from("comunidades")
      .select(
        `
        *,
        personas ( nombres, apellidos, telefono )
      `,
      )
      .eq("estado", "pendiente");
    if (data) setSolicitudes(data);
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  // 2. Función para aprobar
  const aprobarGrupo = async (id) => {
    const { error } = await supabase
      .from("comunidades")
      .update({ estado: "aprobado" })
      .eq("id_comunidad", id);

    if (!error) {
      alert("¡Grupo aprobado y publicado!");
      cargarSolicitudes(); // Recargar lista
    }
  };

  return (
    <div className="table-container">
      <h3>Solicitudes de Nuevos Grupos</h3>
      <table className="cursos-table">
        <thead>
          <tr>
            <th>Grupo / Zona</th>
            <th>Responsable (C.I)</th>
            <th>Ruta Propuesta</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {solicitudes.map((s) => (
            <tr key={s.id_comunidad} className="curso-row">
              <td className="curso-td">
                <span className="curso-title">{s.nombre_grupo}</span>
                <span className="curso-desc">{s.zona}</span>
              </td>
              <td className="curso-td">
                <div style={{ fontSize: "0.9rem" }}>
                  <strong>
                    {s.personas?.nombres} {s.personas?.apellidos}
                  </strong>
                  <br />
                  <span style={{ color: "var(--text-muted)" }}>
                    CI: {s.cedula_creador}
                  </span>
                </div>
              </td>
              <td
                className="curso-td"
                style={{ fontSize: "0.8rem", maxWidth: "200px" }}
              >
                {s.ruta_descripcion}
              </td>
              <td className="curso-td">
                <button
                  onClick={() => aprobarGrupo(s.id_comunidad)}
                  className="btn-save"
                  style={{ padding: "8px 15px", fontSize: "11px" }}
                >
                  APROBAR
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VistaAprobaciones;
