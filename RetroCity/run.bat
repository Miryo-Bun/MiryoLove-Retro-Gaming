@echo off
cd /d %~dp0
echo RetroCity: http://localhost:8000
python -m http.server 8000
