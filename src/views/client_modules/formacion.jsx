import React from "react";
import { supabase } from "../../supabaseClient"; // Asegúrate de que la ruta sea correcta
// --- COMPONENTE DE CURSOS ---
export default function VistaCursos({ perfil }) {
  const [cursos, setCursos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCursos = async () => {
      // Traemos el curso y el nombre de la membresia asociada (JOIN)
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

  if (loading)
    return (
      <div style={{ padding: "20px", color: "white" }}>
        Cargando formación...
      </div>
    );

  return (
    <div style={{ padding: "20px" }}>
      <header style={{ marginBottom: "30px" }}>
        <h2 style={{ color: "white", margin: 0 }}>Centro de Formación</h2>
        <p style={{ color: "#aaa" }}>
          Tu nivel de acceso:{" "}
          <strong style={{ color: "var(--primary-red)" }}>
            {/* Aquí usamos el ID para mostrar el nombre. 1: Gratuito, 2: Pro, 3: Premium */}
            {perfil?.id_membresia === 3
              ? "Premium"
              : perfil?.id_membresia === 2
                ? "Pro"
                : "Gratuito"}
          </strong>
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {cursos.map((curso) => {
          // LÓGICA DE ACCESO: Comparamos IDs numéricos
          const tieneAcceso =
            (perfil?.id_membresia || 1) >= curso.id_membresia_minima;

          return (
            <div
              key={curso.id_curso}
              className="glass-card"
              style={{
                padding: 0,
                overflow: "hidden",
                opacity: tieneAcceso ? 1 : 0.7, // Se ve más opaco si no tiene acceso
                filter: tieneAcceso ? "none" : "grayscale(0.5)",
              }}
            >
              {/* Foto Placeholder */}
              <div
                style={{
                  height: "120px",
                  background: tieneAcceso
                    ? "linear-gradient(135deg, #222 0%, #444 100%)"
                    : "#1a1a1a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {!tieneAcceso && (
                  <i
                    className="fas fa-lock"
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      color: "orange",
                    }}
                  ></i>
                )}
                <i
                  className="fas fa-graduation-cap"
                  style={{ fontSize: "3rem", color: "rgba(255,255,255,0.1)" }}
                ></i>
              </div>

              <div style={{ padding: "15px" }}>
                <span
                  style={{
                    fontSize: "0.65rem",
                    background: tieneAcceso ? "var(--primary-red)" : "#666",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    color: "white",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  Nivel: {curso.membresias?.nombre || "Básico"}
                </span>

                <h3
                  style={{
                    color: "white",
                    margin: "10px 0 5px 0",
                    fontSize: "1.1rem",
                  }}
                >
                  {curso.titulo}
                </h3>

                <p
                  style={{
                    color: "#ccc",
                    fontSize: "0.85rem",
                    height: "40px",
                    overflow: "hidden",
                    marginBottom: "15px",
                  }}
                >
                  {curso.descripcion}
                </p>

                {tieneAcceso ? (
                  <button
                    onClick={() =>
                      window.open(curso.enlace_classroom, "_blank")
                    }
                    className="btn-main-login"
                    style={{ width: "100%" }}
                  >
                    ACCEDER AHORA
                  </button>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "10px",
                      background: "rgba(255,165,0,0.1)",
                      borderRadius: "8px",
                      color: "orange",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                    }}
                  >
                    CONTENIDO BLOQUEADO
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
