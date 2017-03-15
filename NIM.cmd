@set CD_ORG=%CD%
@cd /d %~dp0
@call node.exe .\bootLoader.js %*
@IF ERRORLEVEL 0 GOTO Exit
@rem echo result: %ERRORLEVEL%
@pause

:Exit
@cd /d %CD_ORG%




