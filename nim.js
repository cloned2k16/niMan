    // this file is supposed to run under at least version 6.x.x of Node
    // so instead to try to keep backward compatibility we decided to use a two stage bootloader strategy
    // which nomatter which current version of node you have installed will start with a very small
    // stage one that is where we'll keep backward compatibility, then run the app usin an own version
    // of Node specified in the first sage and eventually download it if not installed already
    //

    const
            info            =   {
                                version :   '0.0.1'
                            ,   desc    :   'Node Installation Manager aka NVM++'
                            }
    ,       path            =   require ('path')
    ,       os              =   require ('os')
    ,       fs              =   require ('fs')
    ,       w4it            =   require ('w4it')
    ,       http            =   require ('https')
    ,       request         =   require ('request')
    ,       childProc       =   require ('child_process')
    ,       express         =   require ('express')
    ,       morgan          =   require ('morgan')
    ,       socketIO        =   require ('socket.io')
    
    ,       validArchs      =   {   'win'   :   ['x86','x64']
                                ,   'arm'   :   ['arm64','arm6l','arm7l']
                                ,   'darwin':   ['x64']
                            }
    ,       validArchPaths  =   {   'win'   :   [   ['','x86','win-x86']
                                                ,   ['x64','win-x64']       ]
                                ,   'arm'   :   [   [''],[''],['']          ]                           
                                ,   'darwin':   [   ['']                    ]                           
                            }
                            
    ,       pathSep         =   path.sep
    ,       nodeFolder      =   './inuse/'          // default location
    ,       nodeExtens      =   '.exe'
    ,       nodeStoreDir    =   './dist/'
    ,       nodeDistBase    =   'https://nodejs.org/dist/'
    ,       iojsDistBase    =   'https://iojs.org/dist/'
    ,       _log            =   (...args)       =>  { Function.apply.call(console.log   ,console,args); }
    ,       _err            =   (...args)       =>  { Function.apply.call(console.error ,console,args); }
    ,       normalizeVer    =   (ver)           =>  { return (ver ? ver[0]=='v' ? ver : ver[0]=='V'? 'v'+ver.substring(1) : 'v'+ver : 'v_');  }
    ,       normalizeArch   =   (arch)          =>  { return archPrfx+ (arch || myArch); }
    ,       NIM             =   'nim'
    ,       usage           =   ()              =>  {
        _log('Usage:');
        _log('');
        _log('   '+NIM+' arch                        : Show whichever arch node is using.'                              );
        _log('   '+NIM+' install <version> [arch]    : The version can be any Node version either from NodeJs of IOJS'  );
        _log('                                           see: http://cloned2k16.github.io/jsNVM/'                       );
        _log('   '+NIM+' list [available]            : List the current installation list or the availables to download');
        //_log('   '+NIM+' on                          : Enable  this version management');
        //_log('   '+NIM+' off                         : Disable this version management');
        _log('   '+NIM+' remove  <version> [arch]    : Uninstall specified version'                                     );
        _log('   '+NIM+' use     <version> [arch]    : Switch to the specified version and optionally arch'             );
        //_log('   '+NIM+' root [path]                 : Set or Show where all the versions are stored into');
        _log('   '+NIM+' version                     : Shows the version of this tool'                                  );
        _log('');
        _log('   '+NIM+' gui                         : Start an useful graphical interface (web)                       ');
        
    }
    ,       downloadFiles   =   (url,dir,list)  =>  {
             try { 
                //_log('download files from: ',url, ' --> ',dir);
                request.head(url,(err, res, body) => {
                    if (!err && res.statusCode == 200) {
                     var inProg = []  
                     
                     try { 
                        var pos =dir.lastIndexOf('/')
                            vDir=dir.substring(0,pos);
                        ;
                        try { fs.mkdirSync(vDir); }catch (_e) {}
                        fs.mkdirSync(dir); 
                     }
                     catch (e){ if (e.code!='EEXIST'){ _err(e);  return -1; } }
                     
                     for (i in list) {
                       inProg[i]=true;  
                       var fName= list[i]
                       _log('downloading.. ',url+'/'+fName,' into: ',dir+'/'+fName);
                       
                       var  fPath   = dir+'/'+fName
                       ,    file    = fs.createWriteStream(fPath)
                       ,    endErr  = ((ii,p) => { return (err) => { _log('endErr',err,ii); fs.unlink(p); inProg[ii]=false; }})(i,fPath)
                       ,    req     = http.get(url+'/'+fName, ((f,p,ii) => { return (res) =>{
                            if (res.statusCode !== 200) {
                                fs.unlink(p); 
                                return _err('Response status was ' + res.statusCode);
                            }
                            res.pipe(f);
                            f.on('finish', ((ii,ff) => { return () => { _log(list[ii],' done.'); ff.close(); inProg[ii]=false;  }})(ii,f) );
                       }})(file,fPath,i));
                        req.on ('error', (err) => { endErr(err); });
                        file.on('error', (err) => { endErr(err); });
                     }
                     
                     w4it.enableAnimation();
                     w4it.done ( () => { 
                      for (i in list) { if (inProg[i]) return false; }
                      return true;
                     }   
                     , () =>{
                         _log('DONE');
                         return 0;
                     });
                    }
                    else {
                     return res.statusCode;
                    }
                });
             } 
             catch (ex) { _err(ex,-123); }
             return -1;
    }
    ;

    //  ===================================================== GUI Configuration
    const   _APP                =   {};
            _APP.PUBLIC_HTML    = '/GUI'; 
            _APP.BOWER_DIR      = '/js-libs';
            _APP.LISTEN_PORT    = process.env.PORT || 1111;
            _APP.URL_BASE       = 'http://localhost';
            _APP.log            = function log  ()      { return Function.apply.call(console.log    ,console,arguments); };
            _APP.timeSt         = function      (name)  { return timers[name]= (new Date()).getTime();};
            _APP.timeEn         = function      (name)  { return (new Date()).valueOf() - timers[name];};
            _                   = _APP;
   
    //  ===================================================== 
    
    const   
            do_ARCH         =   (cmd,newA)      =>  {
                try {               
                    // probably we better write it to a file instead
                    let nf  = fs.readlinkSync   (nodeFolder)
                    ,   p1  = nf.lastIndexOf    (pathSep)
                    ,   p2  = nf.lastIndexOf    ('-')
                    ,   arc = nf.substring      ((p2>0?p2:p1)+1)
                    ;
                    newA = newA && newA.toLowerCase();  
                    if (ND !== newA) {
                        _log('set default ARCH:',newA)
                        try { 
                         if (0 > validArchs.indexOf(newA)) throw Exception();
                        }
                        catch (e) {
                          _log('sorry!, ',newA,' is a not valid Arch');
                          return null;
                        }   
                    }
                    else {
                        _log(arc);
                        return arc;
                    }    
                }
                catch (ex) { 
                 _log("it looks like we don't have any version installed yet .."); 
                 return null;
                }
            }
    ,       do_LIST         =   (cmd,avlbl)     =>  { 
                var av = avlbl && avlbl.length>1 && 'available'.startsWith(avlbl.toLowerCase());
                
                if (av) { _log('listing avaiables');

                    return;
                }
                else if (avlbl) _log('unknown option: ',avlbl);
                
                _log('installed versions:');
                _log();
                
                let i
                ,   name
                ,   list    = []
                ,   ver
                ,   arch    
                ,   p1      
                ;
                    try {
                        ver     = fs.readlinkSync   (nodeFolder);
                        p1      = ver.lastIndexOf   (pathSep);
                        arch    = ver.substring  (   p1+1);                          //get arch
                        ver     = ver.substring  (0, p1  );                          //strip arch
                        ver     = ver.substring  (   ver.lastIndexOf    (pathSep)+1); //strip base path
                        p1      = arch.lastIndexOf('-')
                        arch    = p1<0? arch : arch.substring(   p1+1);             //arch
                        _log('in use:',ver , arch);
                    } 
                    catch (ee){ 
                     //_log("sorry: can't find any version in use!"); return -1; 
                     
                    }
                
               
                try {
                     files = fs.readdirSync(nodeStoreDir);
                    if (files[0].name) {/* force err if not present */}
                    for (i in files){
                        name = files[i];
                        fPath = nodeStoreDir + name;
                        if (fs.statSync(fPath).isDirectory()){
                            var archs=fs.readdirSync(fPath);
                            for (a in archs) {
                                var  archN   =   archs[a]
                                ,    nPath   =   fPath + '/' + archN + '/node'+ nodeExtens
                                ;
                                try {
                                    fs.statSync(nPath)
                                    p1     =   archN.lastIndexOf('-')
                                    archN  = (p1<0?archN:archN.substring(p1+1));
                                    _log('\t\t   ',name, ' ('+archN+')');
                                    var vs = {};
                                        vs[name] = archN;
                                    if (ver==name && arch==archN) vs.xyw=true;               
                                    list[list.length]=vs;
                                }
                                catch (e){}
                            }
                        }
                    }
                    return list;
                }
                catch (exc){
                    _log('sorry looks like you have none installed');
                    return null;
                }
            }        
    ,       do_USE          =   (cmd,_ver,_arch)=>  {
                let ver     = normalizeVer  (_ver)
                ,   arch    = normalizeArch (_arch)
                ;
                
                var vPath   = nodeStoreDir + ver + '/' + arch;
                try {
                    files = fs.readdirSync(vPath);
                    for (i in nodeRequired) if (0> files.indexOf(nodeRequired[i])) {
                        _err("required file missing ["+nodeRequired[i]+"] ",files);
                        me.exitCode=-3; 
                    }
                    try {
                        try { fs.rmdirSync   (nodeFolder); } catch(e) { }
                        var slsh = /\//g
                        ,   bsls = '\\'  
                        ,   child
                        ;
          
                        //fs.symlinkSync (nodeFolder,nodeStoreDir);
                        symLinkArgs.push(nodeFolder   .replace(slsh,bsls));
                        symLinkArgs.push(vPath        .replace(slsh,bsls));

                        child=childProc.spawn(symLinkCommand ,symLinkArgs,{  stdio: 'inherit' } );
                        child.on('error',function (err) { _err(err);    me.exit(-123);  });
                        child.on('exit', function (code){               me.exit(code)   });
                    }
                    catch (ex){ _err(ex); }
                }
                catch (ex){
                    _err("version ["+args[1]+"]("+arch+") not found in our store ..\n  use install command to add it to the store");
                    me.exitCode = -2;
                }
            }
    ,       do_INSTALL      =   (cmd,_ver,_arch)=>  {
                var ver     = normalizeVer  (_ver)
                ,   arch    = normalizeArch (_arch)
                ,   vPath   = ver+'/'
                ,   notFnd1 = false
                ,   notFnd2 = false
                ;
        
        
                request.head(nodeDistBase+vPath,function (err, response, body) {
                   
                    if (!err && response.statusCode == 200) {
                        let a
                        ,   vDir
                        ,   archs = validArchPaths.win[arch.endsWith('64')?1:0]
                        for (a in archs) {
                         vDir=vPath+archs[a];    
                         downloadFiles(nodeDistBase+vDir,nodeStoreDir+vDir,nodeRequired);
                        }
                    }
                    else {
                        notFnd1 = true;
                        saySorry();
                    }
                    
                });
        
                request.head(iojsDistBase+vPath,function (err, response, body) {
                    if (!err && response.statusCode == 200) {
                     let a
                        ,   vDir
                        ,   archs = validArchPaths.win[arch.endsWith('64')?1:0]
                        for (a in archs) {
                         vDir=vPath+archs[a];    
                         downloadFiles(iojsDistBase+vDir,nodeStoreDir+vDir,iojsRequired);
                        }
                         
                    }
                    else {
                        notFnd2 = true;
                        saySorry();
                    } 
                });
                
                
                saySorry = function () {
                  if (notFnd1 && notFnd2) _log("sorry! .. can't find version:", _ver );
                } 
        
            }
    ,       do_REMOVE       =   (cmd,_ver,_arch)=>  {
                var ver     = normalizedVer (_ver)
                ,   arch    = normalizedArch(_arch)
                ,   vPath   = nodeStoreDir + ver + '/' + arch
                ;
        
                
                _log('removing: ',vPath);
                try {
                    files = fs.readdirSync(vPath);
                    for (i in files){
                        fs.unlinkSync(vPath+'/'+files[i]);
                    }         
                    fs.rmdirSync  (vPath);
                }
                catch (ex){ _err(ex)
                    _err('not found: ['+ver+'] ('+arch+')');  
                }    
            }
    ,       do_VERSION      =   (cmd)           =>  {
                _log(info.version);
            }            
    ,       do_GUI          =   (cmd,show)      =>  {
             try{   
                app=express();
                // setup static content folders 
                app.use(express.static(__dirname + _.PUBLIC_HTML));                 //
                app.use(express.static(__dirname + _.BOWER_DIR  ));
    
   
                app.use('/cmmnd', (reQ,res) => {// _log('reQ',reQ);
                    var H   = reQ.headers
                    ,   R   = reQ.rawHeaders
                    ,   U   = reQ._parsedUrl
                    ,   fn  = U.query
                    ;
                    switch (fn) {
                      case 'arch' :
                                    var arch = do_ARCH(fn);
                                    if (arch) res.send(arch);
                                    else     res.send('ERROR!');
                                    break;
                      case 'list' :
                                    var list = do_LIST(fn);
                                    if (list) res.send(JSON.stringify(list));
                                    else      res.send('ERROR!');
                                    break;

                        default:
                            res.send('unknown command');
                    }
                    
                });    
                
                morgan && app.use(morgan('dev'));                                   // log every request to the console
                app.use(function(req, res){ res.sendStatus(404);});                 // simply NOT FOUND
                // ====================================================== Main 
                server = app.listen(_.LISTEN_PORT,  () => {
                  _.log('Express server listening on '+_.URL_BASE+':'+_.LISTEN_PORT+'/');
                }); 

                
                io     = socketIO.listen(server);
                
                if (!show){
                 var child=childProc.spawn("cmd",['/C','START',_.URL_BASE+':'+_.LISTEN_PORT, cmd] );
                    child.on('error',function (err) { _err(err);    me.exit(-123);  });
                    child.on('exit', function (code){ _log(); });
                }
             }
             catch (ex) {
                 _err(ex);
                 me.exit(-123);
             }       
            }
    ;            
            
    let     ND
    ,       me              =   process
    ,       isOS            =   me.arch
    ,       args            =   me.argv
    ,       cmdLn           =   args[0]
    ,       myName          =   args[1]
    ,       myArch          =   'x64'
    ,       nodeRequired    =   []
    ,       iojsRequired    =   []
    ,       symLinkCcommand 
    ,       findNodeCommand 
    ,       archPrfx
    ,       app             // express app
    ,       server          // express server
    ,       io
    ;
    args.splice(0,2);

    me.on('exit', function (c) { process.exit(c); })

    var cmd
    ,   files
    ,   main
    ;
    
    switch (isOS) {
        case    'x86':
        case    'x64':
                        findNodeCommand = 'findFile.cmd'
                        symLinkCommand  = 'sudo.cmd'
                        symLinkArgs     = ['mklink','/D']
                        nodeRequired    = ['node.exe','node.lib'];
                        iojsRequired    = ['iojs.exe','iojs.lib'];
                        archPrfx        = 'win-';
                        break;
        default:                                
                        //ERROR!!!
    }
     
    try {
     var    child=childProc.spawn(findNodeCommand ,['node','>','whereIsNode'],{  stdio: 'inherit' } );

            child.on('error',function (err) { _err(err);    me.exit(-123);  });
            child.on('exit', function (code){               
            main();
           });
           
    } 
    catch (ex) {
         exit("can't find Node installation dir",ex);   
    }
    
    main = function () {
    
        try {
            cmd = args[0] && args[0].toLowerCase();
                 if ('arch'     .startsWith(cmd))  do_ARCH      (cmd,args[1]);          // show or set default Arch
            else if ('list'     .startsWith(cmd)
                    || 'ls'     .startsWith(cmd))  do_LIST      (cmd,args[1]);          // show installed or availables
            else if ('use'      .startsWith(cmd))  do_USE       (cmd,args[1],args[2]);  // link current version to selected
            else if ('install'  .startsWith(cmd))  do_INSTALL   (cmd,args[1],args[2]);  // install a new version that can be used later locally
            else if ('remove'   .startsWith(cmd) 
                    && cmd.length==6            )  do_REMOVE    (cmd,args[1],args[2]);  // remove should be typed completeley to be shure you don't mistyped it
            else if ('version'  .startsWith(cmd))  do_VERSION   (cmd);                           
            else if ('gui'      .startsWith(cmd))  do_GUI       (cmd,args[1]);          // run with web GUI         
            else if (ND.x) {}                                                           // force error
        }
        catch (ex) { 
            if (!ex.message.startsWith("Cannot read property 'x'")) _err(ex);
            if (cmd) {
                _log('unknown command: '+cmd);
                _log();
            }
            usage();
            me.exitCode = -1;
        }

    };