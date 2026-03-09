import React from "react";
import { supabase } from "../../supabaseClient";
import "../../assets/css/client.css";

export default function VistaCursos({ perfil }) {
  const [cursos, setCursos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCursos = async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select(
          `
          *,
          membresias:id_membresia_minima (nombre)
        `,
        )
        .eq("activo", true)
        .order("id_membresia_minima", { ascending: true });

      if (!error) setCursos(data);
      setLoading(false);
    };
    fetchCursos();
  }, []);

  const nivelUsuario =
    perfil?.id_membresia === 3
      ? "Premium"
      : perfil?.id_membresia === 2
        ? "Pro"
        : "Gratuito";

  if (loading) {
    return <div className="cursos-loading">Cargando formación...</div>;
  }

  return (
    <div className="cursos-container">
      <div className="cursos-header">
        <h2 className="cursos-title">Centro de Formación</h2>
        <p className="cursos-subtitle">
          Tu nivel de acceso:{" "}
          <span className="cursos-badge">{nivelUsuario}</span>
        </p>
      </div>

      <div className="cursos-grid">
        {cursos.map((curso) => {
          const tieneAcceso =
            (perfil?.id_membresia || 1) >= curso.id_membresia_minima;
          const nivelCurso = curso.membresias?.nombre || "Básico";

          return (
            //Aqui van los cursos separado según el nivel de membresia.
            <div
              key={curso.id_curso}
              className={`curso-card-moderno ${!tieneAcceso ? "bloqueado" : ""}`}
            >
              <div className="curso-imagen">
                <i className="fas fa-graduation-cap"></i>
                {!tieneAcceso && (
                  <div className="curso-lock">
                    <i className="fas fa-lock"></i>
                  </div>
                )}
              </div>
              <div className="curso-contenido">
                <span
                  className={`curso-nivel ${
                    tieneAcceso ? "nivel-accesible" : "nivel-bloqueado"
                  }`}
                >
                  NIVEL: {nivelCurso.toUpperCase()}
                </span>
                <h3 className="curso-titulo-moderno">{curso.titulo}</h3>
                <p className="curso-descripcion-moderna">{curso.descripcion}</p>
                {tieneAcceso ? (
                  <button
                    onClick={() =>
                      window.open(curso.enlace_classroom, "_blank")
                    }
                    className="curso-boton"
                  >
                    <i className="fas fa-play-circle"></i> ACCEDER AHORA
                  </button>
                ) : (
                  <div className="curso-bloqueado-mensaje">
                    <i className="fas fa-lock"></i> CONTENIDO BLOQUEADO
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
