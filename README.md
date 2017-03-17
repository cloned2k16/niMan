# niMan  
### aka NIM (Node Installation Manager)

WARNING:

  ALPHA release so don't expect it to work bugless ..
  
  and is it still just intented to be used on Windows ... 
  (as replacement for NVM)
    
:D

# Installation - Usage

after cloning the repository wherever you'd like to ..  
(or using NPM [''npm install -g niman'']) [![npm version](https://badge.fury.io/js/niman.svg)](https://badge.fury.io/js/niman)  

just type:  
```
nim
```  
at the command prompt ...
  this will either install required node and packages  
  or just start the app showing the Usage information ...  
  (actually you can use whichever command argument you'd like to ..)
  
NIM uses a two stages loader, so it first checks for his own version of Node (6.2.1, at the moment )  
and if not present, downloads it along with corresponding NPM ...   
then installs additional ´required´packages,   
and finally starts the app as would do it normally ...  
  
![](demo.gif)


# GUI  

![](GUI.png)
