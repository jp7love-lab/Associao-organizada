@echo off
:: Solicita elevacao automaticamente
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Solicitando permissao de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit
)

echo Liberando porta 3001 no Firewall do Windows...
netsh advfirewall firewall delete rule name="AMFAC Backend 3001" >nul 2>&1
netsh advfirewall firewall add rule name="AMFAC Backend 3001" dir=in action=allow protocol=TCP localport=3001
echo.
echo Porta 3001 liberada com sucesso!
echo Agora o celular Android pode se conectar ao backend.
echo.
pause
