    "use strict";
    
    // this file is supposed to run under at least version 6.x.x of Node
    // so instead to try to keep backward compatibility we decided to use a two stage bootloader strategy
    // which nomatter which current version of node you have installed will start with a very small
    // stage one that is where we'll keep backward compatibility, then run the app usin an own version
    // of Node specified in the first sage and eventually download it if not installed already
    //
//  ----------------------------------- --------------------------- ---------------------------------
    let     none
    ,       nodeRequired        =   []
    ,       iojsRequired        =   []
    ,       app                     // express app
    ,       server                  // express server
    ,       cmd
    ,       files
    ,       main
    ,       symLinkCommand 
    ,       findNodeCommand 
    ,       activateCommand
    ,       archPrfx
    ,       activateArgs
    ,       symLinkArgs
    ;
//  ----------------------------------- --------------------------- ---------------------------------
    ;
//  ----------------------------------- --------------------------- ---------------------------------
    const   ND              =   undefined
    ,       info            =   {
                                version :   '0.0.10'
                            ,   desc    :   'Node Installation Manager aka NVM++'
                            }
    ,       _APP            =   {}
    ,       path            =   require ('path')
    ,       os              =   require ('os')
    ,       fs              =   require ('fs')
    ,       leftPad         =   require ('left_pad')
    ,       w4it            =   require ('w4it')
    ,       http            =   require ('https')
    ,       request         =   require ('request')
    ,       childProc       =   require ('child_process')
    ,       exec            =   childProc.execFileSync 
    ,       express         =   require ('express')
    ,       morgan          =   require ('morgan')
    ,       socketIO        =   require ('socket.io')
    ,       NIM             =   'nim'
    ,       _CON            =   console
    ,       pathSep         =   path.sep
    ,       strFormat       =   function ()             {
                var s   = arguments[0]
                ,   i   = 1
                ;
                return s.replace(/%((%)|s|d|i)/g, function (m) {
                    var val = arguments[i];
                    switch (m) {
                        case '%i':
                            val = parseInt    (val);
                            break;
                        case '%d':
                            val = parseFloat  (val);
                            break;
                    }
                    i++;
                    return val;
                });
            }
    ,       qtd             =   (s)                 =>  { return "'"+s+"'"; }
    ,       _cout           =   (t,...a)            =>  { Function.apply.call(t ,_CON,a); }
    ,       _log            =   (...a)              =>  { _cout(_CON.error  ,...a); }
    ,       _wrn            =   (...a)              =>  { _cout(_CON.warn   ,...a); }
    ,       _err            =   (...a)              =>  { _cout(_CON.log    ,...a); }
    ,       toLocal         =   (s)                 =>  { return s.replace(new RegExp('/', 'g'),'\\'); }
    
    ,       validArchs      =   {   'win'   :   ['x86','x64']
                                ,   'arm'   :   ['arm64','arm6l','arm7l']
                                ,   'darwin':   ['x64']
                            }
    ,       validArchPaths  =   {   'win'   :   [   ['','x86','win-x86']
                                                ,   ['x64','win-x64']       ]
                                ,   'arm'   :   [   [''],[''],['']          ]                           
                                ,   'darwin':   [   ['']                    ]                           
                            }
                            
    ,       nodeFolder      =   './inuse/'          // default location
    ,       nodeExtens      =   '.exe'
    ,       nodeStoreDir    =   './dist/'
    ,       nodeCacheFile   =   'node_dist.json'
    ,       nodeCacheList   =   'node_dist.lst'
    ,       iojsCacheFile   =   'iojs_dist.json'
    ,       iojsCacheList   =   'iojs_dist.lst'
    ,       nodeDistBase    =   'https://nodejs.org/dist/'
    ,       iojsDistBase    =   'https://iojs.org/dist/'
    ,       npmDistBase     =   'https://codeload.github.com/npm/npm/zip/'
    ,       toLocalOs       =   (s)                 =>  {
                switch (isOS){
                    case    'x86':
                    case    'x64':
                        return s.replace(/\//gi,'\\');
                    default:
                        return s;
                }
            }
    ,       copyDirSync     =   (srcDir,trgDir)     =>  {
                exec("cmd",["/C","xcopy","/E","/J","/I",toLocalOs(srcDir),toLocalOs(trgDir)],{  stdio: 'inherit' } );
    }
    ,       copyFileSync    =   (srcFile,trgFile)   =>  {
                exec("cmd",["/C","copy",toLocalOs(srcFile),toLocalOs(trgFile)],{  stdio: 'inherit' } );
    }
    ,       normalizeVer    =   (ver)               =>  { return (ver ? ver[0]=='v' ? ver : ver[0]=='V'? 'v'+ver.substring(1) : 'v'+ver : 'v_');  }
    ,       normalizeArch   =   (arch)              =>  { return archPrfx+ (arch || myArch); }
    ,       usage           =   ()                  =>  {
        _log('Usage:');
        _log('');
        _log('   '+NIM+' arch                             : Show whichever arch node is using.'                               );
        _log('   '+NIM+' install    <version>   [arch]    : Version can be any Node version either from NodeJs of IOJS'       );
        _log('                                               see: http://cloned2k16.github.io/jsNVM/'                         );
        _log('   '+NIM+' list       [available]           : List the current installation list or the availables to download' );
        _log('   '+NIM+' remove     <version>   [arch]    : Uninstall specified version'                                      );
        _log('   '+NIM+' use        <version>   [arch]    : Switch to the specified version and optionally arch'              );
        _log('   '+NIM+' root       [path]                : Set or Show where all the versions are stored into'               );
        _log('   '+NIM+' version                          : Shows the version of this tool'                                   );
        _log('');
        _log('   '+NIM+' gui                              : Start an useful graphical interface (web)                       ' );
        
    }
    ,       downloadFiles   =   (url,dir,list
                                ,npmUrl,npmVer)     =>  {
             try { 
                request.head(url,(err, res, body) => {
                    if (!err && res.statusCode == 200) {
                        var i
                        ,   inProg     =   []  
                        ,   inProgIdx  =   0
                        ;
                     
                     try { 
                        var pos =dir.lastIndexOf('/')
                        ,   vDir=dir.substring(0,pos)
                        ;
                        try { fs.mkdirSync(vDir); }catch (_e) {}
                        fs.mkdirSync(dir); 
                     }
                     catch (e){ if (e.code!='EEXIST'){ _err(e);  return -1; } }

                     for (i in list) {
                        var fName= list[i]
                        ,   fPath   = dir+'/'+fName
                        ;
                       _log('downloading.. ',url+'/'+fName,' into: ',fPath);
                       if (fs.existsSync(fPath)){
                         inProg[inProgIdx]=false;  
                         continue;  
                       } 
                       inProg[inProgIdx]=true;  
                           
                       var  
                            file    = fs.createWriteStream(fPath)
                       ,    endErr  = ((ii,p) => { return (err) => { _log('endErr',err,ii); fs.unlink(p); inProg[ii]=false; }})(i,fPath)
                       ,    req     = http.get(url+'/'+fName, ((f,p,ii) => { return (res) =>{
                            if (res.statusCode !== 200) {
                                fs.unlink(p); 
                                return _err(url+' status was ' + res.statusCode);
                            }
                            res.pipe(f);
                            f.on('finish', ((ii,ff) => { return () => { 
                             let fn=list[ii];
                             _log(fn,' done.'); 
                             ff.close();                          
                             if (fn.startsWith('iojs')) {
                                 //_log('link to: ',dir+'/'+fn.replace('iojs','node'));
                                 fs.linkSync(dir+'/'+fn, dir+'/'+fn.replace('iojs','node'))
                             }
                             inProg[ii]=false;  }})(ii,f) );
                       }})(file,fPath,inProgIdx++));
                        req.on ('error', (err) => { endErr(err); });
                        file.on('error', (err) => { endErr(err); });
                     }
                     
                    var fName   = npmVer+'.zip'
                    ,   fPath   = dir+'/'+fName
                    ;
                     if (!fs.existsSync(fPath)){
                        inProg[inProgIdx]=true;
                        _log('downloading.. ',npmUrl+'v'+npmVer,' into: ',fPath);
                        var  file    = fs.createWriteStream(fPath)
                        ,    endErr  = ((ii,p) => { return (err) => { _log('endErr',err,ii); fs.unlink(p); inProg[ii]=false; }})(i,fPath)
                        ,    req     = http.get(npmUrl+'v'+npmVer, ((f,p,ii) => { return (res) =>{
                            if (res.statusCode !== 200) {
                                fs.unlink(p); 
                                return _err('NPM status was ' + res.statusCode);
                            }
                            res.pipe(f);
                            f.on('finish', ((ii,ff) => { return () => { 
                                let fn=fName;
                                _log(fn,' done.'); 
                                ff.close();                          
                                inProg[ii]=false;  
                            }})(ii,f) );
                        }})(file,fPath,inProgIdx++));
                        req.on ('error', (err) => { endErr(err); });
                        file.on('error', (err) => { endErr(err); });
                    }
                     //_log('we have',inProgIdx,'downloads',inProg);
                     
                     w4it.enableAnimation();
                     w4it.done ( () => { 
                      for (i=0; i<inProgIdx; i++) { if (inProg[i]) return false; }
                      return true;
                     }   
                     , () =>{
                        var npmDir=dir+'/node_modules' 
                        ,   npmTempPath =   npmDir+'/npm-'+npmVer
                        ,   npmPath     =   npmDir+'/npm'
                        ;

                        _log('DONE');
                        _log('unzipping NPM in ',npmTempPath)
                        try {
                            exec("cmd"    ,[ "/C","RMDIR","/S","/Q", toLocalOs(npmPath)     ]  ,{  stdio: 'inherit' } )
                            exec("cmd"    ,[ "/C","RMDIR","/S","/Q", toLocalOs(npmTempPath) ]  ,{  stdio: 'inherit' } )
                        }
                        catch(ee){ 
                            //_err("error:",ee.message); 
                        }
                        exec("xtract",[  fPath,   npmDir   ]       ,{  stdio: 'inherit' } )
                         
                        fs.renameSync   (npmTempPath,npmPath);
                        copyFileSync    (npmPath+'/bin/npm'       ,dir+'/npm');
                        copyFileSync    (npmPath+'/bin/npm.cmd'   ,dir+'/npm.cmd');

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
    ,       do_ARCH         =   (cmd,newA)          =>  {
                try {               
                    // probably we better write it to a file instead
                    let nf  = fs.readlinkSync   (nodeFolder)
                    ,   p1  = nf.lastIndexOf    (pathSep)
                    ,   p2  = nf.lastIndexOf    ('-')
                    ,   arc = nf.substring      ((p2>0?p2:p1)+1)
                    ,   newA
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
    ,       do_LIST         =   (cmd,avlbl)         =>  { 
                var av          = avlbl && avlbl.length>1 && 'available'.startsWith(avlbl.toLowerCase())
                ,   nodeVerURL  = nodeDistBase+'index.json'
                ,   iojsVerURL  = iojsDistBase+'index.json'
                ;
                
                if (av) { _.log('listing avaiables');
                    
                    _.ND                =   ND;    
                    _.nodeList          = _.ND;
                    _.nodeError         = _.ND;
                    _.nodeReqInProgress = true;

                    _.iojsList          = _.ND;
                    _.iojsError         = _.ND;
                    _.iojsReqInProgress = true;
                    
                    
                    request.get(nodeVerURL, function (err, response, body) {
                        try{
                            if (!err && response.statusCode == 200) {
                                fs.writeFile(nodeCacheFile, body, function(err) { 
                                    if(err) {  _.log(err); } 
                                    else {
                                        var guiCacheFile='.'+_.PUBLIC_HTML+'/'+nodeCacheFile
                                        fs.writeFileSync(guiCacheFile, fs.readFileSync(nodeCacheFile));
                                    }
                                }); 
                            
                                var res     =   JSON.parse(body);
                                _.nodeList  =   res;
        
                                var vList   =   ""
                                ,   stable  =   []
                                ,   lts     =   []
                                ;
                                for (var v in res) { 
                                    var ver=res[v]; 
                                    if (!ver.lts) stable.push(ver);
                                    else          lts   .push(ver);
                                    vList+= strFormat('  %s\t\t[%s]\t\t%s\t\t%s\r\n',ver.version ,ver.lts?ver.lts:'',ver.date,ver.npm); 
                                }
        
                                fs.writeFile(nodeCacheList, vList, function(err) {
                                    if(err) { _.log(err); }
                                }); 
        
                            }
                            else { 
                                _.err (response.statusCode,err,_.log.error); 
                                _.nodeError = { 'RES' : response , 'ERR' : err };
                            }   
                        }
                        catch ( e ){
                            _.log("EXCEPTION: ",e);
                        }
                        _.nodeReqInProgress = false;
                    });
                    
                    request.get(iojsVerURL, function (err, response, body) {
                        try{
                            if (!err && response.statusCode == 200) {
                                fs.writeFile(iojsCacheFile, body, function(err) {
                                    if(err) { _.log(err); }
                                    else {
                                        var guiCacheFile='.'+_.PUBLIC_HTML+'/'+iojsCacheFile
                                        fs.writeFileSync(guiCacheFile, fs.readFileSync(iojsCacheFile));
                                    }
                                }); 
        
                                var res     =   JSON.parse(body)
                                ,   vList   =   ""
                                ;
                                _.iojsList  =   res;
        
                       
                                for (var v in res) { 
                                    var ver=res[v]; 
                                    vList+= strFormat('  %s\t\t%s\t\t%s\r\n',ver.version, ver.date, ver.npm); 
                                }
            
                                fs.writeFile(iojsCacheList, vList, function(err) { 
                                    if(err) {  _.log(err); } 
                                });
            
                            }
                            else { 
                                _.log (response.statusCode,err ,_.log.error); 
                                _.iojsError = { 'RES' : response , 'ERR' : err };
                            }   
                        }
                        catch (e) {
                            _.log("Exception: ",e);
                        }                        
                        _.iojsReqInProgress = false;
                    });

                    
                    var rawStdout               = new fs.SyncWriteStream(1, { autoClose: false })
                    ,   numeric                 = function  ( vs )      {
                        vs = vs.substring(1);
                        vs = vs.split('.');
                        var len = vs.length;
                        if (len!=3) return 0;
                        var num= leftPad(vs[0],3,0) + leftPad(vs[1],3,0) + leftPad(vs[2],4,0) ;
                        return num;
            
                    }
                    ,   compareVersion          = function  ( nV ,iV)   { return  numeric(nV) > numeric(iV); }
                    ;
                    
                    
                    w4it.enableAnimation();
                    w4it.done(  () => { return !(_.nodeReqInProgress || _.iojsReqInProgress); },
                                () => {
                            _.log('BOTH FINISHED!\n' );
                        try{        
                            var total       =   0
                            ,   nodeLen     =   _.nodeList? _.nodeList.length : 0
                            ,   iojsLen     =   _.iojsList? _.iojsList.length : 0
                            ,   i
                            ,   j           =   0
                            ,   k           =   0
                            ,   merged      =   []
                            ,   empty       =   'v'
                            ,   mileStones  =   []
                            ;
                
                
                            if (_.nodeError) { _log(_.nodeError); }//showError('NODE:',nodeError); }
                            else total += nodeLen;
                
                            if (_.iojsError) { _log(_.iojsError); }//showError('IOJS:',iojsError); }
                            else total += iojsLen;
                
                            //_.log (total,nodeLen,iojsLen);
                
                            for (i=0; i < total; i++) {
                                var nodeVer = (_.nodeList && _.nodeList[j]) ?  _.nodeList[j].version : empty
                                ,   iojsVer = (_.iojsList && _.iojsList[k]) ?  _.iojsList[k].version : empty
                                ;
                                if (compareVersion(nodeVer,iojsVer))  { merged[i]=_.nodeList[j++]; merged[i].origin='NODE'; }
                                else                                  { merged[i]=_.iojsList[k++]; merged[i].origin='IO.JS'; }
                            }
                
                            var len=merged.length;
               
                            if (total != len) _.log('merged size missmatch! expected:',total,' actual:',len);
                
                            _.log('num of releases found:\nNode: ',nodeLen,' IoJs: ',iojsLen);
                            
                            _APP.full_list=merged;
                            
                            fs.writeFile('full_list.json', JSON.stringify(merged), function(err) { if(err) { return _log(err);  } });
                            var rel
                            ,   curr
                            ,   last
                            ;
                            j=0;
                
                            for (i = 0; i < merged.length ; i++) {
                                rel     = merged[i];
                                curr    = numeric(rel.version).substring(0,3);
                                if (last!=curr) {
                                    last=curr;
                                    mileStones[j++]=rel;
                                }  
                            }
                
                            _log('\n\n\t_-== Version ==-_-== LTS ==-_-== ORIGIN ==-_\n');
                            for (i=0 ; i < mileStones.length ;i++) {
                                rel =   mileStones[i];
                                _log('\t    ',rel.version ,'\t    ',rel.lts ? rel.lts : '\t','\t',rel.origin);
                            } 
                        }
                        catch ( e){
                            _.log("Exception: ",e);
                        }
                    });
                    
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
                ,   fPath
                ,   a
                ,   vs
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
                                    vs = {};
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
                    _err(exc);
                    _log('sorry looks like you have none installed');
                    return null;
                }
            }        
    ,       do_ACTIVATE     =   (cmd)               =>  {
                _log("nodeFolder: '"+nodeFolder+"' nodeStoreDir: '"+nodeStoreDir+"'");
                var data = fs.readFileSync('whereIsNode', "utf8")
                ,   nodeProgDir
                ,   nodeFile
                ;    
                data        = data.split('\n')[0];
                data        = data.split('\\');
                nodeFile    = data.pop();
                nodeProgDir = data.pop();
                nodeProgPath= data.join('\\');
                            
                _log("whereisNode: "+nodeProgPath+" : "+nodeProgDir);

                activateArgs.push(cmd);
                activateArgs.push(qtd(nodeProgPath));
                activateArgs.push(qtd(nodeProgDir));
                activateArgs.push(nodeFolder.subStr(0,nodeFolder.length-1));
                activateArgs.push("> activate.log");

                child=childProc.spawn(activateCommand ,activateArgs,{ stdio: 'inherit' } );
                child.on('error',function (err) { _err(err);    me.exit(-123);  });
                child.on('exit', function (code){               me.exit(code)   });

                        
            }
    ,       do_USE          =   (cmd,_ver,_arch)    =>  {
                let ver     = normalizeVer  (_ver)
                ,   arch    = normalizeArch (_arch)
                ,   vPath   = nodeStoreDir + ver 
                ,   found   = false
                ,   archs   = validArchPaths.win[arch.endsWith('64')?1:0]
                ,   aa
                ;
                
                for (aa in archs){
                    var pp=vPath + '/' + archs[aa];
                    if (fs.existsSync(pp)){
                        vPath = pp;
                        found=true;
                        break;
                    }
                }
                
                if (! found) {
                    _err("version not found!");
                    return;
                }
                
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

                        //    
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
    ,       do_INSTALL      =   (cmd,_ver,_arch)    =>  {
                var ver     = normalizeVer  (_ver)
                ,   arch    = normalizeArch (_arch)
                ,   vPath   = ver+'/'
                ,   notFnd1 = false
                ,   notFnd2 = false
                ,   vList   = _APP.full_list
                ,   vInf
                ,   found   = false
                ,   NPMv
                ,   urlBase
                ,   requires
                ,   v
                ;
        
                _log('installing version: ',_ver);
                if ( vList != ND ){
                    //_log(vList);
                    for (v in vList){
                        vInf=vList[v];
                        if (vInf.version==('v'+_ver)){
                            _log("FOUND! (released on:",vInf.date,")");
                            NPMv=vInf.npm;
                            _log("we need NPM ver:",NPMv);
                            found=true;
                            
                            switch (vInf.origin){
                                case 'NODE':
                                    urlBase =nodeDistBase;
                                    requires=nodeRequired;
                                    break;
                                case 'IO.JS':    
                                    urlBase=iojsDistBase;
                                    requires=iojsRequired;
                                    break;
                                default:
                                    _err("unexpected source:",vInf.origin) ;   
                                    me.exit(66);
                            }
                            break;
                        }
                    }
                    if (!found){
                       _log("SORRY NOT FOUND");
                       return;
                    }
                }
                else{
                    _err("we can't find any version info, please run [nim list available] first!");
                    return;
                } 
                  
                try {  
                    request.head(urlBase+vPath,function (err, response, body) {
                        _log(urlBase+vPath, err,response.statusCode,"'"+body+"'");
                        let vDir;
                        if (!err && response.statusCode == 200) {
                            let a
                            ,   archs = validArchPaths.win[arch.endsWith('64')?1:0]
                            for (a in archs) {
                         vDir=vPath+archs[a];   
                         downloadFiles(urlBase+vDir,nodeStoreDir+vDir,requires
                                      ,npmDistBase,NPMv  );
                        }
                        }
                        else {
                            notFnd1 = true;
                            _err("can't find actual version for",vDir,archs);
                        }
                    });
                }
                catch(ex){ _err(ex.message); me.exit(66); }
        
            }
    ,       do_REMOVE       =   (cmd,_ver,_arch)    =>  {
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
    ,       do_VERSION      =   (cmd)               =>  {
                _log(info.version);
            }      
    ,       do_ROOT         =   (cmd,where)         =>  {
                _log('not implemented yet!');
            }
    ,       do_GUI          =   (cmd,show)          =>  {
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

                
                let io     = socketIO.listen(server);
                
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
//  ----------------------------------- --------------------------- ---------------------------------
//  ----------------------------------- --------------------------- ---------------------------------

    //  ===================================================== 
    //  ===================================================== GUI Configuration
            _APP.PUBLIC_HTML    =   '/GUI'; 
            _APP.BOWER_DIR      =   '/js-libs';
            _APP.LISTEN_PORT    =   process.env.PORT || 1111;
            _APP.URL_BASE       =   'http://localhost';
            _APP.log            =   _log
            _APP.err            =   _err
            _APP.timeSt         =   (name)  => { return timers[name]= (new Date()).getTime();};
            _APP.timeEn         =   (name)  => { return (new Date()).valueOf() - timers[name];};
            _APP.full_list      =   ND
            
        let _                   =   _APP
        ,   me                  =   process
        ,   isOS                =   me.arch
        ,   args                =   me.argv
        ,   cmdLn               =   args[0]
        ,   myName              =   args[1]
        ,   myArch              =   'x64'
        ;
    //  ===================================================== 
//  ----------------------------------- --------------------------- ---------------------------------
//  ----------------------------------- --------------------------- ---------------------------------
    fs.readFile('./full_list.json', function read(err, data) {
        if (err){
          _.err("unexpected error",err)
          return;  
        } 
        _APP.full_list = JSON.parse(data.toString());
    });
//  ----------------------------------- --------------------------- ---------------------------------
    args.splice(0,2);
//  ----------------------------------- --------------------------- ---------------------------------
    me.on('exit', function (c) { 
        _.log("exit code:",c);
        process.exit(c); 
    })
//  ----------------------------------- --------------------------- ---------------------------------

    switch (isOS) {
        case    'x86':
        case    'x64':
                        findNodeCommand = 'findFile.cmd';
                        symLinkCommand  = 'sudo.cmd';
                        activateCommand = 'sudo.cmd';
                        activateArgs    = ['activate'];
                        symLinkArgs     = ['mklink'     ,'/D'];
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
            child.on('exit', function (code){               main();         });
    } 
    catch (ex) {
         exit("can't find Node installation dir",ex);   
    }
    
//  ----------------------------------- --------------------------- ---------------------------------
    main = function () {
        try {
            cmd = args[0] && args[0].toLowerCase();
                 if ('arch'     .startsWith(cmd))   do_ARCH     (cmd,args[1]);                          // show or set default Arch
            else if ('list'     .startsWith(cmd)
                  || 'ls'       .startsWith(cmd))   do_LIST     (cmd,args[1]);                          // show installed or availables
            else if ('use'      .startsWith(cmd))   do_USE      (cmd,args[1],args[2]);                  // link current version to selected
            else if ('install'  .startsWith(cmd))   do_INSTALL  (cmd,args[1],args[2]);                  // install a new version that can be used later locally
            else if ('remove'   .startsWith(cmd) 
                  && cmd.length==6              )   do_REMOVE   (cmd,args[1],args[2]);                  // remove should be typed completeley to be shure you don't mistyped it
            else if ('version'  .startsWith(cmd))   do_VERSION  (cmd);                           
            else if ('gui'      .startsWith(cmd))   do_GUI      (cmd,args[1]);                          // run with web GUI         
            else if ('root'     .startsWith(cmd))   do_ROOT     (cmd,args[1]);
            else if ('on'     == cmd 
                  || 'off'    == cmd)               do_ACTIVATE (cmd);                                  // activate deactivate globally
            else if (ND.x) {}                                                                           // force error
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
//  ----------------------------------- --------------------------- ---------------------------------
