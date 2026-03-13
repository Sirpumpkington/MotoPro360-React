import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // --- LÓGICA LOGIN CORREO ---
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      navigate('/dashboard')
    } catch (error) {
      alert('Error de acceso: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Logica del login con Google
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Esto asegura que al volver de Google, vayan al dashboard
          redirectTo: window.location.origin + '/dashboard' 
        }
      })
      if (error) throw error
    } catch (error) {
      alert('Error con Google: ' + error.message)
    }
  }

  return (
    <div className="main-container">
      <div className="glass-card">
        
        {/* Logotipo */}
        <div className="company-logo">
          <img src="/assets/images/logo.png" alt="Logo MotoPro 360" className="main-logo" />
        </div>

        <h1 className="login-title">INICIO DE SESIÓN</h1>

        {/* Avatar Section */}
        <div className="hero-icon">
          <div className="monitor-frame">
            <i className="fas fa-user-circle"></i>
          </div>
        </div>

        {/* Formulario Correo */}
        <form onSubmit={handleLogin} className="form">
          <div className="input-group">
            <i className="fas fa-envelope icon-field"></i>
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
        
        {/* Divisor Visual */}
        <div className="login-divider">
            <span className="login-divider-line"></span>
            <span className="login-divider-text">O CONTINÚA CON</span>
            <span className="login-divider-line"></span>
        </div>

        {/* Boton de Google  */}
        <button 
            type="button" 
            onClick={handleGoogleLogin} 
            className="btn-google"
        >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" className="btn-google-icon"/>
            ACCEDER CON GOOGLE
        </button>

        <p>¿No tienes cuenta aún?</p>
        <Link to="/registro" className="btn-register">¡ REGÍSTRATE AQUÍ !</Link>

        <footer className="footer-tag">
            @MOTOPRO360 - TODOS LOS DERECHOS RESERVADOS
        </footer>
      </div>
    </div>
  )
}