#!/bin/sh

echo "Iniciando aplicação Python..."

cd backend || exit 1

pip install -r requirements.txt

# Ajuste o nome do arquivo se necessário
python main.py
