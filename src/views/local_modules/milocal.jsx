import React from "react";
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
  metodosPago,
  setMetodosPago,
  horarios,
  setHorarios,
  logoUrl,
  portadaUrl,
  handleLogoUpload,
  handlePortadaUpload,
}) {
  const diasSemana = [
    { key: "lunes", label: "Lunes" },
    { key: "martes", label: "Martes" },
    { key: "miercoles", label: "Miércoles" },
    { key: "jueves", label: "Jueves" },
    { key: "viernes", label: "Viernes" },
    { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
  ];

  const opcionesPago = [
    { value: "efectivo", label: "Efectivo", icon: "fas fa-money-bill-wave" },
    { value: "transferencia", label: "Transferencia", icon: "fas fa-university" },
    { value: "punto", label: "Punto de venta", icon: "fas fa-credit-card" },
    { value: "pago_movil", label: "Pago Móvil", icon: "fas fa-mobile-alt" },
    { value: "divisas", label: "Divisas", icon: "fas fa-dollar-sign" },
  ];

  const toggleMetodoPago = (value) => {
    if (metodosPago.includes(value)) {
      setMetodosPago(metodosPago.filter(v => v !== value));
    } else {
      setMetodosPago([...metodosPago, value]);
    }
  };

  const actualizarHorario = (dia, campo, valor) => {
    setHorarios({
      ...horarios,
      [dia]: { ...horarios[dia], [campo]: valor }
    });
  };

  return (
    <div className={styles.localConfigContainer}>
      {/* Cabecera con portada y logo */}
      <div className={styles.localHeader} style={{ backgroundImage: portadaUrl ? `url(${portadaUrl})` : 'linear-gradient(135deg, var(--primary-red), var(--dark-red))' }}>
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
        {editandoPerfil && (
          <div className={styles.portadaUpload}>
            <label className={styles.portadaUploadBtn}>
              <i className="fas fa-camera"></i> Cambiar portada
              <input type="file" accept="image/*" onChange={handlePortadaUpload} hidden />
            </label>
          </div>
        )}
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
              <div className={styles.statChip}>
                <i className="fas fa-eye"></i> {stats.visitasMes} Visitas
              </div>
              <div className={styles.statChip}>
                <i className="fas fa-phone-alt"></i> {stats.contactosMes} Contactos
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
                  <p>{localPerfil?.horario_apertura || "?"} - {localPerfil?.horario_cierre || "?"}</p>
                </div>
              </div>

              {/* Tipo de comercio */}
              <div className={styles.infoItem}>
                <i className="fas fa-tag"></i>
                <div className={styles.infoContent}>
                  <strong>Tipo</strong>
                  <p>{localPerfil?.tipo_comercio || datosLocal.tipo_comercio || "No especificado"}</p>
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
              {(localPerfil?.email || datosLocal.email) && (
                <div className={styles.infoItem}>
                  <i className="fas fa-envelope"></i>
                  <div className={styles.infoContent}>
                    <strong>Email</strong>
                    <p>{localPerfil?.email || datosLocal.email}</p>
                  </div>
                </div>
              )}

              {/* Sitio web (si existe) */}
              {(localPerfil?.sitio_web || datosLocal.sitio_web) && (
                <div className={styles.infoItem}>
                  <i className="fas fa-globe"></i>
                  <div className={styles.infoContent}>
                    <strong>Sitio web</strong>
                    <p><a href={localPerfil?.sitio_web || datosLocal.sitio_web} target="_blank" rel="noopener noreferrer">{localPerfil?.sitio_web || datosLocal.sitio_web}</a></p>
                  </div>
                </div>
              )}
            </div>

            {/* Métodos de pago (si hay) */}
            {metodosPago.length > 0 && (
              <div className={styles.paymentMethods}>
                <h4><i className="fas fa-credit-card"></i> Métodos de pago</h4>
                <div className={styles.paymentIcons}>
                  {metodosPago.map(value => {
                    const op = opcionesPago.find(o => o.value === value);
                    return op ? (
                      <div key={value} className={styles.paymentChip}>
                        <i className={op.icon}></i>
                        <span>{op.label}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Horario detallado (si hay algún día abierto) */}
            {Object.values(horarios).some(d => d.abierto) && (
              <div className={styles.horarioDetallado}>
                <h4><i className="fas fa-calendar-alt"></i> Horario semanal</h4>
                <div className={styles.horariosLista}>
                  {diasSemana.map(({ key, label }) => (
                    <div key={key} className={styles.horarioRow}>
                      <span className={styles.horarioDia}>{label}</span>
                      {horarios[key].abierto ? (
                        <span className={styles.horarioHora}>
                          {horarios[key].apertura} - {horarios[key].cierre}
                        </span>
                      ) : (
                        <span className={styles.horarioCerrado}>Cerrado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // ========== MODO EDICIÓN (sin cambios) ==========
          <form className={styles.editForm} onSubmit={(e) => { e.preventDefault(); guardarPerfilLocal(); }}>
            {/* ... (todo el formulario de edición se mantiene igual) ... */}
            <div className={styles.formGroup}>
              <label>Nombre Comercial *</label>
              <input
                type="text"
                value={datosLocal.nombre_local}
                onChange={(e) => setDatosLocal({ ...datosLocal, nombre_local: e.target.value })}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Teléfono *</label>
                <input
                  type="tel"
                  value={datosLocal.telefono}
                  onChange={(e) => setDatosLocal({ ...datosLocal, telefono: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={datosLocal.email}
                  onChange={(e) => setDatosLocal({ ...datosLocal, email: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Dirección</label>
              <textarea
                rows="2"
                value={datosLocal.direccion_fisica}
                onChange={(e) => setDatosLocal({ ...datosLocal, direccion_fisica: e.target.value })}
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
                />
              </div>
              <div className={styles.formGroup}>
                <label>Sitio web</label>
                <input
                  type="url"
                  value={datosLocal.sitio_web}
                  onChange={(e) => setDatosLocal({ ...datosLocal, sitio_web: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Descripción del local</label>
              <textarea
                rows="3"
                value={datosLocal.descripcion}
                onChange={(e) => setDatosLocal({ ...datosLocal, descripcion: e.target.value })}
                placeholder="Breve descripción de tu negocio..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tipo de comercio</label>
              <select
                value={datosLocal.tipo_comercio}
                onChange={(e) => setDatosLocal({ ...datosLocal, tipo_comercio: e.target.value })}
              >
                <option value="">Selecciona</option>
                <option value="taller">Taller Mecánico</option>
                <option value="repuestos">Venta de Repuestos</option>
                <option value="concesionario">Concesionario</option>
                <option value="grua">Servicio de Grúa</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <h3 className={styles.sectionTitle}>Horario general</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Apertura</label>
                <input
                  type="time"
                  value={datosLocal.horario_apertura}
                  onChange={(e) => setDatosLocal({ ...datosLocal, horario_apertura: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Cierre</label>
                <input
                  type="time"
                  value={datosLocal.horario_cierre}
                  onChange={(e) => setDatosLocal({ ...datosLocal, horario_cierre: e.target.value })}
                />
              </div>
            </div>

            <h3 className={styles.sectionTitle}>Horario detallado (opcional)</h3>
            <p className={styles.fieldNote}>Si necesitas horarios diferentes por día, configúralos aquí.</p>
            <div className={styles.horarioEditor}>
              {diasSemana.map(({ key, label }) => (
                <div key={key} className={styles.diaEditor}>
                  <div className={styles.diaHeader}>
                    <input
                      type="checkbox"
                      id={`${key}_abierto`}
                      checked={horarios[key].abierto}
                      onChange={(e) => actualizarHorario(key, 'abierto', e.target.checked)}
                    />
                    <label htmlFor={`${key}_abierto`}>{label}</label>
                  </div>
                  {horarios[key].abierto && (
                    <div className={styles.diaHoras}>
                      <input
                        type="time"
                        value={horarios[key].apertura}
                        onChange={(e) => actualizarHorario(key, 'apertura', e.target.value)}
                      />
                      <span>a</span>
                      <input
                        type="time"
                        value={horarios[key].cierre}
                        onChange={(e) => actualizarHorario(key, 'cierre', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <h3 className={styles.sectionTitle}>Métodos de pago</h3>
            <div className={styles.pagoOptions}>
              {opcionesPago.map(op => (
                <label key={op.value} className={styles.pagoCheckbox}>
                  <input
                    type="checkbox"
                    value={op.value}
                    checked={metodosPago.includes(op.value)}
                    onChange={() => toggleMetodoPago(op.value)}
                  />
                  <i className={op.icon}></i>
                  <span>{op.label}</span>
                </label>
              ))}
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? <i className="fas fa-spinner fa-spin"></i> : "Guardar Cambios"}
              </button>
              <button type="button" className={styles.btnSecondary} onClick={() => setEditandoPerfil(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}