Option Explicit

Dim nArgs 
    nArgs = WScript.Arguments.Count 

If nArgs = 0 Then
    WScript.StdOut.WriteLine    "Usage: " & vbCrLf & _
                                vbTab &"findFile <fileName>"
    WScript.Quit (1)
End If
                                
Dim sFileName, oShell, oExec, line, sExt , sE

    sFileName = WScript.Arguments(0)
    sExt      = Array("",".exe",".cmd",".com",".js")

Set oShell = WScript.CreateObject("WScript.Shell")

 
For Each sE in sExt
  Set oExec = oShell.Exec("cmd /c for %G in (""" & sFileName & sE & """) do @echo.%~$PATH:G")
  line = oExec.StdOut.ReadLine()
  If  Len(line) <> 0 Then
   Exit For
  End If
Next

WScript.Echo line & vbCrLf & " by adding: " & sE

  
