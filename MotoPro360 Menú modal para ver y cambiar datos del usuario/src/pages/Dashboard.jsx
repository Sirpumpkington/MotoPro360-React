import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";
import { useNavigate } from "react-router-dom";
import UserProfileModal from "../components/UserProfileModal"; // <-- NUEVO

// --- IMPORTS DE TUS VISTAS SEPARADAS ---
import ClientView from "../views/ClientViews.jsx";
import LocalView from "../views/LocalViews.jsx";
import AdminView from "../views/AdminViews.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de control de interfaz
  const [activeTab, setActiveTab] = useState("inicio");
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Estado para la búsqueda del cliente (se pasa como prop al ClientView)
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // Estado para el modal de perfil
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // <-- NUEVO

  useEffect(() => {
    const cargarDatos = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      // Cargar Perfil y Rol
      const { data: persona } = await supabase
        .from("personas")
        .select("cedula, nombres, apellidos")
        .eq("id_auth", user.id)
        .single();
      const { data: rol } = await supabase
        .from("roles")
        .select("nombre_rol")
        .eq("persona_cedula", persona?.cedula)
        .single();

      setPerfil({ ...persona, ...rol });

      // Si es Admin, cargar lista de usuarios (Se la pasaremos al AdminView)
      if (rol?.nombre_rol === "admin") {
        const { data: lista } = await supabase
          .from("personas")
          .select("cedula, nombres, apellidos, roles(nombre_rol)");
        setUsuarios(lista || []);
      }
      setLoading(false);
    };
    cargarDatos();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading)
    return (
      <div
        className="dashboard-overlay"
        style={{
          justifyContent: "center",
          alignItems: "center",
          background: "var(--light-gray)",
        }}
      >
        <h2 style={{ color: "var(--primary-red)" }}>Cargando MotoPro...</h2>
      </div>
    );

  return (
    <div className="dashboard-overlay">
      {/* --- FONDO OSCURO PARA MÓVIL --- */}
      <div
        className={`menu-overlay ${menuAbierto ? "active" : ""}`}
        onClick={() => setMenuAbierto(false)}
      ></div>

      {/* --- BOTÓN HAMBURGUESA (MÓVIL) --- */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        <i className={`fas ${menuAbierto ? "fa-times" : "fa-bars"}`}></i>
      </button>

      {/* --- SIDEBAR LATERAL (MENÚ) --- */}
      <aside className={`sidebar ${menuAbierto ? "open" : ""}`}>
        <div className="sidebar-header">MOTOPRO 360</div>

        <nav style={{ flex: 1 }}>
          {/* OPCIÓN COMÚN: INICIO */}
          <div
            className={`nav-link ${activeTab === "inicio" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("inicio");
              setMenuAbierto(false);
            }}
          >
            <i className="fas fa-home"></i> <span>Inicio</span>
          </div>

          {/* === MENÚ CLIENTE === */}
          {perfil?.nombre_rol === "cliente" && (
            <>
              <div
                className={`nav-link ${activeTab === "motos" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("motos");
                  setMenuAbierto(false);
                }}
              >
                <i className="fas fa-motorcycle"></i> <span>Mis Motos</span>
              </div>
              <div
                className={`nav-link ${activeTab === "promos" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("promos");
                  setMenuAbierto(false);
                }}
              >
                <i className="fas fa-tags"></i> <span>Promociones</span>
              </div>
              <div
                className={`nav-link ${activeTab === "cursos" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("cursos");
                  setMenuAbierto(false);
                }}
              >
                <i className="fas fa-graduation-cap"></i> <span>Formación</span>
              </div>
              <div
                className={`nav-link ${activeTab === "comunidad" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("comunidad");
                  setMenuAbierto(false);
                }}
              >
                <i className="fas fa-users"></i> <span>Comunidad</span>
              </div>
            </>
          )}

          {/* === MENÚ LOCAL === */}
          {perfil?.nombre_rol === "local" && (
            <div
              className={`nav-link ${activeTab === "productos" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("productos");
                setMenuAbierto(false);
              }}
            >
              <i className="fas fa-boxes"></i> <span>Inventario</span>
            </div>
          )}

          {/* === MENÚ ADMIN === */}
          {perfil?.nombre_rol === "admin" && (
            <>
              <div
                className={`nav-link ${activeTab === "mapa" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("mapa");
                  setMenuAbierto(false);
                }}
              >
                <i className="fas fa-map-marked-alt"></i>{" "}
                <span>Mapa Global</span>
              </div>
              <div
                className={`nav-link ${activeTab === "usuarios" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("usuarios");
                  setMenuAbierto(false);
                }}
              >
                <i className="fas fa-users-cog"></i>{" "}
                <span>Gestión Usuarios</span>
              </div>
            </>
          )}
        </nav>

        <div
          className="nav-link"
          onClick={handleLogout}
          style={{ marginTop: "auto", background: "rgba(0,0,0,0.2)" }}
        >
          <i className="fas fa-power-off"></i> <span>Cerrar Sesión</span>
        </div>
      </aside>

      {/* --- ÁREA PRINCIPAL --- */}
      <main className="main-area">
        <header className="top-bar">
          <div
            style={{
              fontWeight: 700,
              color: "var(--primary-red)",
              fontSize: "1.1rem",
            }}
          >
            {activeTab === "inicio"
              ? busquedaRealizada
                ? "RESULTADOS DE BÚSQUEDA"
                : "BIENVENIDO"
              : activeTab.toUpperCase()}
          </div>
          <div className="user-info">
            <span
              style={{ display: "none", paddingRight: "10px" }}
              className="desktop-only"
            >
              {perfil?.nombres}
            </span>
            {/* Botón para abrir el modal (sobre el avatar) */}
            <div 
              className="avatar-circle" 
              onClick={() => setIsProfileModalOpen(true)}
              style={{ cursor: "pointer" }}
            >
              {perfil?.nombres?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="content-wrapper">
          <ClientView
            activeTab={activeTab}
            perfil={perfil}
            busquedaRealizada={busquedaRealizada}
            setBusquedaRealizada={setBusquedaRealizada}
          />
          <LocalView activeTab={activeTab} perfil={perfil} />
          <AdminView
            activeTab={activeTab}
            usuarios={usuarios}
            perfil={perfil}
          />
        </div>
      </main>

      {/* Modal de perfil */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}