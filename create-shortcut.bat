@echo off
:: Creates a desktop shortcut for BrailChrome
echo Creating BrailChrome shortcut on Desktop...

set SCRIPT="%TEMP%\create-brailchrome-shortcut.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\BrailChrome.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0start.bat" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "BrailChrome - Voice-driven accessible browser" >> %SCRIPT%
echo oLink.WindowStyle = 7 >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript //nologo %SCRIPT%
del %SCRIPT%

echo.
echo Shortcut created on your Desktop!
echo You can now open BrailChrome from your Desktop.
pause
