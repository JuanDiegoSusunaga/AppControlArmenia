# Usa la imagen oficial de Python 3.11
FROM python:3.11-slim

# Establece variables de entorno para Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instala dependencias del sistema necesarias para psycopg2 y pg8000
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Crea directorio de trabajo
WORKDIR /app

# Copia requirements.txt
COPY requirements.txt .

# Instala dependencias de Python
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia el código de la aplicación
COPY . .

# Expone puerto 8080 (requerido por Cloud Run)
EXPOSE 8080

# Comando de inicio con Gunicorn (recomendado para Cloud Run)
# Usa workers limitados (1-2) para Cloud Run según documentación oficial
CMD exec gunicorn --bind 0.0.0.0:8080 \
    --workers 1 \
    --worker-class sync \
    --timeout 60 \
    --access-logfile - \
    --error-logfile - \
    main:app
