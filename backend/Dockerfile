FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend/ .

# Run the FastAPI server
# The port is provided by the PORT environment variable in Railway
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
