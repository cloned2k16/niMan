@call node.exe bootLoader.js %*
@IF ERRORLEVEL 0 GOTO Exit
@rem echo result: %ERRORLEVEL%
@pause

:Exit



