// src/views/AdminViews.jsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

export default function AdminView({ activeTab, usuarios, perfil }) {
  // Mostrar solo a admins
  if (perfil?.nombre_rol !== "admin") return null;
  useEffect(() => {
    let mounted = true;
    import("../assets/css/admin.css").then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (activeTab === "inicio") {
    return (
      <div className="welcome-card">
        <h1>Bienvenido al Panel de Administración</h1>
        <p>
          Desde aquí puedes gestionar usuarios, visualizar el mapa de
          operaciones y más.
        </p>
      </div>
    );
  }

  if (activeTab === "mapa") {
    return (
      <div
        style={{
          minHeight: "400px",
          borderRadius: "20px",
          overflow: "hidden",
          border: "4px solid white",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <MapContainer
          center={[10.4806, -66.9036]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[10.4806, -66.9036]}>
            <Popup>Centro de Control</Popup>
          </Marker>
        </MapContainer>
      </div>
    );
  }

  if (activeTab === "usuarios") {
    return (
      <div className="data-card">
        <h2>Control de Usuarios</h2>
        <div style={{ overflowX: "auto" }}>
          <table
            className="custom-table"
            style={{ width: "100%", minWidth: "600px" }}
          >
            <thead>
              <tr>
                <th>Cédula</th>
                <th>Nombre</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.cedula}>
                  <td>{u.cedula}</td>
                  <td>
                    {u.nombres} {u.apellidos}
                  </td>
                  <td>
                    <span className={`badge badge-${u.roles?.[0]?.nombre_rol}`}>
                      {u.roles?.[0]?.nombre_rol}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
