@echo off
title Bumble Dating Simulator
cd /d "%~dp0"

if exist "BumbleSimulator.exe" (
    start "" "BumbleSimulator.exe"
) else if exist "dist\BumbleSimulator.exe" (
    start "" "dist\BumbleSimulator.exe"
) else (
    start "" pythonw desktop_app.py
)
exit
