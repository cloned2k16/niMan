# niMan  
### aka NIM (Node Installation Manager)
[![npm version](https://badge.fury.io/js/niman.svg)](https://badge.fury.io/js/niman)    
[![NPM](https://nodei.co/npm/niman.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/niman/)  

BTW .. the version graph viewer you see below is here https://njs.yaoo.net/  

WARNING:

  BETA release so don't expect it to work bugless ..
  
  and is it still just intented to be used on Windows ... 
  (as replacement for NVM)

    although it is already working,  
     it still doesn't override your main version of node, that you have already installed  
      (which lets this one was able to boot),  
      In order to have NIM take over, 
       you have to put the 'inuse' folder (which is inside the installation folder),
        inside the PATH environment variable, and make sure it comes before your original node installation path, 
         finally, if you installed it with NPM you may whant to use 'nim root' command,  
          to know where actually is such folder .. 
:D
## issues
 please note that some version of NPN version has a much too long path name in his dependencies  
 and that added to an already long path in your current NPM installation  
(which is the root of the niMan)  
 will broke the installation itself ...   
 I'll fixi it ASAP by let you chose a root folder which has to better have a very short path name to prevent   
 such silly dep dependencies   
 
# Installation - Usage


after cloning the repository wherever you'd like to ..  
(or using NPM [''npm install -g niman''])  

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
