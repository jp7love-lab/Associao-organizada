@echo off
echo ================================================================
echo   Associacao Organizada - Gerando APK Android
echo ================================================================
echo.

REM Configurar Java e Android SDK
set JAVA_HOME=C:\Program Files\Android\Android Studio1\jbr
set ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_SDK_ROOT%\platform-tools;%PATH%

echo [1/4] Verificando Java...
java -version
if %errorlevel% neq 0 (
    echo ERRO: Java nao encontrado em %JAVA_HOME%
    pause & exit /b 1
)

echo.
echo [2/4] Fazendo build do frontend...
cd /d "%~dp0frontend"
call npm run build
if %errorlevel% neq 0 ( echo ERRO no build ; pause & exit /b 1 )

echo.
echo [3/4] Sincronizando com Android...
call npx cap sync android
if %errorlevel% neq 0 ( echo ERRO no cap sync ; pause & exit /b 1 )

echo.
echo [4/4] Gerando APK (debug)...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 ( echo ERRO no Gradle ; pause & exit /b 1 )

echo.
echo ================================================================
echo   APK gerado com sucesso!
echo   Localizacao: android\app\build\outputs\apk\debug\app-debug.apk
echo ================================================================
echo.
explorer app\build\outputs\apk\debug\
pause
