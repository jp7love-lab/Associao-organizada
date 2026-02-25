@echo off
netsh advfirewall firewall delete rule name="AMFAC3000" >nul 2>&1
netsh advfirewall firewall delete rule name="AMFAC3001" >nul 2>&1
netsh advfirewall firewall add rule name="AMFAC3000" protocol=TCP dir=in localport=3000 action=allow
netsh advfirewall firewall add rule name="AMFAC3001" protocol=TCP dir=in localport=3001 action=allow
echo PORTAS 3000 e 3001 LIBERADAS!
echo Agora o celular consegue acessar o app.
pause
