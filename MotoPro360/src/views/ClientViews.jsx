import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function ClientView({ activeTab, perfil, busquedaRealizada, setBusquedaRealizada, simularBusqueda }) {
  if (perfil?.nombre_rol !== 'cliente') return null

  if (activeTab === 'inicio') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {!busquedaRealizada ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '600px', border: '2px solid var(--primary-red)' }}>
              <h1 style={{ color: 'var(--black)', marginBottom: '10px' }}>¿Qué necesitas hoy?</h1>
              <p style={{ color: '#666', marginBottom: '25px' }}>Encuentra repuestos, talleres y grúas cerca de ti.</p>

              <div className="input-group">
                <i className="fas fa-search icon-field"></i>
                <input type="text" placeholder="Ej: Pastillas de freno, Aceite 20w50..." />
              </div>

              <button
                className="btn-main-login"
                style={{ width: '100%', marginTop: '20px' }}
                onClick={simularBusqueda}
              >
                BUSCAR DISPONIBILIDAD
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
            <div style={{ background: 'white', padding: '15px', borderRadius: '12px', display: 'flex', gap: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
              <button onClick={() => setBusquedaRealizada(false)} style={{ border:'none', background:'none', color:'#666', cursor:'pointer' }}><i className="fas fa-arrow-left"></i></button>
              <input type="text" placeholder="Pastillas de freno..." style={{ border:'none', outline:'none', width:'100%' }} defaultValue="Pastillas de freno" />
              <i className="fas fa-search" style={{ color: 'var(--primary-red)', alignSelf:'center' }}></i>
            </div>

            <div style={{ display: 'flex', flex: 1, gap: '20px', overflow: 'hidden', flexDirection: 'column' }} className="responsive-split">
              <div style={{ overflowY: 'auto', paddingRight: '5px', flex: 1 }}>
                <h3 style={{ marginBottom: '15px', fontSize: '1rem' }}>3 Resultados cerca de ti</h3>
                {[1, 2, 3].map(i => (
                  <div key={i} className="data-card" style={{ padding: '15px', display: 'flex', gap: '15px', marginBottom: '15px', cursor: 'pointer' }}>
                    <div style={{ width: '80px', height: '80px', background: '#eee', borderRadius: '8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <i className="fas fa-motorcycle" style={{ color:'#ccc' }}></i>
                    </div>
                    <div>
                      <h4 style={{ margin: 0 }}>Pastillas Frenos Bera {i}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#666', margin: '5px 0' }}>Tienda MotoSpeed Chacao</p>
                      <p style={{ color: 'var(--primary-red)', fontWeight: 'bold' }}>$12.00</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1.5, borderRadius: '15px', overflow: 'hidden', border: '3px solid white', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', minHeight: '300px' }}>
                <MapContainer center={[10.4806, -66.9036]} zoom={14} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[10.4806, -66.9036]}>
                    <Popup>Tienda MotoSpeed</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (activeTab === 'motos') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="data-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--gray)', cursor: 'pointer', minHeight: '180px' }}>
          <div style={{ width: '50px', height: '50px', background: 'var(--primary-red)', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', marginBottom:'10px' }}>
            <i className="fas fa-plus"></i>
          </div>
          <span style={{ fontWeight: '600' }}>Registrar Nueva Moto</span>
        </div>

        <div className="data-card moto-card">
          <span className="moto-badge">PRINCIPAL</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Bera SBR</h3>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>2024 • Azul</p>
            </div>
            <i className="fas fa-motorcycle" style={{ fontSize: '1.5rem', color: 'var(--primary-red)' }}></i>
          </div>
          <div style={{ background: '#eee', padding: '10px', borderRadius: '8px', fontSize: '0.8rem' }}>
            <p><strong>Placa:</strong> AB123CD</p>
            <p><strong>Kilometraje:</strong> 12,500 km</p>
          </div>
          <button style={{ width: '100%', marginTop: '15px', padding: '8px', border: '1px solid var(--gray)', background: 'white', borderRadius: '6px', cursor:'pointer' }}>Ver Historial</button>
        </div>

        <div className="data-card moto-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Empire Keeway</h3>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>2021 • Negro</p>
            </div>
            <i className="fas fa-motorcycle" style={{ fontSize: '1.5rem', color: '#ccc' }}></i>
          </div>
          <div style={{ background: '#eee', padding: '10px', borderRadius: '8px', fontSize: '0.8rem' }}>
            <p><strong>Placa:</strong> XY987ZT</p>
            <p><strong>Kilometraje:</strong> 45,000 km</p>
          </div>
          <button style={{ width: '100%', marginTop: '15px', padding: '8px', border: '1px solid var(--gray)', background: 'white', borderRadius: '6px', cursor:'pointer' }}>Ver Historial</button>
        </div>
      </div>
    )
  }

  if (activeTab === 'promos') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="data-card coupon-card">
            <div className="coupon-circle"></div>
            <div className="coupon-circle right"></div>
            <div style={{ textAlign: 'center', paddingBottom: '15px', borderBottom: '2px dashed #eee' }}>
              <h2 style={{ fontSize: '2.5rem', margin: '0', color: 'var(--primary-red)' }}>20%</h2>
              <span style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', color: '#888' }}>Descuento</span>
            </div>
            <div style={{ paddingTop: '15px' }}>
              <h4 style={{ margin: '0 0 5px 0' }}>Cambio de Aceite Full</h4>
              <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '15px' }}>Válido en Talleres "El Rápido" hasta el 30 de Octubre.</p>
              <button className="btn-register" style={{ width: '100%', textAlign: 'center' }}>CANJEAR CUPÓN</button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activeTab === 'cursos') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Aprende Mecánica Básica</h3>
          <span style={{ color: 'var(--primary-red)', cursor: 'pointer', fontSize:'0.9rem' }}>Ver todos</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="data-card course-card" style={{ cursor: 'pointer' }}>
              <div className="course-thumb">
                <i className="fas fa-play-circle play-icon"></i>
              </div>
              <div style={{ padding: '15px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary-red)', fontWeight: 'bold', textTransform: 'uppercase' }}>Mecánica • Nivel {i}</span>
                <h4 style={{ margin: '5px 0', fontSize: '1rem' }}>Mantenimiento de Cadena y Frenos</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', fontSize: '0.8rem', color: '#888' }}>
                  <span><i className="far fa-clock"></i> 45 min</span>
                  <span><i className="fas fa-star" style={{ color: '#ffc107' }}></i> 4.8</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (activeTab === 'comunidad') {
    return (
      <div className="data-card" style={{ padding: '0' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
          <h3>Grupos Populares</h3>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Únete a otros moteros en tu zona</p>
        </div>

        {[1, 2, 3].map(i => (
          <div key={i} className="community-card" style={{ padding: '20px', cursor: 'pointer' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <i className="fas fa-users"></i>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>Moteros de Caracas - Zona Este {i}</h4>
              <p style={{ margin: '5px 0', fontSize: '0.8rem', color: '#666' }}>1.2k Miembros • 5 publicaciones nuevas</p>
            </div>
            <button style={{ background: 'var(--light-gray)', border: 'none', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', color: 'var(--black)', cursor: 'pointer' }}>Unirme</button>
          </div>
        ))}
      </div>
    )
  }

  return null
}