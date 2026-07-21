#!/bin/bash

BASE="/Users/manuelsalgado/Downloads/gs-spring-boot-main 2"
BACKEND="$BASE/complete"
FRONTEND="$BASE/complete/mi-web"

echo "Arrancando Spring Boot..."

cd "$BACKEND" || {
    echo "No se encuentra el backend: $BACKEND"
    exit 1
}

./gradlew bootRun &
BACKEND_PID=$!

echo "Esperando a que arranque el backend..."
sleep 8

echo "Arrancando frontend..."

cd "$FRONTEND" || {
    echo "No se encuentra el frontend: $FRONTEND"
    kill "$BACKEND_PID"
    exit 1
}

python3 -m http.server 5500 &
FRONTEND_PID=$!

sleep 2

echo "Abriendo navegador..."
open http://localhost:5500

echo ""
echo "Aplicación iniciada."
echo "Backend:  http://localhost:8080"
echo "Frontend: http://localhost:5500"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"