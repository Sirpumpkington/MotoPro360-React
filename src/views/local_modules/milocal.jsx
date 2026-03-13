import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "../../assets/css/local.module.css";

export default function MiLocal({
  editandoPerfil,
  setEditandoPerfil,
  datosLocal,
  setDatosLocal,
  localPerfil,
  guardarPerfilLocal,
  loading,
  stats,
  rubros = [],
  logoUrl,
  handleLogoUpload,
}) {

  // Draggable marker logic
  const LocationMarker = () => {
    const lat = datosLocal.latitud || 10.4917;
    const lng = datosLocal.longitud || -66.8785;
    
    useMapEvents({
      click(e) {
        setDatosLocal({
          ...datosLocal,
          latitud: e.latlng.lat,
          longitud: e.latlng.lng,
        });
      },
    });

    return (
      <Marker
        position={[lat, lng]}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const position = marker.getLatLng();
            setDatosLocal({
              ...datosLocal,
              latitud: position.lat,
              longitud: position.lng,
            });
          },
        }}
      />
    );
  };





  return (
    <div className={styles.localConfigContainer}>
      {/* Cabecera con portada y logo */}
      <div className={styles.localHeader} style={{ backgroundImage: 'linear-gradient(135deg, var(--primary-red), var(--dark-red))' }}>
        <div className={styles.logoContainer}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className={styles.logoImg} />
          ) : (
            <div className={styles.logoPlaceholder}>
              <i className="fas fa-store"></i>
            </div>
          )}
          {editandoPerfil && (
            <label className={styles.logoUploadBtn}>
              <i className="fas fa-camera"></i>
              <input type="file" accept="image/*" onChange={handleLogoUpload} hidden />
            </label>
          )}
        </div>
      </div>

      <div className={styles.configCard}>
        <div className={styles.configHeader}>
          <h2><i className="fas fa-store-alt"></i> Mi Local</h2>
          {!editandoPerfil && localPerfil && (
            <button className={styles.editButton} onClick={() => setEditandoPerfil(true)}>
              <i className="fas fa-pen"></i> Editar
            </button>
          )}
        </div>

        {!editandoPerfil ? (
          // ========== MODO VISUALIZACIÓN (REDISEÑADO) ==========
          <div className={styles.profileDisplay}>
            <h2 className={styles.storeName}>{localPerfil?.nombre_local || "Mi Local"}</h2>
            <span className={styles.statusBadge}>Activo</span>

            {/* Estadísticas rápidas como chips */}
            <div className={styles.statsChips}>
              <div className={styles.statChip}>
                <i className="fas fa-box"></i> {stats.totalProductos} Productos
              </div>
              <div className={`${styles.statChip} ${stats.ofertasActivas > 0 ? styles.warning : ''}`}>
                <i className="fas fa-tags"></i> {stats.ofertasActivas} Ofertas
              </div>
            </div>

            {/* Información detallada en tarjetas */}
            <div className={styles.infoGrid}>
              {/* Teléfono */}
              <div className={styles.infoItem}>
                <i className="fas fa-phone-alt"></i>
                <div className={styles.infoContent}>
                  <strong>Teléfono</strong>
                  <p>{localPerfil?.telefono || datosLocal.telefono || "No especificado"}</p>
                </div>
              </div>

              {/* Dirección */}
              <div className={styles.infoItem}>
                <i className="fas fa-map-marker-alt"></i>
                <div className={styles.infoContent}>
                  <strong>Dirección</strong>
                  <p>{datosLocal.direccion_fisica || localPerfil?.direccion || "No especificada"}</p>
                </div>
              </div>

              {/* Horario general */}
              <div className={styles.infoItem}>
                <i className="fas fa-clock"></i>
                <div className={styles.infoContent}>
                  <strong>Horario</strong>
                  <p>{localPerfil?.horario_json?.apertura || datosLocal?.horario_apertura || "?"} - {localPerfil?.horario_json?.cierre || datosLocal?.horario_cierre || "?"}</p>
                </div>
              </div>

              {/* Tipo de comercio */}
              <div className={styles.infoItem}>
                <i className="fas fa-tag"></i>
                <div className={styles.infoContent}>
                  <strong>Tipo</strong>
                  <p>
                    {rubros.find(r => (r.id_rubro || r.id) == (localPerfil?.rubro_id || datosLocal.rubro_id))?.nombre 
                     || rubros.find(r => (r.id_rubro || r.id) == (localPerfil?.rubro_id || datosLocal.rubro_id))?.nombre_rubro 
                     || "No especificado"}
                  </p>
                </div>
              </div>

              {/* RIF */}
              <div className={styles.infoItem}>
                <i className="fas fa-id-card"></i>
                <div className={styles.infoContent}>
                  <strong>RIF</strong>
                  <p>{localPerfil?.rif || datosLocal.rif || "No especificado"}</p>
                </div>
              </div>

              {/* Email (si existe) */}
              {(localPerfil?.correo || datosLocal.correo) && (
                <div className={styles.infoItem}>
                  <i className="fas fa-envelope"></i>
                  <div className={styles.infoContent}>
                    <strong>Correo</strong>
                    <p>{localPerfil?.correo || datosLocal.correo}</p>
                  </div>
                </div>
              )}

              {/* Mapa Miniatura (Visualización) */}
              {localPerfil?.ubicaciones?.latitud && localPerfil?.ubicaciones?.longitud && (
                <div className={styles.infoItem} style={{ gridColumn: "1 / -1" }}>
                   <div style={{ width: "100%", height: "200px", borderRadius: "12px", overflow: "hidden", marginTop: "1rem" }}>
                    <MapContainer
                      center={[localPerfil.ubicaciones.latitud, localPerfil.ubicaciones.longitud]}
                      zoom={15}
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={false}
                      dragging={false}
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[localPerfil.ubicaciones.latitud, localPerfil.ubicaciones.longitud]} />
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>




          </div>
        ) : (
          // ========== MODO EDICIÓN (REDISEÑADO) ==========
          <form className={styles.editForm} onSubmit={(e) => { e.preventDefault(); guardarPerfilLocal(); }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Sección 1: Información General */}
              <div style={{ background: 'var(--card-bg, rgba(0,0,0,0.1))', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 className={styles.sectionTitle} style={{ marginTop: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <i className="fas fa-info-circle" style={{ color: 'var(--primary-red)' }}></i> Información General
                </h3>
  
                <div className={styles.formGroup}>
                  <label>Nombre Comercial *</label>
                  <input
                    type="text"
                    value={datosLocal.nombre_local}
                    onChange={(e) => setDatosLocal({ ...datosLocal, nombre_local: e.target.value })}
                    required
                    style={{ padding: '12px', borderRadius: '8px' }}
                  />
                </div>
  
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>RIF</label>
                    <input
                      type="text"
                      value={datosLocal.rif}
                      onChange={(e) => setDatosLocal({ ...datosLocal, rif: e.target.value })}
                      placeholder="J-12345678-9"
                      style={{ padding: '12px', borderRadius: '8px' }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tipo de comercio</label>
                    <select
                      value={datosLocal.rubro_id}
                      onChange={(e) => setDatosLocal({ ...datosLocal, rubro_id: e.target.value })}
                      style={{ padding: '12px', borderRadius: '8px' }}
                    >
                      <option value="">Selecciona</option>
                      {rubros.map(r => (
                        <option key={r.id_rubro || r.id} value={r.id_rubro || r.id}>
                          {r.nombre_rubro || r.nombre || r.titulo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
  
              {/* Sección 2: Contacto */}
              <div style={{ background: 'var(--card-bg, rgba(0,0,0,0.1))', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 className={styles.sectionTitle} style={{ marginTop: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <i className="fas fa-address-book" style={{ color: 'var(--primary-red)' }}></i> Contacto
                </h3>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Teléfono *</label>
                    <input
                      type="tel"
                      value={datosLocal.telefono}
                      onChange={(e) => setDatosLocal({ ...datosLocal, telefono: e.target.value })}
                      required
                      style={{ padding: '12px', borderRadius: '8px' }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Correo Electrónico</label>
                    <input
                      type="email"
                      value={datosLocal.correo}
                      onChange={(e) => setDatosLocal({ ...datosLocal, correo: e.target.value })}
                      style={{ padding: '12px', borderRadius: '8px' }}
                    />
                  </div>
                </div>
              </div>
  
              {/* Sección 3: Ubicación y Horario */}
              <div style={{ background: 'var(--card-bg, rgba(0,0,0,0.1))', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 className={styles.sectionTitle} style={{ marginTop: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <i className="fas fa-map-marked-alt" style={{ color: 'var(--primary-red)' }}></i> Ubicación y Horario
                </h3>
  
                <div className={styles.formGroup}>
                  <label>Dirección Física</label>
                  <textarea
                    rows="2"
                    value={datosLocal.direccion_fisica}
                    onChange={(e) => setDatosLocal({ ...datosLocal, direccion_fisica: e.target.value })}
                    style={{ padding: '12px', borderRadius: '8px', resize: 'vertical' }}
                  />
                </div>
  
                <div className={styles.formRow} style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                  <div className={styles.formGroup}>
                    <label>Hora de Apertura</label>
                    <input
                      type="time"
                      value={datosLocal.horario_apertura}
                      onChange={(e) => setDatosLocal({ ...datosLocal, horario_apertura: e.target.value })}
                      style={{ padding: '12px', borderRadius: '8px' }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Hora de Cierre</label>
                    <input
                      type="time"
                      value={datosLocal.horario_cierre}
                      onChange={(e) => setDatosLocal({ ...datosLocal, horario_cierre: e.target.value })}
                      style={{ padding: '12px', borderRadius: '8px' }}
                    />
                  </div>
                </div>
  
                <p className={styles.fieldNote} style={{ marginBottom: '1rem', fontWeight: '500' }}>
                  Mueve el marcador o haz clic en el mapa para especificar las coordenadas de tu local.
                </p>
                <div style={{ width: "100%", height: "350px", borderRadius: "12px", overflow: "hidden", zIndex: 0, border: '2px solid var(--border-color)' }}>
                  <MapContainer
                    center={[datosLocal.latitud || 10.4917, datosLocal.longitud || -66.8785]}
                    zoom={14}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationMarker />
                  </MapContainer>
                </div>
              </div>
  
              <div className={styles.formActions} style={{marginTop: '1rem'}}>
                <button type="submit" className={styles.btnPrimary} disabled={loading} style={{ padding: '14px 24px', fontSize: '1rem', borderRadius: '50px' }}>
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : "Guardar Cambios"}
                </button>
                <button type="button" className={styles.btnSecondary} onClick={() => setEditandoPerfil(false)} style={{ padding: '14px 24px', fontSize: '1rem', borderRadius: '50px' }}>
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}