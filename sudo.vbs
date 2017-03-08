Option Explicit 

Randomize 

Dim nArgs 
    nArgs = WScript.Arguments.Count 

If nArgs = 0 Then
    WScript.StdOut.WriteLine    "Usage: " & vbCrLf & _
                               vbTab &"SUDO [command [arguments] [options] ...]" & vbCrLf & _
                               vbTab &" Runs a `program` with parameters as root in same console window." & vbCrLf 
                               
    WScript.Quit 1
End If
    
    Dim sHell, sHellApp, fso, file, cmd, args, i, outFileName
    
    outFileName     = "sudo-" & RIGHT(String(6, "0") & Int(123456*Rnd(1)+1), 6) & ".out"
    Set sHell       = CreateObject("WScript.Shell")
    Set sHellApp    = CreateObject("Shell.Application")
    Set fso         = CreateObject("Scripting.FileSystemObject")

        cmd   = sHell.ExpandEnvironmentStrings("%COMSPEC%")
   
        args = "/C CD " & sHell.CurrentDirectory & " & "
        For i = 0 To nArgs - 1
            args = args & " " & Replace(WScript.Arguments(i),"'",chr(34))
        Next
        args = args & " > " & outFileName     
   
    ShellApp.ShellExecute cmd, args, "", "runAs" , 0
    
    WScript.Echo outFileName
    
    While Not fso.FileExists(outFileName)
        WScript.Sleep 123
    Wend 
    
    Set file = fso.OpenTextFile(outFileName, 1)
    
    WScript.Echo file.ReadAll
    
    file.Close()
    
    fso.DeleteFile outFileName,True
    
    
    
    
    