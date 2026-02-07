import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('inicio')

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }

      const { data: persona } = await supabase.from('personas').select('cedula, nombres, apellidos').eq('id_auth', user.id).single()
      const { data: rol } = await supabase.from('roles').select('nombre_rol').eq('persona_cedula', persona?.cedula).single()
      
      setPerfil({ ...persona, ...rol })

      if (rol?.nombre_rol === 'admin') {
        const { data: lista } = await supabase.from('personas').select('cedula, nombres, apellidos, roles(nombre_rol)')
        setUsuarios(lista || [])
      }
      setLoading(false)
    }
    cargarDatos()
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) return <div className="dashboard-overlay" style={{justifyContent:'center', alignItems:'center'}}><h2>Cargando MotoPro...</h2></div>

  return (
    <div className="dashboard-overlay">
      
      {/* SIDEBAR ROJO */}
      <aside className="sidebar">
        <div className="sidebar-header">MOTOPRO 360</div>

        <nav style={{ flex: 1 }}>
          <div className={`nav-link ${activeTab === 'inicio' ? 'active' : ''}`} onClick={() => setActiveTab('inicio')}>
            <i className="fas fa-th-large"></i> <span>Dashboard</span>
          </div>

          {(perfil?.nombre_rol === 'cliente' || perfil?.nombre_rol === 'admin') && (
            <div className={`nav-link ${activeTab === 'mapa' ? 'active' : ''}`} onClick={() => setActiveTab('mapa')}>
              <i className="fas fa-map-marker-alt"></i> <span>Ver Mapa</span>
            </div>
          )}

          {perfil?.nombre_rol === 'local' && (
            <div className={`nav-link ${activeTab === 'productos' ? 'active' : ''}`} onClick={() => setActiveTab('productos')}>
              <i className="fas fa-motorcycle"></i> <span>Inventario</span>
            </div>
          )}

          {perfil?.nombre_rol === 'admin' && (
            <div className={`nav-link ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveTab('usuarios')}>
              <i className="fas fa-user-shield"></i> <span>Usuarios</span>
            </div>
          )}
        </nav>

        <div className="nav-link" onClick={handleLogout} style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.2)' }}>
          <i className="fas fa-power-off"></i> <span>Salir</span>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-area">
        <header className="top-bar">
          <div style={{ fontWeight: 700, color: 'var(--primary-red)' }}>
            {activeTab.toUpperCase()}
          </div>
          <div className="user-info">
            <span>{perfil?.nombres}</span>
            <div className="avatar-circle">{perfil?.nombres?.charAt(0)}</div>
          </div>
        </header>

        <div className="content-wrapper">
          
          {/* VISTA INICIO / BUSCADOR CLIENTE */}
          {activeTab === 'inicio' && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              {perfil?.nombre_rol === 'cliente' ? (
                <div className="glass-card" style={{ width: '100%', maxWidth: '600px', border: '2px solid var(--primary-red)' }}>
                  <h1 style={{ color: 'var(--black)', marginBottom: '25px' }}>¿Qué necesitas para tu moto?</h1>
                  <div className="input-group">
                    <i className="fas fa-search icon-field"></i>
                    <input type="text" placeholder="Busca cauchos, aceites, frenos..." />
                  </div>
                  <button className="btn-main-login" style={{ width: '100%', marginTop: '20px' }}>BUSCAR AHORA</button>
                </div>
              ) : (
                <div className="data-card" style={{textAlign: 'center'}}>
                  <h2>Bienvenido al Sistema</h2>
                  <p>Panel de gestión de {perfil?.nombre_rol}.</p>
                </div>
              )}
            </div>
          )}

          {/* MAPA BLANCO (Para Clientes/Admin) */}
          {activeTab === 'mapa' && (
            <div style={{ height: '100%', borderRadius: '20px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <MapContainer center={[10.4806, -66.9036]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[10.4806, -66.9036]}>
                  <Popup>Estás aquí</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}

          {activeTab === 'productos' && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
              gap: '25px',
              padding: '10px' 
            }}>
              
              {/* Botón Nuevo Producto */}
              <div className="data-card" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                border: '2px dashed var(--primary-red)', 
                background: 'rgba(230, 57, 70, 0.05)',
                cursor: 'pointer',
                minHeight: '250px'
              }}>
                <i className="fas fa-plus" style={{ fontSize: '2.5rem', color: 'var(--primary-red)', marginBottom: '15px' }}></i>
                <span style={{ fontWeight: '700', color: 'var(--primary-red)' }}>Nuevo Producto</span>
              </div>

              {/* Tarjetas de Productos */}
              {[1, 2, 3].map(i => (
                <div key={i} className="data-card" style={{ minHeight: '250px', textAlign: 'center', position: 'relative' }}>
                  <div style={{ 
                    height: '140px', 
                    background: '#e9ecef', 
                    borderRadius: '12px', 
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fas fa-image" style={{ color: '#adb5bd', fontSize: '2rem' }}></i>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--black)' }}>Producto Demo {i}</h3>
                  <p style={{ color: 'var(--primary-red)', fontWeight: '800', fontSize: '1.2rem' }}>$25.00</p>
                  <button style={{
                    marginTop: '10px',
                    background: 'none',
                    border: '1px solid var(--gray)',
                    padding: '5px 15px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>Editar</button>
                </div>
              ))}
            </div>
          )}

          {/* CRUD USUARIOS (Admin) */}
          {activeTab === 'usuarios' && (
            <div className="data-card">
              <h2>Control de Usuarios</h2>
              <table className="custom-table" style={{width: '100%'}}>
                <thead>
                  <tr><th>Cédula</th><th>Nombre</th><th>Rol</th></tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.cedula}>
                      <td>{u.cedula}</td>
                      <td>{u.nombres} {u.apellidos}</td>
                      <td><span className={`badge badge-${u.roles?.[0]?.nombre_rol}`}>{u.roles?.[0]?.nombre_rol}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}