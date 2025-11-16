# App Control Armenia - Sistema de Fichaje

Sistema de control de fichaje con geo-cercas para empleados, con backend en Flask y frontend en React Native (Expo).

## Estructura del Proyecto

```
Administracion/
├── backend/          # API Backend (Flask)
│   ├── main.py       # Aplicación principal
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
└── FichajeApp/       # Aplicación Mobile (Expo)
    ├── App.js
    ├── index.js
    └── package.json
```

## Configuración

### Backend

1. Navega a la carpeta backend:
```bash
cd backend
```

2. Crea un archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

3. Edita `.env` con tus credenciales de base de datos.

4. Instala dependencias:
```bash
pip install -r requirements.txt
```

5. Ejecuta la aplicación:
```bash
python main.py
```

O con Gunicorn (producción):
```bash
gunicorn --bind 0.0.0.0:8080 main:app
```

### Frontend (Expo)

1. Navega a la carpeta FichajeApp:
```bash
cd FichajeApp
```

2. Instala dependencias:
```bash
npm install
```

3. Inicia la aplicación:
```bash
npm start
```

4. Selecciona la plataforma:
   - `a` para Android
   - `i` para iOS
   - `w` para Web

## Requisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL (para la base de datos)
- Expo CLI: `npm install -g expo-cli`

## Características

- ✅ Registro de fichaje con entrada/salida
- ✅ Geolocalización con GPS
- ✅ Validación de geo-cercas
- ✅ API REST en Flask
- ✅ Base de datos PostgreSQL
- ✅ Aplicación móvil React Native

## Endpoints API

### GET /
Estado del backend

### POST /registrar_fichaje
Registra un nuevo fichaje

**Payload:**
```json
{
  "empleado_id": "EMP-987",
  "tipo_fichaje": "ENTRADA",
  "actividad": "Obra Consorcio Principal",
  "latitud": 4.533000,
  "longitud": -75.675000
}
```

## Notas Importantes

- Actualiza la URL de la API en `App.js` (línea 6) con tu Cloud Function URL
- Configura las credenciales de la base de datos en `.env`
- Asegúrate de tener permisos de acceso a GPS en el dispositivo móvil
