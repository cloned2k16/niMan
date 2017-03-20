@REM MUST RUN FROM CURRENT DIR!

reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path /t REG_SZ /d "%CD%\inuse;%PATH%"
