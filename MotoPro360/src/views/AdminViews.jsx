import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminView({ activeTab, usuarios, perfil }) {
  const [locales, setLocales] = useState([]);
  const [totalMotos, setTotalMotos] = useState(0);

  useEffect(() => {
    if (perfil?.nombre_rol === "admin") cargarDatosAdmin();
  }, [perfil]);

  const cargarDatosAdmin = async () => {
    const { data } = await supabase
      .from("locales")
      .select("*, ubicaciones(latitud, longitud)");
    if (data) setLocales(data);

    const { count } = await supabase
      .from("motos")
      .select("*", { count: "exact", head: true });
    setTotalMotos(count || 0);
  };

  if (perfil?.nombre_rol !== "admin") return null;

  return (
    <div className="content-wrapper fade-in">
      {/* SECCIÓN INICIO */}
      {activeTab === "inicio" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            className="glass-card"
            style={{ textAlign: "left", padding: "25px" }}
          >
            <h1
              className="login-title"
              style={{ margin: 0, paddingBottom: "10px" }}
            >
              Panel de Control
            </h1>
            <p style={{ color: "var(--dark-gray)", marginTop: "10px" }}>
              Monitoreo en tiempo real de la flota y aliados estratégicos.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
            }}
          >
            <div className="glass-card" style={{ padding: "20px" }}>
              <i
                className="fas fa-motorcycle"
                style={{ fontSize: "2rem", color: "var(--primary-red)" }}
              ></i>
              <h3 style={{ fontSize: "24px", margin: "10px 0" }}>
                {totalMotos}
              </h3>
              <p style={{ color: "#777", fontSize: "14px" }}>Motos Activas</p>
            </div>
            <div className="glass-card" style={{ padding: "20px" }}>
              <i
                className="fas fa-store"
                style={{ fontSize: "2rem", color: "var(--black)" }}
              ></i>
              <h3 style={{ fontSize: "24px", margin: "10px 0" }}>
                {locales.length}
              </h3>
              <p style={{ color: "#777", fontSize: "14px" }}>
                Aliados Comerciales
              </p>
            </div>
            <div className="glass-card" style={{ padding: "20px" }}>
              <i
                className="fas fa-users"
                style={{ fontSize: "2rem", color: "var(--primary-red)" }}
              ></i>
              <h3 style={{ fontSize: "24px", margin: "10px 0" }}>
                {usuarios?.length || 0}
              </h3>
              <p style={{ color: "#777", fontSize: "14px" }}>
                Usuarios Totales
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN MAPA */}
      {activeTab === "mapa" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            className="glass-card"
            style={{ textAlign: "left", padding: "25px" }}
          >
            <h2
              className="login-title"
              style={{ margin: 0, paddingBottom: "10px" }}
            >
              Mapa de Operaciones
            </h2>
          </div>
          <div
            className="glass-card"
            style={{ padding: "10px", overflow: "hidden" }}
          >
            <MapContainer
              center={[10.4917, -66.8785]}
              zoom={13}
              style={{ height: "500px", width: "100%", borderRadius: "15px" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {locales.map(
                (loc) =>
                  loc.ubicaciones?.latitud && (
                    <Marker
                      key={loc.id_local}
                      position={[
                        loc.ubicaciones.latitud,
                        loc.ubicaciones.longitud,
                      ]}
                    >
                      <Popup>
                        <strong>{loc.nombre_local}</strong>
                        <br />
                        {loc.telefono}
                      </Popup>
                    </Marker>
                  ),
              )}
            </MapContainer>
          </div>
        </div>
      )}

      {/* SECCIÓN USUARIOS */}
      {activeTab === "usuarios" && (
        <div
          className="glass-card fade-in"
          style={{ padding: "30px", borderTop: "4px solid var(--primary-red)" }}
        >
          <div style={{ marginBottom: "25px" }}>
            <h2 className="login-title" style={{ margin: 0 }}>
              GESTIÓN DE USUARIOS
            </h2>
            <div
              style={{
                width: "50px",
                height: "3px",
                backgroundColor: "var(--primary-red)",
                marginTop: "5px",
              }}
            ></div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0 10px",
              }}
            >
              <thead>
                <tr
                  style={{
                    color: "var(--primary-red)",
                    textTransform: "uppercase",
                    fontSize: "0.85rem",
                    letterSpacing: "1px",
                  }}
                >
                  <th style={{ padding: "15px", textAlign: "left" }}>Cédula</th>
                  <th style={{ padding: "15px", textAlign: "left" }}>
                    Nombre Completo
                  </th>
                  <th style={{ padding: "15px", textAlign: "center" }}>Rol</th>
                </tr>
              </thead>
              <tbody>
                {usuarios?.map((u) => {
                  const rol = u.roles?.[0]?.nombre_rol || "cliente";

                  // Lógica de colores por rol
                  const roleStyles = {
                    admin: {
                      bg: "#ffebee",
                      color: "#d32f2f",
                      border: "#ffcdd2",
                    }, // Rojo suave
                    local: {
                      bg: "#e8f5e9",
                      color: "#2e7d32",
                      border: "#c8e6c9",
                    }, // Verde suave
                    cliente: {
                      bg: "#e3f2fd",
                      color: "#1976d2",
                      border: "#bbdefb",
                    }, // Azul suave
                  };

                  const currentStyle = roleStyles[rol] || roleStyles.cliente;

                  return (
                    <tr
                      key={u.cedula}
                      className="table-row-hover"
                      style={{
                        backgroundColor: "#fff",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                      }}
                    >
                      <td
                        style={{
                          padding: "15px",
                          borderRadius: "10px 0 0 10px",
                          fontWeight: "600",
                        }}
                      >
                        {u.cedula}
                      </td>
                      <td style={{ padding: "15px" }}>
                        {u.nombres} {u.apellidos}
                      </td>
                      <td
                        style={{
                          padding: "15px",
                          borderRadius: "0 10px 10px 0",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            backgroundColor: currentStyle.bg,
                            color: currentStyle.color,
                            border: `1px solid ${currentStyle.border}`,
                            display: "inline-block",
                            minWidth: "80px",
                          }}
                        >
                          {rol}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
