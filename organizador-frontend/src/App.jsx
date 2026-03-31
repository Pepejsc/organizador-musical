import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [archivo, setArchivo] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [archivosAEliminar, setArchivosAEliminar] = useState([])
  const [organizarPorGenero, setOrganizarPorGenero] = useState(false)
  const [procesandoFinal, setProcesandoFinal] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  
  const [progreso, setProgreso] = useState(0)
  const [textoProgreso, setTextoProgreso] = useState("")

  const inputArchivoRef = useRef(null) 

  const entradaBloqueada = cargando || resultado !== null || procesandoFinal;

  // --- NUEVA FUNCIÓN: RESET MAESTRO ---
  const resetearApp = () => {
    setArchivo(null);
    setResultado(null);
    setArchivosAEliminar([]);
    setOrganizarPorGenero(false);
    setProgreso(0);
    setTextoProgreso("");
    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
  }

  const manejarDragOver = (e) => {
    e.preventDefault();
    if (entradaBloqueada) return;
    setArrastrando(true);
  }

  const manejarDragLeave = (e) => {
    e.preventDefault();
    if (entradaBloqueada) return;
    setArrastrando(false);
  }

  const manejarDrop = (e) => {
    e.preventDefault();
    if (entradaBloqueada) return;
    setArrastrando(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setArchivo(e.dataTransfer.files[0]);
      setResultado(null);
      setArchivosAEliminar([]);
    }
  }

  const manejarClicCaja = () => {
    if (entradaBloqueada) return;
    inputArchivoRef.current.click();
  }

  const manejarCambioArchivo = (evento) => {
    setArchivo(evento.target.files[0])
    setResultado(null)
    setArchivosAEliminar([])
  }

  const subirArchivo = async () => {
    if (!archivo) return;
    setCargando(true);
    
    setProgreso(10);
    setTextoProgreso("Enviando archivo al servidor...");

    const simulador = setInterval(() => {
      setProgreso(prev => {
        if (prev >= 85) {
          setTextoProgreso("Analizando huellas digitales del audio...");
          return 85; 
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 600);

    const formData = new FormData();
    formData.append('archivo', archivo);

    try {
      const respuesta = await fetch('https://organizador-musical.onrender.com/procesar-comprimido/', {
        method: 'POST',
        body: formData,
      });
      
      if (!respuesta.ok) throw new Error("Error en el servidor");
      const datos = await respuesta.json();
      
      let autoEliminar = [];
      if (datos.duplicados) {
        Object.values(datos.duplicados).forEach(rutas => {
          autoEliminar = [...autoEliminar, ...rutas.slice(1)];
        });
      }
      setArchivosAEliminar(autoEliminar);
      
      clearInterval(simulador);
      setProgreso(100);
      setTextoProgreso("¡Análisis Exitoso!");

      setTimeout(() => {
        setResultado(datos);
        setProgreso(0); 
      }, 800);

    } catch (error) {
      clearInterval(simulador);
      setProgreso(0);
      alert("Hubo un problema: " + error.message);
    } finally {
      setCargando(false);
    }
  }

  const descargarFinal = async () => {
    setProcesandoFinal(true);
    
    setProgreso(15);
    setTextoProgreso("Borrando clones y creando carpetas...");

    const simulador = setInterval(() => {
      setProgreso(prev => {
        if (prev >= 90) {
          setTextoProgreso("Empaquetando el ZIP final...");
          return 90;
        }
        return prev + Math.floor(Math.random() * 10) + 10;
      });
    }, 400);

    try {
      const respuesta = await fetch('https://organizador-musical.onrender.com/generar-zip-final/', {
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
      
      clearInterval(simulador);
      setProgreso(100);
      setTextoProgreso("¡Descarga lista!");

      setTimeout(() => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Musica_Organizada.zip";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }, 300);

      setTimeout(() => {
        resetearApp(); // Usamos nuestra nueva función maestra aquí también
      }, 2500);

    } catch (error) {
      clearInterval(simulador);
      setProgreso(0);
      alert("Error en la descarga: " + error.message);
    } finally {
      setProcesandoFinal(false);
    }
  }

  let clasesCaja = "caja-subida";
  if (arrastrando) clasesCaja += " arrastrando";
  if (entradaBloqueada) clasesCaja += " bloqueada";

  return (
    <div className="main-wrapper">
      <div className="contenedor">
        <h1 className="title-gradient">Organizador<span className="text-neon-fuchsia"> </span>Musical</h1>
        <p className="description">
          Sube tu carpeta comprimida (.zip, .rar) para <span className="text-neon-purple">eliminar duplicados</span> y <span className="text-neon-fuchsia">organizar por género</span> automáticamente.
        </p>

        <div 
          className={clasesCaja}
          onDragOver={manejarDragOver}
          onDragLeave={manejarDragLeave}
          onDrop={manejarDrop}
          onClick={manejarClicCaja} 
        >
          <input 
            type="file" 
            accept=".zip,.rar" 
            onChange={manejarCambioArchivo} 
            ref={inputArchivoRef} 
            style={{ display: 'none' }} 
          />
          
          <div className="caja-subida-content">
            {archivo ? (
              <div className="archivo-info">
                <span className="icon-neon">📦</span>
                <span className="archivo-nombre">{archivo.name}</span>
                
                {/* --- NUEVO: Botón para quitar el archivo antes de subir --- */}
                {!cargando && !resultado && (
                  <button 
                    className="btn-quitar-archivo" 
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que se abra la ventana de buscar archivos
                      resetearApp();
                    }}
                    title="Quitar archivo"
                  >
                    ✖
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="isometric-stack">
                  <div className="layer json-layer">JSON</div>
                  <div className="layer js-layer">JS</div>
                  <div className="layer zip-layer">ZIP</div>
                </div>
                <p className="upload-text">Arrastra tu archivo o haz clic aquí</p>
                <p className="upload-subs">Formatos soportados: .zip, .rar</p>
              </>
            )}
          </div>
        </div>

        {!resultado && (
          <>
            <button 
              className="boton-principal button-neon-purple" 
              onClick={subirArchivo} 
              disabled={!archivo || entradaBloqueada}
            >
              {cargando ? "Procesando..." : "Subir y Analizar"}
            </button>

            {cargando && (
              <div className="progress-wrapper">
                <div className="progress-container">
                  <div className="progress-bar-fill" style={{ width: `${progreso}%` }}></div>
                </div>
                <span className="progress-text">{textoProgreso} ({Math.round(progreso)}%)</span>
              </div>
            )}
          </>
        )}

        {resultado && (
          <div className="seccion-resultados">
            <div className="resumen-card">
              <h3>Análisis Completado<span className="dot-green">.</span></h3>
              <div className="stats-row">
                <p>Canciones Encontradas: <span className="stat-number">{resultado.estadisticas.total_canciones_encontradas}</span></p>
                <p>Duplicados Detectados: <span className="stat-number text-red">{resultado.estadisticas.archivos_duplicados_detectados}</span></p>
              </div>
            </div>

            {archivosAEliminar.length > 0 && (
              <div className="eliminados-card">
                <h3>Copias que eliminaremos</h3>
                <div className="eliminados-list-scroll">
                  <ul>
                    {archivosAEliminar.map((ruta, idx) => (
                      <li key={idx} title={ruta}>{ruta}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="controles-finales card-dark">
              <label className="opcion-checkbox">
                <input 
                  type="checkbox" 
                  checked={organizarPorGenero}
                  onChange={(e) => setOrganizarPorGenero(e.target.checked)}
                />
                Organizar canciones por Género Musical
              </label>

              {/* --- NUEVO: Fila para agrupar ambos botones finales --- */}
              <div className="botones-accion-row">
                <button 
                  className="boton-secundario button-neon-fuchsia" 
                  onClick={descargarFinal} 
                  disabled={procesandoFinal}
                >
                  {procesandoFinal ? "Procesando..." : "Procesar y Descargar"}
                </button>

                <button 
                  className="boton-secundario button-outline-red" 
                  onClick={resetearApp} 
                  disabled={procesandoFinal}
                >
                Empezar de nuevo
                </button>
              </div>

              {procesandoFinal && (
                <div className="progress-wrapper">
                  <div className="progress-container">
                    <div className="progress-bar-fill" style={{ width: `${progreso}%` }}></div>
                  </div>
                  <span className="progress-text">{textoProgreso} ({Math.round(progreso)}%)</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App