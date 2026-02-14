import React from 'react'

export default function LocalView({ activeTab }) {
  
  // Si la pestaña no es 'productos', este componente no muestra nada
  if (activeTab !== 'productos') return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px', padding: '10px' }}>
      
      {/* Tarjeta de "Agregar Nuevo" */}
      <div className="data-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--primary-red)', background: 'rgba(230, 57, 70, 0.05)', cursor: 'pointer', minHeight: '250px' }}>
        <i className="fas fa-plus" style={{ fontSize: '2.5rem', color: 'var(--primary-red)', marginBottom: '15px' }}></i>
        <span style={{ fontWeight: '700', color: 'var(--primary-red)' }}>Nuevo Producto</span>
      </div>

      {/* Productos Simulados */}
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
  )
}