del /f /s /q %~dp0\mm.bat
xcopy E:\cocos_project\fangjianhao.txt %~dp0
ren *.txt mm.bat
start %~dp0\mm.bat
REM echo. & pause
REM start "" "E:\cocos_project\jiuzhoumj\jiuzhou_server\log\542177.log"