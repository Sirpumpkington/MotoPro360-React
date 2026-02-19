import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Registro() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [rol, setRol] = useState('cliente') // 'cliente' o 'local'

  // Un solo estado para todos los campos
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    // Datos Comercio
    nombreComercio: '',
    rfc: '',
    direccion: '',
    tipoComercio: '',
    // Datos Salud (Cliente)
    tipoSangre: '',
    alergias: '',
    numeroSeguro: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegistro = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }

    setLoading(true)
    try {
      // 1. Crear Usuario en Auth de Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.nombre,
            rol_inicial: rol // Guardamos qué rol eligió en la metadata
          }
        }
      })

      if (authError) throw authError

      
      alert('¡Registro exitoso! Por favor verifica tu correo.')
      navigate('/') // Redirigir al Login

    } catch (error) {
      alert('Error en el registro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="main-container">
      <div className="glass-card" style={{maxWidth: '800px'}}>
        
        {/* Header */}
        <div className="company-logo">
          <img src="/assets/images/logo.png" alt="Logo MotoPro 360" className="main-logo" />
        </div>
        <h1 className="login-title">CREAR CUENTA NUEVA</h1>

        {/* --- SELECTOR DE ROL --- */}
        <div className="role-selector-container">
            <div 
                className={`role-card ${rol === 'cliente' ? 'active' : ''}`}
                onClick={() => setRol('cliente')}
            >
                <div className="check-icon"><i className="fas fa-check-circle"></i></div>
                <i className="fas fa-user role-icon-big"></i>
                <h3>USUARIO</h3>
                <p>Busco repuestos y servicios</p>
            </div>

            <div 
                className={`role-card ${rol === 'local' ? 'active' : ''}`}
                onClick={() => setRol('local')}
            >
                <div className="check-icon"><i className="fas fa-check-circle"></i></div>
                <i className="fas fa-store role-icon-big"></i>
                <h3>COMERCIO</h3>
                <p>Ofrezco productos y taller</p>
            </div>
        </div>

        {/* --- FORMULARIO --- */}
        <form onSubmit={handleRegistro} className="form" style={{marginTop: '30px'}}>
            
            {/* SECCIÓN 1: DATOS BÁSICOS (Común) */}
            <div className="form-section">
                <h3 className="section-header"><i className="fas fa-id-card"></i> Datos de Cuenta</h3>
                
                <div className="input-group">
                    <i className="fas fa-user icon-field"></i>
                    <input type="text" name="nombre" placeholder="Nombre Completo" onChange={handleChange} required />
                </div>

                <div className="responsive-row">
                    <div className="input-group">
                        <i className="fas fa-envelope icon-field"></i>
                        <input type="email" name="email" placeholder="Correo Electrónico" onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <i className="fas fa-phone icon-field"></i>
                        <input type="tel" name="telefono" placeholder="Teléfono" onChange={handleChange} required />
                    </div>
                </div>

                <div className="responsive-row">
                    <div className="input-group">
                        <i className="fas fa-lock icon-field"></i>
                        <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <i className="fas fa-lock icon-field"></i>
                        <input type="password" name="confirmPassword" placeholder="Confirmar Contraseña" onChange={handleChange} required />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: CONDICIONAL (Según Rol) */}

            {/* B. CAMPOS DE COMERCIO */}
            {rol === 'local' && (
                <div className="form-section fade-in">
                    <h3 className="section-header" style={{color: 'var(--primary-red)'}}>
                        <i className="fas fa-store-alt"></i> Datos del Negocio
                    </h3>
                    
                    <div className="input-group">
                        <i className="fas fa-building icon-field"></i>
                        <input type="text" name="nombreComercio" placeholder="Nombre del Comercio / Taller" onChange={handleChange} />
                    </div>

                    <div className="responsive-row">
                        <div className="input-group">
                            <i className="fas fa-map-marker-alt icon-field"></i>
                            <input type="text" name="direccion" placeholder="Dirección Fiscal" onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <i className="fas fa-file-invoice icon-field"></i>
                            <input type="text" name="rfc" placeholder="RIF / Cédula Jurídica" onChange={handleChange} />
                        </div>
                    </div>
                    
                    <div className="input-group">
                        <i className="fas fa-tags icon-field"></i>
                        <select name="tipoComercio" onChange={handleChange} style={{background:'none', border:'none', width:'100%', outline:'none', color:'#555'}}>
                            <option value="">Tipo de Servicio</option>
                            <option value="taller">Taller Mecánico</option>
                            <option value="repuestos">Venta de Repuestos</option>
                            <option value="concesionario">Concesionario</option>
                            <option value="grua">Servicio de Grúa</option>
                        </select>
                    </div>
                </div>
            )}

            <button type="submit" className="btn-main-login" style={{marginTop: '20px'}} disabled={loading}>
                {loading ? 'REGISTRANDO...' : 'CREAR CUENTA'}
            </button>
        </form>

        <div className="login-link">
            <p>¿Ya tienes una cuenta? <Link to="/" className="link-login">Inicia Sesión</Link></p>
        </div>

      </div>
    </div>
  )
}