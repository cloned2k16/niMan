@echo off
echo.

set onOff=%1
set progPath=%2
set nodeDir=%3
set target=%4


set fullPath="%progPath:"=%\%nodeDir:"=%"
set target_bckp="%nodeDir:"=%_niMan"
set target=%target:/=\%
set target=%CD%%target:.=%
echo %target%
echo.

echo fullPath: %fullPath%
echo.

dir /AL /B %progPath% | find %nodeDir%  > NUL
if %errorlevel% == 0 goto   LINK
if %errorlevel% == 1 goto   DIR

echo ERROR Unexpected ErrorLevel!!
goto EXIT

:DIR
echo This is a directory        

goto EXIT

:LINK
echo This is a symlink/junction 
echo.
IF NOT EXIST  originalNodeLink (
    echo Backup original target ..just in case
    dir /AL %progPath% | find %nodeDir%  >originalNodeLink
)
else (
    echo we got a Backup of original target 
)

dir /AL /B %progPath% | find %target_bckp%  > NUL
if %errorlevel% == 0 goto   BCKP_EXIST
echo renaming link ..
ren  %fullPath% %target_bckp%
goto MK_NEW_LINK

:BCKP_EXIST
echo backup exist
echo removing link .. %fullPath%
rmDir %fullPath%

:MK_NEW_LINK
echo new link to %fullPath% %target%
mkLink /D %fullPath% %target%

goto EXIT


:EXIT
echo.
echo Done.



