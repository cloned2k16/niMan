'use strict';

// Hi, I'm the niMan Boot Loader ...
//
//  ------------------------------------------------------------------------------------------------
    var ND                                                                                              // undefined!
    ,   me              =   process
    ,   os              =   require ('os')
    ,   fs              =   require ('fs')  
    ,   http            =   require ('https')
    ,   zlib            =   require ('zlib')
    ,   childProc       =   require ('child_process')
    ,   exec            =   childProc.execFileSync 
    ,   w4it            =   require ('./js-libs/w4it')
    ,   isOS            =   me.arch
    ,   args            =   me.argv
    ,   launchPrfx      
    ,   launchSffx      
    ,   bootFile        =   'nim'
    ,   myNodeFile      =   'node'
    ,   myNodeFile2                                                                                     // windows only
    ,   myNodePath      =   'my'
    ,   myNodeFileExt                                                                                   // windows only ?
    ,   myNodeVer       =   'v6.2.1'
    ,   myNPM           =   'v3.9.3'
    ,   npmExtractPath
    ,   npmPath
    ,   myNpnZipFile   
    ,   npmCommandFile
    ,   npmTempPath
    ,   nodeDistBase    =   'https://nodejs.org/dist/'
    ,   npmDistBase     =   'https://codeload.github.com/npm/npm/zip/'
    ,   nodeDistURI 
    ,   sts1
    ,   sts2
    ,   sts3
    ,   distFolder
    ,   weNeedDownload
    ,   dwnInProg1      =   true
    ,   dwnInProg2      =   true
    ,   dwnInProg3      =   true
    ,   _log            =   function    ()                  {   Function.apply.call(console.log     ,console,arguments); }
    ,   _err            =   function    ()                  {   Function.apply.call(console.error   ,console,arguments); }
    ,   exit            =   function    (msg,err)           {
        var extc    = msg ? -234 : 0;
        extc && _err(msg,err);
        me.exitCode = extc;
        me.exit();
    }
    ,   linkDirSync     =   function    (srcDir,trgDir)     {
        if (!fs.existsSync(trgDir)){
            exec('cmd',['/C','mkDir',toLocalOs(trgDir)],{  stdio: 'inherit' } );
        }
        exec("sudo.cmd",["mklink","/D",toLocalOs(trgDir+'/'+myARCH),toLocalOs(process.cwd()+'/'+srcDir)],{  stdio: 'inherit' } );
    }
    ,   copyDirSync     =   function    (srcDir,trgDir)     {
        exec("cmd",["/C","xcopy","/E","/J","/I",toLocalOs(srcDir),toLocalOs(trgDir)],{  stdio: 'inherit' } );
    }
    ,   copyFileSync    =   function    (srcFile,trgFile)   {
        exec("cmd",["/C","copy",toLocalOs(srcFile),toLocalOs(trgFile)],{  stdio: 'inherit' } );
    }
    ,   toLocalOs       =   function    (s)                 {
        switch (isOS){
            case    'x86':
            case    'x64':
                return s.replace(/\//gi,'\\');
            default:
                return s;
        }
    }
    ,   download        =   function    (url, dest, cb)     {   _log('downloading: ',url);
    
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
    ,   myARCH          =   'win-'+isOS;
    ;
    
    switch (isOS) {
        case    'x86':
        case    'x64':
                        nodeDistURI     =   nodeDistBase+myNodeVer+'/'+myARCH+'/';
                        myNodeFile2     =   myNodeFile+'.lib';
                        myNodeFile     +=   '.exe';
                        myNpnZipFile    =   myNPM+'.zip';
                        launchPrfx      =   '';
                        launchSffx      =   '';
                        npmExtractPath  =   myNodePath+"/node_modules"
                        npmPath         =   npmExtractPath+'/npm'
                        npmTempPath     =   npmPath+'-'+myNPM.substring(1)
                        npmCommandFile  =   myNodePath+'/npm.cmd';
                        distFolder      =   'dist/'
                        break;
        default:                                                                                        //  ERROR!!!
            exit("unknown 'architecture' ... ",isOS);
    }
    
    // our App runs with its own copy of Node installed in myNodePath/node
    try         { sts1 = fs.lstatSync(myNodePath); }
    catch (err) { 
        try     { fs.mkdirSync(myNodePath); }
        catch (err)    { exit("sorry can't create folder: ",myNodePath,err); }      
    }
    
    try {
        var path=myNodePath+'/';
        sts1 = fs.lstatSync     (path+myNodeFile);
        dwnInProg1= false;
        
        if (myNodeFile2 !== ND) {  sts2 = fs.lstatSync (path+myNodeFile2); } 
        dwnInProg2= false;
        
        sts3 = fs.lstatSync     (path+myNpnZipFile);
        dwnInProg3= false;
        
    }
    catch (err)     { 
        _log('downloading  ...')
        try {
            if (sts1==ND)      download(nodeDistURI+myNodeFile          ,myNodePath+myNodeFile  , function (err) { 
                err && me.exit(err.message,err); dwnInProg1=false; });
            if (sts2==ND 
                &&  myNodeFile2) download(nodeDistURI+myNodeFile2       ,myNodePath+myNodeFile2 , function (err) { 
                err && me.exit(err.message,err); dwnInProg2=false; });
            else  dwnInProg2=false;
            
            if (sts3==ND)      download(npmDistBase+myNPM               ,myNodePath+myNpnZipFile, function (err) { 
                err && me.exit(err.message,err); dwnInProg3=false; });
        }
        catch (err)    { exit("sorry can't download Node:",err); }
     
    }

    weNeedDownload=dwnInProg1 || dwnInProg2 || dwnInProg3;
    w4it.enableAnimation();
    w4it.done(function () { return !dwnInProg1 
                                && !dwnInProg2
                                && !dwnInProg3
                                ; }
            , function (){
                var cmdLine =launchPrfx+myNodePath+'/'+myNodeFile+launchSffx
                ,   argss   = args
                ;
                argss.splice(0,1);                                                                      // remove node
                argss[0] = bootFile;                                                                    // replace myself
                
                if (weNeedDownload) _log("download finished ..");
                try {
                    if (!fs.existsSync(npmPath) && !fs.existsSync(npmTempPath)){
                        _log ("unzipping:",myNpnZipFile);
                        var child=exec("xtract",[  myNodePath+myNpnZipFile,   npmExtractPath   ],{  stdio: 'inherit' } );
                    }
                }
                catch (err){ exit("sorry can't install NPM:",err); }
        
                try{
                    if (fs.existsSync(npmTempPath) && !fs.existsSync(npmPath)){
                        _log("renaming:",npmTempPath,npmPath)
                        fs.renameSync(npmTempPath,npmPath);
                    }
                }
                catch (err){ exit("sorry can't install NPM:",err.message); }
        
                try{
                    if (!fs.existsSync(npmCommandFile)){
                        _log("coping:",npmCommandFile)
                        copyFileSync(npmPath+'/bin/npm'       ,myNodePath+'/npm');
                        copyFileSync(npmPath+'/bin/npm.cmd'   ,myNodePath+'/npm.cmd');
                    }
                }
                catch (err){ exit("sorry can't install NPM:",err.message); }
                
                if (!fs.existsSync(distFolder+myNodeVer)){
                    _log('put my own node version in list ..')
                    linkDirSync(myNodePath,distFolder+myNodeVer);
                }
                    
                if (!fs.existsSync('node_modules')){         
                    _log("installing packages...");
                
                    exec(toLocalOs(npmCommandFile),["install"],{  stdio: 'inherit' } );
                }
                
                
                var child=childProc.spawn(cmdLine,argss,{  stdio: 'inherit' } );
                child.on('error',function (err) { _err(err);    me.exit(-123);  });
                child.on('exit', function (code){               me.exit(code)   });
        });
    
