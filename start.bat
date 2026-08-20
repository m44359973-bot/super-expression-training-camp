@echo off
setlocal EnableDelayedExpansion

for %%D in (Z Y X W V U T) do (
  if not exist %%D:\ (
    subst %%D: "%~dp0"
    cd /d %%D:\
    call npm start
    set "APP_EXIT=!ERRORLEVEL!"
    cd /d "%~dp0"
    subst %%D: /d
    if not "!APP_EXIT!"=="0" pause
    goto :eof
  )
)

echo No free drive letter is available to start this app.
pause
