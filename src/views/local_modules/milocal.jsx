import React from "react";
import styles from "../../assets/css/local.module.css"; // Asegúrate de tener este archivo para estilos específicos

export default function MiLocal({
  editandoPerfil,
  setEditandoPerfil,
  datosLocal,
  setDatosLocal,
  localPerfil,
  guardarPerfilLocal,
  loading,
}) {
  return (
    <div style={{ padding: "20px" }}>
      <div className={styles["glass-card"]}>
        <div className={styles["edit-local-header"]}>
          <h2 style={{ margin: 0 }}>🏪 Configuración del Local</h2>
          <div className={styles["edit-local-body"]}>
            {!editandoPerfil && (
              <button
                className={styles["edit-local-btn"]}
                onClick={() => setEditandoPerfil(true)}
              >
                <i className="fas fa-pen"></i> Editar
              </button>
            )}
          </div>
        </div>

        {!editandoPerfil ? (
          <div>
            {localPerfil ? (
              <>
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      background: "#f0f0f0",
                      borderRadius: "50%",
                      margin: "0 auto 10px auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i
                      className="fas fa-store"
                      style={{ fontSize: "2rem", color: "#767676" }}
                    ></i>
                  </div>
                  <h3 style={{ margin: 0 }}>{localPerfil.nombre_local}</h3>
                  <span
                    className="badge"
                    style={{
                      background: "#d4edda",
                      color: "#0e491c",
                      padding: "5px 10px",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                    }}
                  >
                    Activo
                  </span>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <p>
                    <strong>Teléfono:</strong> {localPerfil.telefono}
                  </p>
                  <p>
                    <strong>Dirección:</strong>{" "}
                    {datosLocal.direccion_fisica || "No especificada"}
                  </p>
                  <p>
                    <strong>RIF:</strong> J-12345678-9
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Tipo de Servicio:</strong>
                    {localPerfil.tipo_comercio || "No especificado"}
                  </p>
                  <div>
                    <p>
                      <strong>Horario de Atención:</strong>
                      {localPerfil.horario_atencion || "No especificado"}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p>No hay datos registrados. ¡Configura tu local!</p>
            )}
          </div>
        ) : (
          <div className="form-container">
            <label>Nombre Comercial</label>
            <input
              type="text"
              value={datosLocal.nombre_local}
              onChange={(e) =>
                setDatosLocal({ ...datosLocal, nombre_local: e.target.value })
              }
            />

            <label>Teléfono (WhatsApp)</label>
            <input
              type="text"
              value={datosLocal.telefono}
              onChange={(e) =>
                setDatosLocal({ ...datosLocal, telefono: e.target.value })
              }
            />

            <label>Dirección Detallada</label>
            <textarea
              rows="3"
              value={datosLocal.direccion_fisica}
              onChange={(e) =>
                setDatosLocal({
                  ...datosLocal,
                  direccion_fisica: e.target.value,
                })
              }
            />

            <label>Horario de Atención</label>
            <h3>desde:</h3>
            <input
              type="time"
              rows="2"
              value={datosLocal.horario_atencion}
              onChange={(e) =>
                setDatosLocal({
                  ...datosLocal,
                  horario_atencion: e.target.value,
                })
              }
            />
            <h3>hasta:</h3>
            <input
              type="time"
              rows="2"
              value={datosLocal.horario_atencion}
              onChange={(e) =>
                setDatosLocal({
                  ...datosLocal,
                  horario_atencion: e.target.value,
                })
              }
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                className="btn-main-login"
                onClick={guardarPerfilLocal}
                disabled={loading}
              >
                Guardar Cambios
              </button>
              <button
                className="btn-secondary"
                onClick={() => setEditandoPerfil(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
