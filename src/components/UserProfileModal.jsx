import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useTheme } from "../context/ThemeContext";
import "../assets/css/modal.css";

const UserProfileModal = ({ isOpen, onClose, onAvatarUpdate, onNavigateToProfile, userRole }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchUserData();
  }, [isOpen]);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Math.random()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, avatar_url: avatarUrl }
      });
      if (updateError) throw updateError;

      onAvatarUpdate(avatarUrl);
      await fetchUserData();
    } catch (error) {
      alert('Error al subir avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-menu-modal" onClick={(e) => e.stopPropagation()}>
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
              <label htmlFor="avatar-input-modal" className="edit-avatar-badge">
                <i className="fas fa-camera"></i>
              </label>
              <input
                id="avatar-input-modal"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </div>
            <div className="text-details">
              <h4>{user?.user_metadata?.full_name || "Usuario"}</h4>
              <span>{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="menu-divider"></div>

        <div className="menu-options">
          {/* Mostrar "Mis Datos Personales" solo si NO es administrador */}
          {userRole !== "admin" && (
            <button
              className="menu-item"
              onClick={() => {
                onNavigateToProfile();
                onClose();
              }}
            >
              <i className="fas fa-user-circle"></i>
              <span>Mis Datos Personales</span>
            </button>
          )}

          <div className="menu-item-switch">
            <div className="item-label">
              <i className="fas fa-moon"></i>
              <span>Modo Oscuro</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={toggleDarkMode}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="menu-divider"></div>

          <a
            href="https://facebook.com/motopro360"
            target="_blank"
            rel="noopener noreferrer"
            className="menu-item"
          >
            <i className="fab fa-facebook"></i>
            <span>Síguenos en Facebook</span>
          </a>

          <a
            href="https://youtube.com/motopro360"
            target="_blank"
            rel="noopener noreferrer"
            className="menu-item"
          >
            <i className="fab fa-youtube text-red"></i>
            <span>Canal de YouTube</span>
          </a>

          <div className="menu-divider"></div>

          <button className="menu-item logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;