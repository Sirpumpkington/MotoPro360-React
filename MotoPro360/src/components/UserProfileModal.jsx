import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../assets/css/modal.css';

const UserProfileModal = ({ isOpen, onClose, onAvatarUpdate }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    tipoSangre: '',
    alergias: '',
    numeroSeguro: '',
    nombreComercio: '',
    rfc: '',
    direccion: '',
    tipoComercio: '',
    rol: 'cliente',
  });

  useEffect(() => {
    if (isOpen) fetchUserData();
  }, [isOpen]);

  const fetchUserData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');
      setUser(user);

      const metadata = user.user_metadata || {};
      setFormData({
        nombre: metadata.full_name || '',
        email: user.email || '',
        telefono: metadata.telefono || '',
        tipoSangre: metadata.tipoSangre || '',
        alergias: metadata.alergias || '',
        numeroSeguro: metadata.numeroSeguro || '',
        nombreComercio: metadata.nombreComercio || '',
        rfc: metadata.rfc || '',
        direccion: metadata.direccion || '',
        tipoComercio: metadata.tipoComercio || '',
        rol: metadata.rol || 'cliente',
      });
      setAvatarUrl(metadata.avatar_url || null);
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      setError('');

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir archivo al bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Actualizar metadata del usuario con la nueva URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, avatar_url: avatarUrl },
      });

      if (updateError) throw updateError;

      setAvatarUrl(avatarUrl);
      onAvatarUpdate?.(avatarUrl); // Notificar al Dashboard
      setSuccess('Foto de perfil actualizada.');
    } catch (err) {
      setError('Error al subir la imagen: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const currentMetadata = user?.user_metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        full_name: formData.nombre,
        telefono: formData.telefono,
        rol: formData.rol,
        tipoSangre: formData.tipoSangre,
        alergias: formData.alergias,
        numeroSeguro: formData.numeroSeguro,
        nombreComercio: formData.nombreComercio,
        rfc: formData.rfc,
        direccion: formData.direccion,
        tipoComercio: formData.tipoComercio,
      };

      const updates = { data: updatedMetadata };
      if (formData.email !== user.email) updates.email = formData.email;

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      setSuccess('Datos actualizados correctamente');
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      setUser(updatedUser);
      setTimeout(() => { setSuccess(''); onClose(); }, 1500);
    } catch (err) {
      setError(err.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      setSuccess('Correo de restablecimiento enviado.');
    } catch (err) {
      setError('Error al enviar correo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Mi Perfil</h2>

        {loading && <p className="modal-message loading">Cargando...</p>}
        {error && <p className="modal-message error">{error}</p>}
        {success && <p className="modal-message success">{success}</p>}

        {user && (
          <form onSubmit={handleSubmit}>
            {/* SECCIÓN DE FOTO DE PERFIL */}
            <div className="avatar-upload-section">
              <div className="avatar-preview">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">
                    {formData.nombre?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="avatar-upload">
                <label htmlFor="avatar-input" className="btn-upload">
                  {uploading ? 'Subiendo...' : 'Cambiar foto'}
                </label>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                <small className="field-note">
                  Formatos: JPG, PNG. Máx 2MB
                </small>
              </div>
            </div>

            {/* Campos comunes */}
            <div className="form-group">
              <label>Nombre completo</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} disabled={loading} required />
            </div>

            <div className="form-group">
              <label>Correo electrónico</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={loading} required />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} disabled={loading} required />
            </div>

            {/* Campos condicionales según el rol */}
            {formData.rol === 'cliente' && (
              <>
                <h3 className="section-subtitle">Información de salud</h3>
                <div className="form-group">
                  <label>Tipo de sangre</label>
                  <select name="tipoSangre" value={formData.tipoSangre} onChange={handleChange} disabled={loading}>
                    <option value="">Seleccionar</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Alergias o condiciones</label>
                  <input type="text" name="alergias" value={formData.alergias} onChange={handleChange} disabled={loading} />
                </div>
                <div className="form-group">
                  <label>Número de seguro/póliza</label>
                  <input type="text" name="numeroSeguro" value={formData.numeroSeguro} onChange={handleChange} disabled={loading} />
                </div>
              </>
            )}

            {formData.rol === 'local' && (
              <>
                <h3 className="section-subtitle">Datos del negocio</h3>
                <div className="form-group">
                  <label>Nombre del comercio</label>
                  <input type="text" name="nombreComercio" value={formData.nombreComercio} onChange={handleChange} disabled={loading} />
                </div>
                <div className="form-group">
                  <label>RFC / RIF</label>
                  <input type="text" name="rfc" value={formData.rfc} onChange={handleChange} disabled={loading} />
                </div>
                <div className="form-group">
                  <label>Dirección fiscal</label>
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} disabled={loading} />
                </div>
                <div className="form-group">
                  <label>Tipo de comercio</label>
                  <select name="tipoComercio" value={formData.tipoComercio} onChange={handleChange} disabled={loading}>
                    <option value="">Seleccionar</option>
                    <option value="taller">Taller Mecánico</option>
                    <option value="repuestos">Venta de Repuestos</option>
                    <option value="concesionario">Concesionario</option>
                    <option value="grua">Servicio de Grúa</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-actions">
              <button type="button" onClick={onClose} disabled={loading}>Cancelar</button>
              <button type="submit" disabled={loading}>Guardar cambios</button>
            </div>

            <div className="password-reset-section">
              <button type="button" onClick={handlePasswordReset} disabled={loading} className="btn-password-reset">
                Cambiar contraseña
              </button>
              <small>Recibirás un correo para restablecerla.</small>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;