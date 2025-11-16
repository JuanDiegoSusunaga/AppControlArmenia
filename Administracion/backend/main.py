import os
import logging
from datetime import datetime

import pg8000.native
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud.sql.connector import Connector, IPTypes

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar Flask app
app = Flask(__name__)

# Habilitar CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuración de variables de entorno
INSTANCE_CONNECTION_NAME = os.getenv("INSTANCE_CONNECTION_NAME")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "fichajes_db")
DB_PORT = int(os.getenv("DB_PORT", 5432))

# Inicializar el Cloud SQL Connector
connector = None

def get_connector():
    """Obtiene o crea la instancia del Cloud SQL Connector."""
    global connector
    if connector is None:
        connector = Connector()
    return connector

def get_db_connection():
    """Obtiene una conexión a Cloud SQL."""
    try:
        conn = get_connector().connect(
            INSTANCE_CONNECTION_NAME,
            "pg8000",
            user=DB_USER,
            password=DB_PASS,
            db=DB_NAME,
            ip_type=IPTypes.PRIVATE if os.getenv("USE_PRIVATE_IP", "false").lower() == "true" else IPTypes.PUBLIC,
        )
        return conn
    except Exception as e:
        logger.error(f"Error connecting to Cloud SQL: {str(e)}")
        raise

def init_db():
    """Inicializa la base de datos creando la tabla si no existe."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS fichajes (
                id SERIAL PRIMARY KEY,
                empleado_id VARCHAR(50) NOT NULL,
                tipo VARCHAR(20) NOT NULL,
                actividad TEXT,
                latitud FLOAT,
                longitud FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")

# Health check endpoint
@app.route("/", methods=["GET"])
def health():
    """Health check endpoint para Cloud Run."""
    return jsonify({
        "status": "OK",
        "message": "Backend funcionando correctamente",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }), 200

@app.route("/health", methods=["GET"])
def health_check():
    """Health check adicional."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"}), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 503

# Registrar un fichaje
@app.route("/api/fichajes", methods=["POST"])
def registrar_fichaje():
    """Registra un nuevo fichaje de entrada/salida."""
    try:
        data = request.json
        
        # Validar datos requeridos
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        empleado_id = data.get("empleado_id")
        tipo = data.get("tipo_fichaje")
        actividad = data.get("actividad")
        lat = data.get("latitud")
        lon = data.get("longitud")
        
        # Validación básica
        if not empleado_id or not tipo:
            return jsonify({"error": "empleado_id y tipo_fichaje son requeridos"}), 400
        
        if tipo not in ["ENTRADA", "SALIDA"]:
            return jsonify({"error": "tipo_fichaje debe ser ENTRADA o SALIDA"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO fichajes (empleado_id, tipo, actividad, latitud, longitud)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (empleado_id, tipo, actividad, lat, lon))
        
        result = cursor.fetchone()
        conn.commit()
        
        fichaje_id = result[0] if result else None
        created_at = result[1] if result else None
        
        cursor.close()
        conn.close()
        
        logger.info(f"Fichaje registrado: empleado_id={empleado_id}, tipo={tipo}")
        
        return jsonify({
            "success": True,
            "mensaje": "Fichaje registrado exitosamente",
            "fichaje_id": fichaje_id,
            "timestamp": created_at.isoformat() if created_at else None
        }), 201
    
    except Exception as e:
        logger.error(f"Error registering fichaje: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Obtener fichajes de un empleado
@app.route("/api/fichajes/<empleado_id>", methods=["GET"])
def obtener_fichajes(empleado_id):
    """Obtiene todos los fichajes de un empleado."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, empleado_id, tipo, actividad, latitud, longitud, created_at
            FROM fichajes
            WHERE empleado_id = %s
            ORDER BY created_at DESC
            LIMIT 100
        """, (empleado_id,))
        
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        
        fichajes = []
        for row in rows:
            fichajes.append({
                "id": row[0],
                "empleado_id": row[1],
                "tipo": row[2],
                "actividad": row[3],
                "latitud": row[4],
                "longitud": row[5],
                "created_at": row[6].isoformat() if row[6] else None
            })
        
        return jsonify({"fichajes": fichajes, "total": len(fichajes)}), 200
    
    except Exception as e:
        logger.error(f"Error fetching fichajes: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Manejo de errores
@app.errorhandler(404)
def not_found(error):
    """Maneja errores 404."""
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    """Maneja errores 500."""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({"error": "Internal server error"}), 500

# Inicialización
if __name__ == "__main__":
    # Inicializar base de datos
    init_db()
    
    # Ejecutar la aplicación
    port = int(os.getenv("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
