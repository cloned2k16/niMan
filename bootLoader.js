'use strict';

// Hi, I'm the NmNgR Boot Loader ...
//
//  ------------------------------------------------------------------------------------------------
    var ND                                                                                              // undefined!
    ,   me              =   process
    ,   os              =   require ('os')
    ,   fs              =   require ('fs')  
    ,   http            =   require ('https')
    ,   zlib            =   require ('zlib')
    ,   childProc       =   require ('child_process')
    ,   w4it            =   require ('w4it')
    ,   isOS            =   me.arch
    ,   args            =   me.argv
    ,   sevenZ          =   '7z1604.exe'
    ,   url7Z           =   'http://www.7-zip.org/a/'+sevenZ
    ,   launchPrfx      
    ,   launchSffx      
    ,   bootFile        =   'nim'
    ,   myNodeFile      =   'node'
    ,   myNodeFile2                                                                                     // windows only
    ,   myNodePath      =   'my/'
    ,   myNodeFileExt                                                                                   // windows only ?
    ,   myNodeVer       =   'v6.2.1'
    ,   myNPM           =   'v3.9.3'
    ,   myNpnZipFile   
    ,   npmCmdFile
    ,   nodeDistBase    =   'https://nodejs.org/dist/'
    ,   npmDistBase     =   'https://codeload.github.com/npm/npm/zip/'
    ,   nodeDistURI 
    ,   sts1
    ,   sts2
    ,   sts3
    ,   sts4
    ,   dwnInProg1      =   true
    ,   dwnInProg2      =   true
    ,   dwnInProg3      =   true
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
            var sts=response.statusCode;
            if ( sts >= 300 && sts < 400){
                _log('got a redirection: ',response.headers)
            }
            if (sts !== 200) {
                fs.unlinkSync(dest); 
                return cb('Response status was ' + sts);
            }
            response.pipe(file);
            file.on('finish', function() {  file.close(cb); });
        });

        request.on('error', function (err) {    
            fs.unlinkSync(dest);
            if (cb) return cb(err);
        });

        file.on('error', function(err) { 
            fs.unlinkSync(dest); 
            if (cb) return cb(err);
        }); 
    }
    ;
    
    switch (isOS) {
        case    'x86':
        case    'x64':
                        nodeDistURI     =   nodeDistBase+myNodeVer+'/win-'+isOS+'/';
                        myNodeFile2     =   myNodeFile+'.lib';
                        myNodeFile     +=   '.exe';
                        myNpnZipFile    =   myNPM+'.zip';
                        launchPrfx      =   '';
                        launchSffx      =   '';
                        npmCmdFile      =   'npm.cmd';
                        break;
        default:                                                                                        //  ERROR!!!
            exit("unknown 'architecture' ... ");
    }
    _log('here we go..');
    
    // our App runs with its own copy of Node installed in myNodePath/node
    try         { sts1 = fs.lstatSync(myNodePath); }
    catch (err) { 
        try     { fs.mkdirSync(myNodePath); }
        catch (err)    { exit("sorry can't create folder: ",myNodePath,err); }      
    }
    
    try {
            sts1 = fs.lstatSync (myNodePath+myNodeFile);
        dwnInProg1= false;
        if (myNodeFile2 !== ND) {
            sts2 = fs.lstatSync (myNodePath+myNodeFile2);
            dwnInProg2=false;
        } 
        sts3 = fs.lstatSync     (myNodePath+myNpnZipFile);
        dwnInProg3= false;
        
        sts4 = fs.lstatSync     (myNodePath+npmCmdFile);   

    }
    catch (err)     { 
     _log('installation incomplete ...')
     try {
         if (sts1==ND)      download(nodeDistURI+myNodeFile     ,myNodePath+myNodeFile  , function (err) { 
            err && me.exit(err.message,err); dwnInProg1=false; });
         if (sts2==ND 
           &&  myNodeFile2) download(nodeDistURI+myNodeFile2    ,myNodePath+myNodeFile2 , function (err) { 
            err && me.exit(err.message,err); dwnInProg2=false; });
         else               dwnInProg2=false;
         if (sts3==ND)      download(npmDistBase+myNpn          ,myNodePath+myNpnZipFile, function (err) { 
            err && me.exit(err.message,err); dwnInProg3=false; });
     }
     catch (err)    { exit("sorry can't download Node:",err); }
     try {
         if (sts4==ND){
            _log ("unzipping ",myNpnZipFile);
            zlib.gunzip(gzipBuffer, function(err, result) {
                if(err) return _err(err);

                _log(result);
            });
         }
     }
     catch (err){
         exit("sorry can't install NPM:",err);
     }
    }

    
    w4it.enableAnimation();
    w4it.done(function () { return !dwnInProg1 
                                && !dwnInProg2
                                && !dwnInProg3
                                ; }
            , function (){
                var cmdLine =launchPrfx+myNodePath+myNodeFile+launchSffx
                ,   argss   = args
                ;
                argss.splice(0,1);                                                                      // remove node
                argss[0] = bootFile;                                                                    // replace myself
                
                //var child=childProc.spawn(cmdLine,argss,{  stdio: 'inherit' } );
                //child.on('error',function (err) { _err(err);    me.exit(-123);  });
                //child.on('exit', function (code){               me.exit(code)   });
                
            });
    
