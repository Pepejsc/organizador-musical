# Organizador Musical
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

Este es un sistema **Full Stack** diseñado para melómanos y DJs que necesitan limpiar sus bibliotecas musicales. Permite subir archivos comprimidos (`.zip`, `.rar`), analizar el contenido para detectar duplicados mediante **hashing MD5** y organizar las canciones automáticamente por **Género Musical** leyendo los metadatos de los archivos.

---

## Enlace al Proyecto

Puedes probar la aplicación en vivo aquí:  
**[https://pepejsc.github.io/organizador-musical/](https://pepejsc.github.io/organizador-musical/)**

---

## Características Principales

- **Interfaz Modern-Neon:** Diseño oscuro con acentos fucsia y morado neón.
- **Detección de Duplicados:** Analiza la "huella digital" (Hash MD5) de cada canción.
- **Organización por Géneros:** Utiliza la librería `mutagen` para clasificar archivos automáticamente.
- **Drag & Drop:** Caja de subida intuitiva para archivos comprimidos.
- **Procesamiento Eficiente:** Backend en Python que maneja la descompresión y limpieza.

---

## Tecnologías Utilizadas

### Frontend
- **React.js** y **Vite**
- **CSS3 Custom Styles** (Neon Design)

### Backend
- **FastAPI**
- **Mutagen** (Metadatos)
- **Patool** (Manejo de `.rar` y `.zip`)

---

## Instalación Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/Pepejsc/organizador-musical.git

cd organizador-musical
```

### 2. Configurar Backend (Python)
```bash
cd backend

python -m venv venv

# Activar entorno virtual

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
uvicorn main:app --reload
```
### 3. Configurar Frontend (React)
```bash
cd ../frontend 

npm install

npm run dev
```
### Estructura del Proyecto
```bash
organizador-musical/
├── backend/
│   ├── main.py              # Lógica principal de la API (FastAPI)
│   ├── requirements.txt     # Librerías necesarias de Python
│   └── .gitignore           # Archivos ignorados por Git
├── organizador-frontend/
│   ├── src/                 # Código fuente de React
│   │   ├── assets/          # Imágenes y estilos neón
│   │   ├── App.jsx          # Componente principal
│   │   └── main.jsx         # Punto de entrada de React
│   ├── index.html           # Página base
│   ├── package.json         # Scripts y dependencias de NPM
│   └── vite.config.js       # Configuración de Vite
└── README.md                # Documentación del proyecto
```
## Autor
Pepe (P3p3)
GitHub: Pepejsc

## Licencia
Este proyecto está bajo la licencia MIT. ¡Siéntete libre de usarlo y mejorarlo!
