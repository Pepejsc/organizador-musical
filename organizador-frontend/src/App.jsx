import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [archivo, setArchivo] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null)
  
  const [archivosAEliminar, setArchivosAEliminar] = useState([])
  const [organizarPorGenero, setOrganizarPorGenero] = useState(false)
  const [procesandoFinal, setProcesandoFinal] = useState(false)
  
  // Usamos una referencia para poder borrar el texto de "Music.rar" al final
  const inputArchivoRef = useRef(null) 

  const manejarCambioArchivo = (evento) => {
    setArchivo(evento.target.files[0])
    setResultado(null)
    setArchivosAEliminar([])
  }

  const subirArchivo = async () => {
    if (!archivo) return;
    setCargando(true);
    const formData = new FormData();
    formData.append('archivo', archivo);

    try {
      const respuesta = await fetch('http://127.0.0.1:8000/procesar-comprimido/', {
        method: 'POST',
        body: formData,
      });
      if (!respuesta.ok) throw new Error("Error en el servidor");
      const datos = await respuesta.json();
      
      // --- NUEVA LÓGICA DE AUTO-SELECCIÓN ---
      let autoEliminar = [];
      if (datos.duplicados) {
        Object.values(datos.duplicados).forEach(rutas => {
          // De cada grupo de duplicados, dejamos la 1ra canción a salvo (índice 0)
          // y mandamos el resto a la lista de eliminación usando .slice(1)
          autoEliminar = [...autoEliminar, ...rutas.slice(1)];
        });
      }
      setArchivosAEliminar(autoEliminar);
      // --------------------------------------

      setResultado(datos);
    } catch (error) {
      alert("Hubo un problema: " + error.message);
    } finally {
      setCargando(false);
    }
  }

  const descargarFinal = async () => {
    setProcesandoFinal(true);
    try {
      const respuesta = await fetch('http://127.0.0.1:8000/generar-zip-final/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruta_interna_servidor: resultado.ruta_interna_servidor,
          archivos_a_eliminar: archivosAEliminar,
          organizar_por_genero: organizarPorGenero
        })
      });

      if (!respuesta.ok) throw new Error("Error al generar el ZIP final");

      const blob = await respuesta.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Musica_Organizada.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      // --- NUEVO: REINICIO AUTOMÁTICO DE LA INTERFAZ ---
      // Esperamos 2 segundos para que se alcance a descargar y luego borramos todo
      setTimeout(() => {
        setArchivo(null);
        setResultado(null);
        setArchivosAEliminar([]);
        setOrganizarPorGenero(false);
        if (inputArchivoRef.current) {
          inputArchivoRef.current.value = ""; // Limpiamos la caja de subida
        }
      }, 2000);
      // -------------------------------------------------

    } catch (error) {
      alert("Error en la descarga: " + error.message);
    } finally {
      setProcesandoFinal(false);
    }
  }

  return (
    <div className="contenedor">
      <h1>🎵 Organizador Musical</h1>
      <p>Sube tu carpeta comprimida (.zip o .rar) para encontrar duplicados y organizar tus canciones automáticamente.</p>

      <div className="caja-subida">
        <input 
          type="file" 
          accept=".zip,.rar" 
          onChange={manejarCambioArchivo} 
          ref={inputArchivoRef} 
        />
      </div>

      <button className="boton-principal" onClick={subirArchivo} disabled={!archivo || cargando}>
        {cargando ? "Analizando canciones..." : "Subir y Analizar"}
      </button>

      {resultado && (
        <div className="seccion-resultados">
          <div className="alerta-exito">
            <h3>¡Análisis Completado!</h3>
            <p>Se encontraron <strong>{resultado.estadisticas.total_canciones_encontradas}</strong> canciones.</p>
            <p>Duplicados detectados: <strong>{resultado.estadisticas.archivos_duplicados_detectados}</strong></p>
          </div>

          {/* Nueva visualización de la lista de eliminados (sin checkboxes) */}
          {archivosAEliminar.length > 0 && (
            <div>
              <h3 style={{ color: '#d9534f' }}>🗑️ Canciones que se eliminarán</h3>
              <p>Hemos conservado una copia original de cada una. Estas son las copias exactas que limpiaremos automáticamente:</p>
              
              <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '5px' }}>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#721c24', fontSize: '0.9rem', textAlign: 'left' }}>
                  {archivosAEliminar.map((ruta, idx) => (
                    <li key={idx}>{ruta}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="controles-finales">
            <label className="opcion-archivo" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              <input 
                type="checkbox" 
                checked={organizarPorGenero}
                onChange={(e) => setOrganizarPorGenero(e.target.checked)}
              />
              🗂️ Organizar canciones en carpetas por Género Musical
            </label>

            <button 
              className="boton-secundario" 
              onClick={descargarFinal}
              disabled={procesandoFinal}
            >
              {procesandoFinal ? "Empaquetando..." : "⬇️ Procesar y Descargar ZIP"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App