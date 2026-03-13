import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";
import { useNavigate } from "react-router-dom";

// --- IMPORTS DE TUS VISTAS SEPARADAS ---
import ClientView from "../views/ClientViews.jsx";
import LocalView from "../views/LocalViews.jsx";
import AdminView from "../views/AdminViews.jsx";
import UserProfileModal from "../components/UserProfileModal";
import AsistenteIA from "./AsistenteIA.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Estados de control de interfaz
  const [activeTab, setActiveTab] = useState("inicio");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Estado para la búsqueda del cliente (se pasa como prop al ClientView)
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      // Obtener la URL del avatar desde user_metadata
      if (user.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }

      // Cargar Perfil y Rol
      const { data: persona } = await supabase
        .from("personas")
        .select("cedula, nombres, apellidos,id_membresia")
        .eq("id_auth", user.id)
        .single();
      const { data: rol } = await supabase
        .from("roles")
        .select("nombre_rol")
        .eq("persona_cedula", persona?.cedula)
        .single();

      setPerfil({ ...persona, ...rol });

      // Si es Admin, cargar lista de usuarios
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

  const handleNavigateToProfile = () => {
    setIsProfileOpen(false);
    setActiveTab("perfil");
  };

  if (loading)
    return (
      <div className="dashboard-overlay dashboard-loading">
        <h2>Cargando MotoPro...</h2>
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
        <div className="sidebar-header">
          <img
            src="/assets/images/logo.png"
            alt="MotoPro360"
            className="sidebar-logo"
          />
          <span>MOTOPRO 360</span>
        </div>
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

              <div
                className={`nav-link ${activeTab === "Membresias" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("Membresias");
                  setMenuAbierto(false);
                }}
              >
                <i className="fas fa-star"></i> <span>Membresías</span>
              </div>
              {/* Emergencia Vial ya no está en el menú */}
            </>
          )}

          {/* === MENÚ LOCAL === */}
          {perfil?.nombre_rol === "local" && (
            <>
              <div
                className={`nav-link ${activeTab === "mi-local" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("mi-local");
                  setMenuAbierto(false);
                }}
              >
                <i className="fas fa-store"></i> <span>Mi Local</span>
              </div>

              <div
                className={`nav-link ${activeTab === "productos" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("productos");
                  setMenuAbierto(false);
                }}
              >
                <i className="fas fa-boxes"></i> <span>Inventario</span>
              </div>

              <div
                className={`nav-link ${activeTab === "ofertas" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("ofertas");
                  setMenuAbierto(false);
                }}
              >
                <i className="fas fa-tags"></i> <span>Ofertas</span>
              </div>
            </>
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
              <div
                className={`nav-link ${activeTab === "formacion" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("formacion");
                  setMenuAbierto(false);
                }}
              >
                <i className="fas fa-graduation-cap"></i> <span>Formación</span>
              </div>
              <div
                className={`nav-link ${activeTab === "Grupos" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("Grupos");
                  setMenuAbierto(false);
                }}
              >
                <i className="fas fa-users"></i> <span>Grupos</span>
              </div>
            </>
          )}
        </nav>
      </aside>

      {/* --- ÁREA PRINCIPAL --- */}
      <main className="main-area">
        <header className="top-bar">
          <div className="top-bar-title">
            {activeTab === "inicio"
              ? busquedaRealizada
                ? "RESULTADOS DE BÚSQUEDA"
                : "BIENVENIDO"
              : activeTab.toUpperCase()}
          </div>
          <div className="user-info">
            <span className="desktop-only user-name-label">
              {perfil?.nombres}
            </span>
            <button
              className="avatar-circle"
              onClick={() => setIsProfileOpen(true)}
              aria-label="Abrir perfil"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                />
              ) : (
                <span className="avatar-initial">
                  {perfil?.nombres?.charAt(0)}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="content-wrapper">
          <ClientView
            activeTab={activeTab}
            setActiveTab={setActiveTab} // <-- AGREGADO
            perfil={perfil}
            busquedaRealizada={busquedaRealizada}
            setBusquedaRealizada={setBusquedaRealizada}
            onAvatarUpdate={(url) => setAvatarUrl(url)}
          />
          <LocalView activeTab={activeTab} perfil={perfil} />
          <AdminView
            activeTab={activeTab}
            usuarios={usuarios}
            perfil={perfil}
          />
        </div>
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onAvatarUpdate={(url) => setAvatarUrl(url)}
          onNavigateToProfile={handleNavigateToProfile}
          userRole={perfil?.nombre_rol}
        />

        <AsistenteIA perfil={perfil} activeTab={activeTab} />
      </main>
    </div>
  );
}
