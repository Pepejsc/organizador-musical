from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware

import shutil
import os
import tempfile
import patoolib
import hashlib
import zipfile
import mutagen # Para leer los géneros musicales

app = FastAPI(title="Organizador Musical API")

# --- NUEVO: Configuración de CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción se pone la URL de React, por ahora permitimos todo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -----------------------------------


def calcular_hash(ruta_archivo):
    hash_md5 = hashlib.md5()
    with open(ruta_archivo, "rb") as f:
        for bloque in iter(lambda: f.read(4096), b""):
            hash_md5.update(bloque)
    return hash_md5.hexdigest()

# --- NUEVO: Molde para las instrucciones finales ---
class InstruccionesFinales(BaseModel):
    ruta_interna_servidor: str
    archivos_a_eliminar: List[str] = []
    organizar_por_genero: bool = False

@app.get("/")
def estado_api():
    return {"mensaje": "¡El motor del organizador musical está encendido y listo!"}

@app.post("/procesar-comprimido/")
async def procesar_comprimido(archivo: UploadFile = File(...)):
    extensiones_validas = ('.zip', '.rar')
    if not archivo.filename.lower().endswith(extensiones_validas):
        raise HTTPException(status_code=400, detail="Por favor, sube un archivo .zip o .rar")

    carpeta_trabajo = tempfile.mkdtemp(prefix="musica_")
    ruta_archivo = os.path.join(carpeta_trabajo, archivo.filename)

    with open(ruta_archivo, "wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)

    carpeta_extraccion = os.path.join(carpeta_trabajo, "extraido")
    os.makedirs(carpeta_extraccion, exist_ok=True)

    try:
        patoolib.extract_archive(ruta_archivo, outdir=carpeta_extraccion)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al extraer: {str(e)}")

    archivos_por_hash = {}
    total_canciones = 0
    extensiones_audio = ('.mp3', '.wav', '.flac', '.m4a', '.wma')

    for raiz, carpetas, archivos in os.walk(carpeta_extraccion):
        for nombre_archivo in archivos:
            if nombre_archivo.lower().endswith(extensiones_audio):
                total_canciones += 1
                ruta_completa = os.path.join(raiz, nombre_archivo)
                huella_digital = calcular_hash(ruta_completa)
                ruta_limpia = os.path.relpath(ruta_completa, carpeta_extraccion)

                if huella_digital not in archivos_por_hash:
                    archivos_por_hash[huella_digital] = []
                archivos_por_hash[huella_digital].append(ruta_limpia)

    duplicados = {huella: rutas for huella, rutas in archivos_por_hash.items() if len(rutas) > 1}

    return {
        "mensaje": "Análisis completado exitosamente",
        "estadisticas": {
            "total_canciones_encontradas": total_canciones,
            "archivos_duplicados_detectados": len(duplicados)
        },
        "duplicados": duplicados,
        "ruta_interna_servidor": carpeta_trabajo
    }

# --- NUEVO ENDPOINT: Aplicar cambios y descargar ---
@app.post("/generar-zip-final/")
async def generar_zip_final(instrucciones: InstruccionesFinales):
    carpeta_base = instrucciones.ruta_interna_servidor
    carpeta_extraido = os.path.join(carpeta_base, "extraido")

    if not os.path.exists(carpeta_extraido):
        raise HTTPException(status_code=400, detail="La carpeta temporal ya no existe.")

    # 1. Eliminar los archivos que el usuario no quiere
    for ruta_relativa in instrucciones.archivos_a_eliminar:
        ruta_absoluta = os.path.join(carpeta_extraido, ruta_relativa)
        if os.path.exists(ruta_absoluta):
            os.remove(ruta_absoluta)

    # 2. Organizar por géneros si el usuario lo pidió
    if instrucciones.organizar_por_genero:
        extensiones_audio = ('.mp3', '.wav', '.flac', '.m4a', '.wma')
        # Recorremos de abajo hacia arriba para evitar problemas al mover
        for raiz, carpetas, archivos in os.walk(carpeta_extraido, topdown=False):
            for archivo in archivos:
                if archivo.lower().endswith(extensiones_audio):
                    ruta_origen = os.path.join(raiz, archivo)
                    genero = "Desconocido"
                    
                    try:
                        # Leer los metadatos de la canción
                        metadata = mutagen.File(ruta_origen, easy=True)
                        if metadata and 'genre' in metadata:
                            genero = metadata['genre'][0]
                            # Limpiar caracteres raros para que sea un nombre de carpeta válido
                            genero = "".join([c for c in genero if c.isalpha() or c.isdigit() or c==' ']).strip()
                    except:
                        pass

                    # Crear la carpeta del género y mover la canción ahí
                    carpeta_genero = os.path.join(carpeta_extraido, genero)
                    os.makedirs(carpeta_genero, exist_ok=True)
                    ruta_destino = os.path.join(carpeta_genero, archivo)
                    
                    if not os.path.exists(ruta_destino):
                        shutil.move(ruta_origen, ruta_destino)

    # 3. Comprimir todo lo que quedó en un nuevo ZIP
    nombre_zip_final = "Musica_Organizada.zip"
    ruta_zip_final = os.path.join(carpeta_base, nombre_zip_final)
    
    with zipfile.ZipFile(ruta_zip_final, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for raiz, carpetas, archivos in os.walk(carpeta_extraido):
            for archivo in archivos:
                ruta_archivo = os.path.join(raiz, archivo)
                # Guardamos la estructura interna limpia en el ZIP
                ruta_en_zip = os.path.relpath(ruta_archivo, carpeta_extraido)
                zipf.write(ruta_archivo, ruta_en_zip)

    # 4. Devolver el ZIP para que el navegador lo descargue
    return FileResponse(
        path=ruta_zip_final,
        filename=nombre_zip_final,
        media_type='application/zip'
    )