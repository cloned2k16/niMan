# niMan  
### aka NIM (Node Installation Manager)
[![npm version](https://badge.fury.io/js/niman.svg)](https://badge.fury.io/js/niman)    
[![NPM](https://nodei.co/npm/niman.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/niman/)  

WARNING:

  BETA release so don't expect it to work bugless ..
  
  and is it still just intented to be used on Windows ... 
  (as replacement for NVM)

     altough it is working,  
      it still doesn't override the main version of node,  
       you have installed already ,  
        to do so you have to put the 'inuse' folder inside the installation folder,
         in the PATH and make sure comes before your original node installation  
          if you installed it with NPM you may whant to use 'nim root' to know where actually is
  
:D

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
