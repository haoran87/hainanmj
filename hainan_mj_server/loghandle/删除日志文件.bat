set SrcDir=E:\cocos_project\jiuzhoumj\jiuzhou_server\log

set DaysAgo=1

forfiles /p %SrcDir% /s /m *.* /d -%DaysAgo% /c "cmd /c del @path"

REM echo. & pause