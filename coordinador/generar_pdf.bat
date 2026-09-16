@echo off
setlocal EnableDelayedExpansion
title Generar PDF - Optica Vision de Aguila

rem ================================================================
rem  Genera el PDF directamente (sin abrir la ventana de impresion)
rem  usando el modo "headless" de Chrome / Edge, que respeta el CSS
rem  de impresion del archivo (colores, orientacion mixta, etc.).
rem
rem  USO:
rem    - Doble clic           -> genera el PDF de "Contabilidad V3.html"
rem    - Arrastrar un .html   -> genera el PDF de ese archivo
rem
rem  El PDF queda en la misma carpeta del archivo, con su mismo nombre.
rem ================================================================

if "%~1"=="" (
  set "INPUT=%~dp0views\contabilidadDiaria.html"
) else (
  set "INPUT=%~1"
)

if not exist "%INPUT%" (
  echo.
  echo  ERROR: No existe el archivo:
  echo         %INPUT%
  echo.
  pause
  exit /b 1
)

rem --- Buscar Chrome o Edge instalado ---
set "BROWSER="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe"          set "BROWSER=C:\Program Files\Google\Chrome\Application\chrome.exe"
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"    set "BROWSER=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe"         set "BROWSER=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"   set "BROWSER=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if "%BROWSER%"=="" (
  echo.
  echo  ERROR: No se encontro Chrome ni Edge instalado en el equipo.
  echo.
  pause
  exit /b 1
)

for %%F in ("%INPUT%") do set "OUT=%%~dpnF.pdf"
set "PROF=%TEMP%\genpdf_%RANDOM%"

echo.
echo  Generando PDF, un momento...
echo    Entrada : %INPUT%
echo    Salida  : %OUT%
echo.

start "" /wait "%BROWSER%" --headless=new --disable-gpu --no-pdf-header-footer --user-data-dir="%PROF%" --print-to-pdf="%OUT%" "%INPUT%"

if exist "%PROF%" rmdir /s /q "%PROF%" >nul 2>&1

if exist "%OUT%" (
  echo.
  echo  LISTO! PDF generado:
  echo    %OUT%
) else (
  echo.
  echo  No se pudo generar. Respaldo: abre el archivo y usa Ctrl+P
  echo  con la opcion "Guardar como PDF".
)
echo.
if "%PDFGEN_SILENT%"=="1" exit /b 0
pause