@echo off

set onOff=%1
set progPath=%2
set nodeDir=%3
set target=%4

@rem workaround to fix nodejs mess with spaces inside process spanw arguments
set progPath=%progPath:#= %
set nodeDir=%nodeDir:#= %
set target=%target:#= %

echo %progPath% - %nodeDir%

dir /AL /B "%progPath%" | find "%nodeDir%"  
if %errorlevel% == 0 echo This is a symlink/junction 
if %errorlevel% == 1 echo This is a directory        



