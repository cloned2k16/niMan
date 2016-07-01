'use strict';

// Hi, I'm the NmNgR Boot Loader ...
//
//  ------------------------------------------------------------------------------------------------
    var ND              // undefined!
    ,   me              =   process
    ,   os              =   require ('os')
    ,   fs              =   require ('fs')  
    ,   http            =   require ('http')
    //,   request         =   require ('request')
    ,   w4it            =   require ('w4it')
    ,   childProc       =   require ('child_process')
    ,   isOS            =   me.arch
    ,   args            =   me.argv
    ,   launchPrfx      
    ,   launchSffx      
    ,   bootFile        =   'nim'
    ,   myNodeFile      =   'node'
    ,   myNodeFile2         // windows only
    ,   myNodePath      =   'my/'
    ,   myNodeFileExt       // windows only ?
    ,   myNodeVer       =   'v6.2.1'
    ,   nodeDistBase    =   'http://nodejs.org/dist/'
    ,   nodeDistURI 
    ,   sts1
    ,   sts2
    ,   dwnInProg1      =   true
    ,   dwnInProg2      =   true
    ,   _log            =   function    ()              {   Function.apply.call(console.log     ,console,arguments); }
    ,   _err            =   function    ()              {   Function.apply.call(console.error   ,console,arguments); }
    ,   exit            =   function    (msg,err)       {
        var extc    = msg ? -234 : 0;
        extc && _err(msg,err);
        me.exitCode = extc;
        me.exit();
    }
    ,   download        =   function    (url, dest, cb) {   _log('downloading: ',url);
            var file    = fs.createWriteStream(dest)
            ,   request = http.get(url, function(response) {

                if (response.statusCode !== 200) {
                    fs.unlink(dest); 
                    return cb('Response status was ' + response.statusCode);
                }
                response.pipe(file);
                file.on('finish', function() {  file.close(cb); });
            })
            ;

            request.on('error', function (err) {    
                fs.unlink(dest);
                if (cb) return cb(err);
            });

            file.on('error', function(err) { 
                fs.unlink(dest); 
                if (cb) return cb(err);
            }); 
    }
    ;
    
    switch (isOS) {
        case    'x86':
        case    'x64':
                        nodeDistURI =  nodeDistBase+myNodeVer+'/win-'+isOS+'/';
                        myNodeFile2  =  myNodeFile+'.lib';
                        myNodeFile  +=  '.exe';
                        launchPrfx   =   '';
                        launchSffx   =   '';
                        break;
        default:                                
                        //ERROR!!!
    }
    
    // our App runs with its own copy of Node installed in myNodePath/node
    try     { sts1 = fs.lstatSync(myNodePath); }
    catch (err) { 
     try    { fs.mkdirSync(myNodePath); }
     catch (err)    { exit("sorry can't create folder: ",myNodePath,err); }      
    }
    
    try {
        sts1 = fs.lstatSync(myNodePath+myNodeFile);
        dwnInProg1= false;
     if (myNodeFile2 !== ND) {
        sts2 = fs.lstatSync(myNodePath+myNodeFile2);
        dwnInProg2=false;
     }    
    }
    catch (err)     { 
     try {
         if (sts1==ND)      download(nodeDistURI+myNodeFile   ,myNodePath+myNodeFile , function (err) { err && me.exit(err.message,err); dwnInProg1=false; });
         if (sts2==ND 
           &&  myNodeFile2) download(nodeDistURI+myNodeFile2  ,myNodePath+myNodeFile2, function (err) { err && me.exit(err.message,err); dwnInProg2=false; });
         else               dwnInProg2=false;
     }
     catch (err)    { exit("sorry can't download Node:",err); }
    }

    try {
        
    }   
    catch (err)     { 
    }    
    
    w4it.enableAnimation();
    w4it.done(function () { return !dwnInProg1 && !dwnInProg2; }
            , function (){
                var cmdLine =launchPrfx+myNodePath+myNodeFile+launchSffx
                ,   argss   = args
                ;
                argss.splice(0,1);      // remove node
                argss[0] = bootFile;    // replace myself
                
                //_log("exec:",cmdLine,args);
                var child=childProc.spawn(cmdLine,argss,{  stdio: 'inherit' } );
                child.on('error',function (err) { _err(err);    me.exit(-123);  });
                child.on('exit', function (code){               me.exit(code)   });
                
            });
    
    