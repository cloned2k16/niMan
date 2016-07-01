Option Explicit 

Dim nArgs 
    nArgs = WScript.Arguments.Count 

If nArgs = 0 Then
    WScript.StdOut.WriteLine    "Usage: " & vbCrLf & _
                               vbTab &"SUDO [command [arguments] [options] ...]" & vbCrLf & _
                               vbTab &" Runs a `program` with parameters as root in same console window." & vbCrLf 
                               
    WScript.Quit 1
End If
    
    Dim sHell, sHellApp, cmd, args, i
    
    Set sHell       = CreateObject("WScript.Shell")
    Set sHellApp    = CreateObject("Shell.Application")

        cmd   = sHell.ExpandEnvironmentStrings("%COMSPEC%")
   
        args = "/C CD " & sHell.CurrentDirectory & " & "
        For i = 0 To nArgs - 1
            args = args & " " & WScript.Arguments(i)
        Next
    
    sHellApp.ShellExecute cmd, args, "", "runAs" , 0
