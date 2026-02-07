import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Autenticación Real con Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // 2. Si pasa, redirigir al dashboard
      // (Supabase maneja la sesión automáticamente)
      navigate('/dashboard')

    } catch (error) {
      alert('Error de acceso: ' + error.message)
      // Aquí podrías agregar la lógica del "Shake" si tienes tiempo, 
      // pero primero asegura la funcionalidad.
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="main-container">
      <div className="glass-card">
        
        {/* Logotipo */}
        <div className="company-logo">
           {/* Asegúrate de que la imagen esté en public/assets/images/ */}
          <img src="/assets/images/logo.png" alt="Logo MotoPro 360" className="main-logo" />
        </div>

        <h1 className="login-title">INICIO DE SESIÓN</h1>

        {/* Avatar Section */}
        <div className="hero-icon">
          <div className="monitor-frame">
            <i className="fas fa-user-circle"></i>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="form">
          <div className="input-group">
            <i className="fas fa-envelope icon-field"></i>
            {/* OJO: Cambié type="text" a type="email" y placeholder a CORREO */}
            <input 
              type="email" 
              placeholder="CORREO ELECTRÓNICO" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <i className="fas fa-lock icon-field"></i>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="CONTRASEÑA"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <i 
              className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-pass`}
              onClick={() => setShowPassword(!showPassword)}
              style={{cursor: 'pointer'}}
            ></i>
          </div>

          <button type="submit" className="btn-main-login" disabled={loading}>
            {loading ? (
              <span><i className="fas fa-spinner fa-spin"></i> CARGANDO...</span>
            ) : (
              <span>ACCEDER</span>
            )}
          </button>
        </form>
        
        <p>¿No tienes cuenta aún?</p>
        {/* Usamos Link de React Router en lugar de <a> */}
        <Link to="/registro" className="btn-register">¡ REGÍSTRATE AQUÍ !</Link>

        {/* Botones Extra (Funcionalidad pendiente o futura) */}
        <div className="divider">
            <span>O</span>
        </div>

        <button type="button" className="btn-guest" onClick={() => alert("Función en desarrollo")}>
            <i className="fas fa-user-secret"></i> ENTRAR COMO INVITADO
        </button>

        <footer className="footer-tag">
            @MOTOPRO360 - TODOS LOS DERECHOS RESERVADOS
        </footer>
      </div>
    </div>
  )
}