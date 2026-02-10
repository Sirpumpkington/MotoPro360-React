import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
// Asegúrate de tener configurados los iconos de Leaflet si no se ven,
// si usas Vite a veces hay que importar las imágenes manualmente, 
// pero por ahora dejémoslo simple.

export default function Dashboard() {
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estados de control de interfaz
  const [activeTab, setActiveTab] = useState('inicio')
  const [menuAbierto, setMenuAbierto] = useState(false)
  
  // Estado exclusivo para simular búsqueda del cliente
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }

      // Cargar Perfil y Rol
      const { data: persona } = await supabase.from('personas').select('cedula, nombres, apellidos').eq('id_auth', user.id).single()
      const { data: rol } = await supabase.from('roles').select('nombre_rol').eq('persona_cedula', persona?.cedula).single()
      
      setPerfil({ ...persona, ...rol })

      // Si es Admin, cargar lista de usuarios
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

  // Función simulada para buscar
  const simularBusqueda = () => {
    setBusquedaRealizada(true)
  }

  if (loading) return (
    <div className="dashboard-overlay" style={{justifyContent:'center', alignItems:'center', background: 'var(--light-gray)'}}>
      <h2 style={{color: 'var(--primary-red)'}}>Cargando MotoPro...</h2>
    </div>
  )

  return (
    <div className="dashboard-overlay">
      
      {/* --- FONDO OSCURO PARA MÓVIL --- */}
      <div 
        className={`menu-overlay ${menuAbierto ? 'active' : ''}`}
        onClick={() => setMenuAbierto(false)}
      ></div>

      {/* --- BOTÓN HAMBURGUESA (MÓVIL) --- */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        <i className={`fas ${menuAbierto ? 'fa-times' : 'fa-bars'}`}></i>
      </button>
      
      {/* --- SIDEBAR LATERAL --- */}
      <aside className={`sidebar ${menuAbierto ? 'open' : ''}`}>
        <div className="sidebar-header">MOTOPRO 360</div>

        <nav style={{ flex: 1 }}>
          {/* OPCIÓN COMÚN: INICIO */}
          <div className={`nav-link ${activeTab === 'inicio' ? 'active' : ''}`} onClick={() => { setActiveTab('inicio'); setMenuAbierto(false); }}>
            <i className="fas fa-home"></i> <span>Inicio</span>
          </div>

          {/* === MENÚ SOLO PARA CLIENTES === */}
          {perfil?.nombre_rol === 'cliente' && (
            <>
              <div className={`nav-link ${activeTab === 'motos' ? 'active' : ''}`} onClick={() => { setActiveTab('motos'); setMenuAbierto(false); }}>
                <i className="fas fa-motorcycle"></i> <span>Mis Motos</span>
              </div>
              <div className={`nav-link ${activeTab === 'promos' ? 'active' : ''}`} onClick={() => { setActiveTab('promos'); setMenuAbierto(false); }}>
                <i className="fas fa-tags"></i> <span>Promociones</span>
              </div>
              <div className={`nav-link ${activeTab === 'cursos' ? 'active' : ''}`} onClick={() => { setActiveTab('cursos'); setMenuAbierto(false); }}>
                <i className="fas fa-graduation-cap"></i> <span>Formación</span>
              </div>
              <div className={`nav-link ${activeTab === 'comunidad' ? 'active' : ''}`} onClick={() => { setActiveTab('comunidad'); setMenuAbierto(false); }}>
                <i className="fas fa-users"></i> <span>Comunidad</span>
              </div>
            </>
          )}

          {/* === MENÚ SOLO PARA LOCALES === */}
          {perfil?.nombre_rol === 'local' && (
            <div className={`nav-link ${activeTab === 'productos' ? 'active' : ''}`} onClick={() => { setActiveTab('productos'); setMenuAbierto(false); }}>
              <i className="fas fa-boxes"></i> <span>Inventario</span>
            </div>
          )}

          {/* === MENÚ SOLO PARA ADMIN === */}
          {perfil?.nombre_rol === 'admin' && (
            <>
              <div className={`nav-link ${activeTab === 'mapa' ? 'active' : ''}`} onClick={() => { setActiveTab('mapa'); setMenuAbierto(false); }}>
                <i className="fas fa-map-marked-alt"></i> <span>Mapa Global</span>
              </div>
              <div className={`nav-link ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => { setActiveTab('usuarios'); setMenuAbierto(false); }}>
                <i className="fas fa-users-cog"></i> <span>Gestión Usuarios</span>
              </div>
            </>
          )}
        </nav>

        <div className="nav-link" onClick={handleLogout} style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.2)' }}>
          <i className="fas fa-power-off"></i> <span>Cerrar Sesión</span>
        </div>
      </aside>


      {/* --- ÁREA PRINCIPAL --- */}
      <main className="main-area">
        <header className="top-bar">
          <div style={{ fontWeight: 700, color: 'var(--primary-red)', fontSize: '1.1rem' }}>
            {activeTab === 'inicio' ? (busquedaRealizada ? 'RESULTADOS DE BÚSQUEDA' : 'BIENVENIDO') : activeTab.toUpperCase()}
          </div>
          <div className="user-info">
            <span style={{display: 'none', paddingRight: '10px'}} className="desktop-only">{perfil?.nombres}</span>
            <div className="avatar-circle">{perfil?.nombres?.charAt(0)}</div>
          </div>
        </header>

        <div className="content-wrapper">
          
          {/* ==================================================
              VISTA 1: INICIO (Lógica Especial Cliente vs Otros)
             ================================================== */}
          {activeTab === 'inicio' && (
            <>
              {perfil?.nombre_rol === 'cliente' ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* ESTADO 1: Cliente NO ha buscado nada (Solo Barra) */}
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
                            onClick={simularBusqueda} // <--- Activa el mapa simulado
                          >
                            BUSCAR DISPONIBILIDAD
                          </button>
                        </div>
                     </div>
                  ) : (
                    /* ESTADO 2: Cliente YA buscó (Mapa + Lista) */
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
                      
                      {/* Barra de búsqueda superior (compacta) */}
                      <div style={{ background: 'white', padding: '15px', borderRadius: '12px', display: 'flex', gap: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                         <button onClick={() => setBusquedaRealizada(false)} style={{ border:'none', background:'none', color:'#666', cursor:'pointer' }}><i className="fas fa-arrow-left"></i></button>
                         <input type="text" placeholder="Pastillas de freno..." style={{ border:'none', outline:'none', width:'100%' }} defaultValue="Pastillas de freno" />
                         <i className="fas fa-search" style={{ color: 'var(--primary-red)', alignSelf:'center' }}></i>
                      </div>

                      <div style={{ display: 'flex', flex: 1, gap: '20px', overflow: 'hidden', flexDirection: 'column' }} className="responsive-split">
                         
                         {/* Lista de Resultados (Arriba o Izquierda) */}
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

                         {/* Mapa (Abajo o Derecha) - Solo aparece al buscar */}
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
              ) : (
                /* VISTA INICIO PARA ADMIN / LOCAL */
                <div className="data-card" style={{textAlign: 'center', marginTop: '50px'}}>
                  <h2 style={{color: 'var(--primary-red)'}}>Bienvenido al Panel</h2>
                  <p>Selecciona una opción del menú para comenzar.</p>
                </div>
              )}
            </>
          )}

          {/* ==================================================
              VISTA 2: MIS MOTOS (Cliente)
             ================================================== */}
          {activeTab === 'motos' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              
              {/* Botón Agregar Moto */}
              <div className="data-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--gray)', cursor: 'pointer', minHeight: '180px' }}>
                 <div style={{ width: '50px', height: '50px', background: 'var(--primary-red)', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', marginBottom:'10px' }}>
                    <i className="fas fa-plus"></i>
                 </div>
                 <span style={{ fontWeight: '600' }}>Registrar Nueva Moto</span>
              </div>

              {/* Moto Simulada 1 */}
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

              {/* Moto Simulada 2 */}
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
          )}

          {/* ==================================================
              VISTA 3: PROMOCIONES (Cliente)
             ================================================== */}
          {activeTab === 'promos' && (
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
          )}

          {/* ==================================================
              VISTA 4: FORMACIÓN / CURSOS (Cliente)
             ================================================== */}
          {activeTab === 'cursos' && (
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
          )}

          {/* ==================================================
              VISTA 5: COMUNIDAD (Cliente)
             ================================================== */}
          {activeTab === 'comunidad' && (
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
          )}

          {/* ==================================================
              VISTA 6: INVENTARIO (Local)
             ================================================== */}
          {(activeTab === 'productos') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px', padding: '10px' }}>
              <div className="data-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--primary-red)', background: 'rgba(230, 57, 70, 0.05)', cursor: 'pointer', minHeight: '250px' }}>
                <i className="fas fa-plus" style={{ fontSize: '2.5rem', color: 'var(--primary-red)', marginBottom: '15px' }}></i>
                <span style={{ fontWeight: '700', color: 'var(--primary-red)' }}>Nuevo Producto</span>
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="data-card" style={{ minHeight: '250px', textAlign: 'center' }}>
                  <div style={{ height: '140px', background: '#e9ecef', borderRadius: '12px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-image" style={{ color: '#adb5bd', fontSize: '2rem' }}></i>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--black)' }}>Producto Demo {i}</h3>
                  <p style={{ color: 'var(--primary-red)', fontWeight: '800', fontSize: '1.2rem' }}>$25.00</p>
                  <button style={{ marginTop: '10px', background: 'none', border: '1px solid var(--gray)', padding: '5px 15px', borderRadius: '8px', cursor: 'pointer' }}>Editar</button>
                </div>
              ))}
            </div>
          )}

          {/* ==================================================
              VISTA 7: MAPA GLOBAL (Admin)
             ================================================== */}
          {activeTab === 'mapa' && (
            <div style={{ height: '100%', borderRadius: '20px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <MapContainer center={[10.4806, -66.9036]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[10.4806, -66.9036]}>
                  <Popup>Centro de Control</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}

          {/* ==================================================
              VISTA 8: USUARIOS (Admin)
             ================================================== */}
          {activeTab === 'usuarios' && (
            <div className="data-card">
              <h2>Control de Usuarios</h2>
              <div style={{overflowX: 'auto'}}>
                <table className="custom-table" style={{width: '100%', minWidth: '600px'}}>
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
            </div>
          )}

        </div>
      </main>
    </div>
  )
}