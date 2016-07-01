@START /B /WAIT cScript.Exe //nologo %~n0.vbs %*

@IF %ERRORLEVEL% == 0 GOTO Exit
@pause

:Exit

