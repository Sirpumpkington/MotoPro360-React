import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "../assets/css/modal.css"; // Asegúrate de actualizar el CSS con el que te daré abajo

const UserProfileModal = ({ isOpen, onClose, onAvatarUpdate }) => {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchUserData();
  }, [isOpen]);

  const fetchUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-menu-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER: PERFIL Y FOTO */}
        <div className="menu-header">
          <div className="user-info-main">
            <div className="avatar-container">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.user_metadata?.full_name?.charAt(0) || "U"}
                </div>
              )}
              <label htmlFor="avatar-input" className="edit-avatar-badge">
                <i className="fas fa-camera"></i>
              </label>
            </div>
            <div className="text-details">
              <h4>{user?.user_metadata?.full_name || "Usuario"}</h4>
              <span>{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="menu-divider"></div>

        {/* LISTA DE OPCIONES ESTILO YOUTUBE */}
        <div className="menu-options">
          <button
            className="menu-item"
            onClick={() => {
              /* Navegar a Mis Datos */ onClose();
            }}
          >
            <i className="fas fa-user-circle"></i>
            <span>Mis Datos Personales</span>
          </button>

          <div className="menu-item-switch">
            <div className="item-label">
              <i className="fas fa-moon"></i>
              <span>Modo Oscuro</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="menu-divider"></div>

          <a
            href="https://facebook.com/motopro360"
            target="_blank"
            className="menu-item"
          >
            <i className="fab fa-facebook"></i>
            <span>Síguenos en Facebook</span>
          </a>

          <a
            href="https://youtube.com/motopro360"
            target="_blank"
            className="menu-item"
          >
            <i className="fab fa-youtube text-red"></i>
            <span>Canal de YouTube</span>
          </a>

          <div className="menu-divider"></div>

          <button
            className="menu-item logout"
            onClick={() => supabase.auth.signOut()}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
