import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Registro() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  // Estado para todos los campos requeridos por la nueva BD
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    cedula: '', // CLAVE PRIMARIA de la tabla personas
    nombres: '',
    apellidos: '',
    edad: '',
    tipo_sangre: 'O+',
    genero_id: '1', // 1: Hombre (según tu SQL)
    rol: 'cliente'  // o 'local'
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegistro = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Crear Usuario en Auth (Correo y Pass)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })
      if (authError) throw authError
      if (!authData.user) throw new Error("No se pudo crear el usuario")

      const userId = authData.user.id

      // 2. Insertar en tabla PERSONAS (Con Cédula y user_id)
      const { error: personaError } = await supabase.from('personas').insert([{
        cedula: formData.cedula,
        id_auth: userId, // EL PUENTE
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        edad: parseInt(formData.edad),
        tipo_sangre: formData.tipo_sangre,
        genero_id: parseInt(formData.genero_id)
      }])
      if (personaError) throw personaError

      // 3. Insertar en tabla ROLES
      const { error: rolError } = await supabase.from('roles').insert([{
        persona_cedula: formData.cedula,
        nombre_rol: formData.rol
      }])
      if (rolError) throw rolError

      alert('¡Cuenta creada con éxito!')
      navigate('/') // Mandar al Login o Dashboard

    } catch (error) {
      console.error(error)
      alert('Error al registrar: ' + (error.message || error.details))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="main-container">
      <div className="glass-card" style={{maxWidth: '500px'}}> 
        <h2 className="login-title">CREAR CUENTA</h2>
        
        <form onSubmit={handleRegistro} className="form" style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          
          {/* Datos de Cuenta */}
          <input className="input-group" name="email" type="email" placeholder="Correo" onChange={handleChange} required style={{width:'100%', padding:'10px'}}/>
          <input className="input-group" name="password" type="password" placeholder="Contraseña" onChange={handleChange} required style={{width:'100%', padding:'10px'}}/>

          {/* Datos Personales (Tabla Personas) */}
          <input className="input-group" name="cedula" type="text" placeholder="Cédula (ID)" onChange={handleChange} required style={{width:'100%', padding:'10px'}}/>
          
          <div style={{display:'flex', gap:'10px'}}>
            <input name="nombres" type="text" placeholder="Nombres" onChange={handleChange} required style={{flex:1, padding:'10px'}}/>
            <input name="apellidos" type="text" placeholder="Apellidos" onChange={handleChange} required style={{flex:1, padding:'10px'}}/>
          </div>

          <div style={{display:'flex', gap:'10px'}}>
             <input name="edad" type="number" placeholder="Edad" onChange={handleChange} required style={{flex:1, padding:'10px'}}/>
             {/* Select de Género (Asumiendo IDs 1,2,3 del SQL) */}
             <select name="genero_id" onChange={handleChange} style={{flex:1, padding:'10px'}}>
               <option value="1">Hombre</option>
               <option value="2">Mujer</option>
               <option value="3">Otro</option>
             </select>
          </div>

          {/* Select de Rol */}
          <label style={{color:'white', marginTop:'5px'}}>¿Qué eres?</label>
          <select name="rol" onChange={handleChange} style={{padding:'10px', width:'100%'}}>
            <option value="cliente">Cliente (Busco servicios)</option>
            <option value="local">Local (Ofrezco servicios)</option>
          </select>

          <button type="submit" className="btn-main-login" disabled={loading} style={{marginTop:'20px'}}>
            {loading ? 'REGISTRANDO...' : 'FINALIZAR REGISTRO'}
          </button>
        </form>
        
        <Link to="/" className="btn-register" style={{marginTop:'15px', display:'block', textAlign:'center'}}>
           ¿Ya tienes cuenta? Inicia Sesión
        </Link>
      </div>
    </div>
  )
}