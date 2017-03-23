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
    const   ND              =   undefined
    ,       info            =   {}                                                                      //  to keep in sync, we now fill this from package.json
    ,       _APP            =   {}                                                                      //  storing global references here ..
    ,       Fs              =   require ('fs')
    ,       Url             =   require ('url')
    ,       Path            =   require ('path')
    ,       w4it            =   require ('w4it')
    ,       Http            =   require ('https')
    ,       HttpD           =   require ('http-d')
    ,       LeftPad         =   require ('left_pad')
    ,       ChildProc       =   require ('child_process')
    ,       Exec            =   ChildProc.execFileSync 
    ,       NIM             =   'nim'
    ,       _CON            =   console
    ,       pathSep         =   Path.sep
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
    ,       _log            =   (...a)              =>  { _cout(_CON.log    ,...a); }
    ,       _wrn            =   (...a)              =>  { _cout(_CON.warn   ,...a); }
    ,       _err            =   (...a)              =>  { _cout(_CON.error  ,...a); }
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
                Exec("cmd",["/C","xcopy","/E","/J","/I",toLocalOs(srcDir),toLocalOs(trgDir)],{  stdio: 'inherit' } );
    }
    ,       copyFileSync    =   (srcFile,trgFile)   =>  {
                Exec("cmd",["/C","copy",toLocalOs(srcFile),toLocalOs(trgFile)],{  stdio: 'inherit' } );
    }
    ,       removeDirSync   =   (dirName)           =>  {
                Exec("cmd",["/C","RMDIR","/S","/Q",toLocalOs(dirName)],{  stdio: 'inherit' } );
    }
    ,       normalizeVer    =   (ver)               =>  { return (ver ? ver[0]=='v' ? ver : ver[0]=='V'? 'v'+ver.substring(1) : 'v'+ver : 'v_');  }
    ,       normalizeArch   =   (arch)              =>  { return archPrfx+ (arch || myArch); }
    ,       usage           =   ()                  =>  {
        _.log('Usage:');
        _.log('');
        _.log('   '+NIM+' arch                             : Show whichever arch node is using.'                               );
        _.log('   '+NIM+' install    <version>   [arch]    : Version can be any Node version either from NodeJs of IOJS'       );
        _.log('                                               see: http://cloned2k16.github.io/jsNVM/'                         );
        _.log('   '+NIM+' list       [available | all]     : List the current installation list or the availables to download' );
        _.log('   '+NIM+' remove     <version>   [arch]    : Uninstall specified version'                                      );
        _.log('   '+NIM+' use        <version>   [arch]    : Switch to the specified version and optionally arch'              );
        _.log('   '+NIM+' root       [path]                : Set or Show where all the versions are stored into'               );
        _.log('   '+NIM+' version                          : Shows the version of this tool'                                   );
        _.log('');
        _.log('   '+NIM+' on|off                           : Switches NIM version as primary (global) version'                 );
        _.log('   '+NIM+' gui                              : Start an useful graphical interface (web)                       ' );
        
    }
    ,       downloadFiles   =   (url,dir,list
                                ,npmUrl,npmVer)     =>  {
             try { 
              var rHead = Http.head(url,(res) => {
                    if ([200,301,302,304,307,308].indexOf(res.statusCode) >= 0) {
                        var i
                        ,   inProg     =   []  
                        ,   inProgIdx  =   0
                        ;
                     //_.log(url,res.headers);   
                     res.on('data', (chunk) => { _.log('@',chunk.toString()); });
                     
                     try { 
                        var pos =dir.lastIndexOf('/')
                        ,   vDir=dir.substring(0,pos)
                        ;
                        try { Fs.mkdirSync(vDir); }catch (_e) {}
                        Fs.mkdirSync(dir); 
                     }
                     catch (e){ if (e.code!='EEXIST'){ _.err(e);  return -1; } }

                     for (i in list) {
                        var fName= list[i]
                        ,   fPath   = dir+'/'+fName
                        ;
                       _.log('downloading.. ',url+'/'+fName,' into: ',fPath);
                       if (Fs.existsSync(fPath)){
                         inProg[inProgIdx]=false;  
                         continue;  
                       } 
                       inProg[inProgIdx]=true;  
                           
                       var  
                            file    = Fs.createWriteStream(fPath)
                       ,    endErr  = ((ii,p) => { return (err) => { _.log('endErr',err,ii); Fs.unlink(p); inProg[ii]=false; }})(i,fPath)
                       ,    req     = Http.get(url+'/'+fName, ((f,p,ii) => { return (res) =>{
                            if (res.statusCode !== 200) {
                                Fs.unlink(p); 
                                return _.err(url+' status was ' + res.statusCode);
                            }
                            res.pipe(f);
                            f.on('finish', ((ii,ff) => { return () => { 
                             let fn=list[ii];
                             _.log(fn,' done.'); 
                             ff.close();                          
                             if (fn.startsWith('iojs')) {
                                 //_.log('link to: ',dir+'/'+fn.replace('iojs','node'));
                                 Fs.linkSync(dir+'/'+fn, dir+'/'+fn.replace('iojs','node'))
                             }
                             inProg[ii]=false;  }})(ii,f) );
                       }})(file,fPath,inProgIdx++));
                        req.on ('error', (err) => { endErr(err); });
                        file.on('error', (err) => { endErr(err); });
                     }
                     
                    var fName   = npmVer+'.zip'
                    ,   fPath   = dir+'/'+fName
                    ;
                     if (!Fs.existsSync(fPath)){
                        inProg[inProgIdx]=true;
                        _.log('downloading.. ',npmUrl+'v'+npmVer,' into: ',fPath);
                        var  file    = Fs.createWriteStream(fPath)
                        ,    endErr  = ((ii,p) => { return (err) => { _.log('endErr',err,ii); Fs.unlink(p); inProg[ii]=false; }})(i,fPath)
                        ,    req     = Http.get(npmUrl+'v'+npmVer, ((f,p,ii) => { return (res) =>{
                            if (res.statusCode !== 200) {
                                Fs.unlink(p); 
                                return _.err('NPM status was ' + res.statusCode);
                            }
                            res.pipe(f);
                            f.on('finish', ((ii,ff) => { return () => { 
                                let fn=fName;
                                _.log(fn,' done.'); 
                                ff.close();                          
                                inProg[ii]=false;  
                            }})(ii,f) );
                        }})(file,fPath,inProgIdx++));
                        req.on ('error', (err) => { endErr(err); });
                        file.on('error', (err) => { endErr(err); });
                    }
                     //_.log('we have',inProgIdx,'downloads',inProg);
                     
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

                        _.log('DONE');
                        _.log('unzipping NPM in ',npmTempPath)
                        try {
                            Exec("cmd"    ,[ "/C","RMDIR","/S","/Q", toLocalOs(npmPath)     ]  ,{  stdio: 'inherit' } )
                            Exec("cmd"    ,[ "/C","RMDIR","/S","/Q", toLocalOs(npmTempPath) ]  ,{  stdio: 'inherit' } )
                        }
                        catch(ee){ 
                            //_.err("error:",ee.message); 
                        }
                        Exec("xtract",[  fPath,   npmDir   ]       ,{  stdio: 'inherit' } )
                         
                        Fs.renameSync   (npmTempPath,npmPath);
                        copyFileSync    (npmPath+'/bin/npm'       ,dir+'/npm');
                        copyFileSync    (npmPath+'/bin/npm.cmd'   ,dir+'/npm.cmd');

                         return 0;
                     });
                    }
                    else {
                     return res.statusCode;
                    }
                }).on('error', (err) => { _.err("Error downloading from:",url); });
             } 
             catch (ex) { _.err(ex,-123); }
             return -1;
    }
    ,       do_ARCH         =   (cmd,newA)          =>  {
                try {               
                    // probably we better write it to a file instead
                    let nf  = Fs.readlinkSync   (nodeFolder)
                    ,   p1  = nf.lastIndexOf    (pathSep)
                    ,   p2  = nf.lastIndexOf    ('-')
                    ,   arc = nf.substring      ((p2>0?p2:p1)+1)
                    ,   newA
                    ;
                    newA = newA && newA.toLowerCase();  
                    if (ND !== newA) {
                        _.log('set default ARCH:',newA)
                        try { 
                         if (0 > validArchs.indexOf(newA)) throw Exception();
                        }
                        catch (e) {
                          _.log('sorry!, ',newA,' is a not valid Arch');
                          return null;
                        }   
                    }
                    else {
                        _.log(arc);
                        return arc;
                    }    
                }
                catch (ex) { // if there's no version 'in use' ..
                 _.log("it looks like we don't have any version in use (yet) .."); 
                 return null;
                }
            }
    ,       do_LIST         =   (cmd,avlbl)         =>  { 
                avlbl           = avlbl ? avlbl.toLowerCase() : ND;
                var lstAll      = 'all'
                ,   av          = 'available'.startsWith(avlbl) || avlbl==lstAll
                ,   nodeVerURL  = nodeDistBase+'index.json'
                ,   iojsVerURL  = iojsDistBase+'index.json'
                ;
                
                if (av) { 
                    
                    _.ND                =   ND;    
                    _.nodeList          = _.ND;
                    _.nodeError         = _.ND;
                    _.nodeReqInProgress = true;

                    _.iojsList          = _.ND;
                    _.iojsError         = _.ND;
                    _.iojsReqInProgress = true;
                    
                    
                    Http.get(nodeVerURL, ( response )   =>  {
                        try{
                            if (response.statusCode == 200) {
                                var body='';
                                response.on('data' , function (data) {
                                    body += data.toString() ;
                                }) ;
                                response.on('end' ,  function() {
                                
                                    Fs.writeFile(nodeCacheFile, body, function(err) { 
                                        if(err) {  _.log(err); } 
                                        else {
                                            var guiCacheFile='.'+_.PUBLIC_HTML+'/'+nodeCacheFile
                                            Fs.writeFileSync(guiCacheFile, Fs.readFileSync(nodeCacheFile));
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
        
                                    Fs.writeFile(nodeCacheList, vList, function(err) { 
                                        if(err) { _.log(err); }
                                        else _.nodeReqInProgress = false;
                                    }); 
                                }) ;
                            }
                            else { //   TODO FixME!!
                                _.err (response.statusCode,err,_.log.error); 
                                _.nodeError = { 'RES' : response , 'ERR' : err };
                            }   
                        }
                        catch ( e ){
                            _.log("EXCEPTION: ",e);
                        }
                        
                    }).on('error', (err) => { _.err(err); } );
                    
                    Http.get(iojsVerURL, ( response )   =>  {
                        try{
                            if (response.statusCode == 200) {
                                var body='';
                                response.on('data' , function (data) {
                                    body += data.toString() ;
                                }) ;
                                response.on('end' ,  function() {
                                    Fs.writeFile(iojsCacheFile, body, function(err) {
                                        if(err) { _.log(err); }
                                        else {
                                            var guiCacheFile='.'+_.PUBLIC_HTML+'/'+iojsCacheFile
                                            Fs.writeFileSync(guiCacheFile, Fs.readFileSync(iojsCacheFile));
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
            
                                    Fs.writeFile(iojsCacheList, vList, function(err) { 
                                        if(err) {  _.log(err); } 
                                        else _.iojsReqInProgress = false;
                                    });
                                }) ;
                            }
                            else { //   TODO FixME!!
                                _.log (response.statusCode,err ,_.log.error); 
                                _.iojsError = { 'RES' : response , 'ERR' : err };
                            }   
                        }
                        catch (e) {
                            _.log("Exception: ",e);
                        }                        
                        
                    }).on('error', (err) => { _.err(err); } );

                    
                    var rawStdout               = new Fs.SyncWriteStream(1, { autoClose: false })
                    ,   numeric                 = function  ( vs )      {
                        vs = vs.substring(1);
                        vs = vs.split('.');
                        var len = vs.length;
                        if (len!=3) return 0;
                        var num= LeftPad(vs[0],3,0) + LeftPad(vs[1],3,0) + LeftPad(vs[2],4,0) ;
                        return num;
            
                    }
                    ,   compareVersion          = function  ( nV ,iV)   { return  numeric(nV) > numeric(iV); }
                    ;
                    
                    
                    w4it.enableAnimation();
                    w4it.done(  () => { return !(_.nodeReqInProgress || _.iojsReqInProgress); },
                                () => {
                            
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
                
                
                            if (_.nodeError) { _.log(_.nodeError); }//showError('NODE:',nodeError); }
                            else total += nodeLen;
                
                            if (_.iojsError) { _.log(_.iojsError); }//showError('IOJS:',iojsError); }
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
                            
                            Fs.writeFile('full_list.json', JSON.stringify(merged), function(err) { if(err) { return _.log(err);  } });
                            var rel
                            ,   curr
                            ,   last
                            ;
                            j=0;
                           
                            if (avlbl==lstAll){
                                mileStones=merged;
                            }
                            else{
                                for (i = 0; i < merged.length ; i++) {
                                    rel     = merged[i];
                                    curr    = numeric(rel.version).substring(0,3);
                                    if (last!=curr) {
                                        last=curr;
                                        mileStones[j++]=rel;
                                    }  
                                }
                            }
                            
                            _.log('\n\n\t_-== Version ==-_-== LTS ==-_-== ORIGIN ==-_\n');
                            for (i=0 ; i < mileStones.length ;i++) {
                                rel =   mileStones[i];
                                _.log('\t    ',rel.version ,'\t    ',rel.lts ? rel.lts : '\t','\t',rel.origin);
                            } 
                        }
                        catch ( e){
                            _.log("Exception: ",e);
                        }
                    });
                    
                    return;
                }
                else if (avlbl) _.log('unknown option: ',avlbl);
                
                _.log('installed versions:');
                _.log();
                
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
                        ver     = Fs.readlinkSync   (nodeFolder);
                        p1      = ver.lastIndexOf   (pathSep);
                        arch    = ver.substring  (   p1+1);                          //get arch
                        ver     = ver.substring  (0, p1  );                          //strip arch
                        ver     = ver.substring  (   ver.lastIndexOf    (pathSep)+1); //strip base path
                        p1      = arch.lastIndexOf('-')
                        arch    = p1<0? arch : arch.substring(   p1+1);             //arch
                        _.log('in use:',LeftPad('',12),ver ,LeftPad(arch,16-ver.length),'\n');
                    } 
                    catch (ee){ 
                     //_.log("sorry: can't find any version in use!"); return -1; 
                     
                    }
                
               
                try {
                    files = Fs.readdirSync(nodeStoreDir);
                    if (files[0].name) {/* force err if not present */}
                    for (i in files){
                        name = files[i];
                        fPath = nodeStoreDir + name;
                        if (Fs.statSync(fPath).isDirectory()){
                            var archs=Fs.readdirSync(fPath);
                            for (a in archs) {
                                var  archN   =   archs[a]
                                ,    nPath   =   fPath + '/' + archN + '/node'+ nodeExtens
                                ;
                                try {
                                    Fs.statSync(nPath)
                                    p1     =   archN.lastIndexOf('-')
                                    archN  = (p1<0?archN:archN.substring(p1+1));
                                    _.log(LeftPad('',20),name,LeftPad('',10-name.length), LeftPad('('+archN+')',6));
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
                    _.err(exc);
                    _.log('sorry looks like you have none installed');
                    return null;
                }
            }        
    ,       do_ACTIVATE     =   (cmd)               =>  {
                
                var data = Fs.readFileSync('whereIsNode', "utf8")
                ,   nodeProgPath
                ,   nodeProgDir
                ,   nodeFile
                ,   nodeBasePath
                ;    
                data        = data.replace('\r','');
                data        = data.split('\n')[0];
                data        = data.split(pathSep);
                nodeFile    = data.pop();
                nodeProgDir = data.pop();
                nodeBasePath= data.join(pathSep);
                // OFF ------------------------------------------------------------------------------
                if (cmd!=='on'){
                    _.log('switching NIM off ..');    
                    if ( nodeBasePath == me.cwd()){
                        _.log('ok node does point here, so here we go ..');
                    }
                    else {
                        _.err('sorry , node found somewere else .. ->',nodeBasePath+pathSep+nodeProgDir);
                        return;
                    }
                    
                    
                    return;                                                                             // get out we are done here!
                }
                
                // ON  ------------------------------------------------------------------------------
                if (!Fs.existsSync(nodeFolder)){
                    _.err("You need to have a node version in use before activation ...\n try to call 'nim use <version>' before");
                    return;
                }
                
                try{
                    
                    var ver=Exec("cmd",["/C",toLocalOs(nodeFolder+'node'),"--version"] ).toString()
                    ,   vtk=ver.trim().split(/\./)        
                    ;
                    if (vtk[0].startsWith('v') && vtk.length==3){
                        _.log('working version:',ver);
                    }
                    else {
                        _.err('sorry! ,the folder:',nodeFolder,"doesn't look like it contain a working version!");
                        return;
                    }
                    
                }
                catch (e){ _.err(e); return; }
                
                
                if (nodeBasePath == me.cwd()){
                    _.err('sorry! ,looks like we are already switched on!');
                    return;
                }
                nodeProgPath= data.join(pathSep);
                
                activateArgs.push(cmd);
                activateArgs.push(qtd(nodeProgPath));
                activateArgs.push(qtd(nodeProgDir));
                activateArgs.push(nodeFolder.subStr(0,nodeFolder.length-1));
                activateArgs.push("> activate.log");

                Fs.writeFile('original.node.folder', nodeProgPath+pathSep+nodeProgDir , "utf8", ()=>{
                    _.log('backup info done');
                });
                
                // it should be safe here to switch to our 'inuse' version ..
                
                return; //  we need some more test, and a rollback plan !
                
                child=ChildProc.spawn(activateCommand ,activateArgs,{ stdio: 'inherit' } );
                child.on('error',function (err) { _.err(err);    me.exit(-123);  });
                child.on('exit', function (code){                me.exit(code)   });

                        
            }
    ,       do_USE          =   (cmd,_ver,_arch)    =>  {
                let ver     = normalizeVer  (_ver)
                ,   arch    = normalizeArch (_arch)
                ,   vPath   = nodeStoreDir + ver 
                ,   found   = false
                ,   archs   = validArchPaths.win[arch.endsWith('64')?1:0]
                ,   aa,i
                ;
                
                for (aa in archs){
                    var pp=vPath + '/' + archs[aa];
                    if (Fs.existsSync(pp)){
                        vPath = pp;
                        found=true;
                        break;
                    }
                }
                
                if (! found) {
                    _.err("version not found!");
                    return;
                }
                
                try {
                    files = Fs.readdirSync(vPath);
                    for (i in nodeRequired) if (0> files.indexOf(nodeRequired[i])) {
                        _.err("required file missing ["+nodeRequired[i]+"] ",files);
                        me.exitCode=-3; 
                    }
                    try {

                        try { Fs.rmdirSync   (nodeFolder); } catch(e) { }

                        symLinkArgs.push(toLocalOs(nodeFolder));
                        symLinkArgs.push(toLocalOs(vPath));
                        var out=Exec(symLinkCommand ,symLinkArgs);
                        _.log(out.toString());                                                          // TODO check result here !!
                    }
                    catch (ex){ _.err(ex); }
                }
                catch (ex){
                    _.err("version ["+args[1]+"]("+arch+") not found in our store ..\n  use install command to add it to the store");
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
        
                _.log('installing version: ',_ver);
                if ( vList != ND ){
                    //_.log(vList);
                    for (v in vList){
                        vInf=vList[v];
                        if (vInf.version==('v'+_ver)){
                            _.log("FOUND! (released on:",vInf.date,")");
                            NPMv=vInf.npm;
                            _.log("we need NPM ver:",NPMv);
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
                                    _.err("unexpected source:",vInf.origin) ;   
                                    me.exit(66);
                            }
                            break;
                        }
                    }
                    if (!found){
                       _.log("SORRY NOT FOUND");
                       return;
                    }
                }
                else{
                    _.err("we can't find any version info, please run [nim list available] first!");
                    return;
                } 
                  
                try {  
                    Http.head(urlBase+vPath,function (response) {
                        //_.log(urlBase+vPath, response.statusCode);
                        let vDir;
                        if (response.statusCode == 200) {
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
                            _.err("can't find actual version for",vDir,archs);
                        }
                    }).on('error',(err) => { _.err(err); } );
                }
                catch(ex){ _.err(ex.message); me.exit(66); }
        
            }
    ,       do_REMOVE       =   (cmd,_ver,_arch)    =>  {
                var i
                ,   e
                ,   fileNa
                ,   ver     = normalizeVer (_ver)
                ,   arch    = normalizeArch(_arch)
                ,   baseDir = nodeStoreDir + ver
                ,   vPath   = baseDir + '/' + arch
                ;
        
                
                _.log('removing: ',vPath);
                try {
                    try{ files = Fs.readdirSync(vPath); }catch(e){}
                    
                    for (i in files){
                        fileNa=vPath+'/'+files[i];
                        if (Fs.lstatSync(fileNa).isDirectory()){
                            removeDirSync(fileNa);
                        }
                        else Fs.unlinkSync(fileNa);
                    }         
                    
                    try { Fs.rmdirSync  (vPath);        }catch(e){}
                    try { Fs.rmdirSync  (baseDir);      }catch(e){}
                }
                catch (e){ _.err(e)
                    _.err('not found: ['+ver+'] ('+arch+')');  
                }    
            }
    ,       do_VERSION      =   (cmd)               =>  {
                _.log('Current Version:',info.version);
            }      
    ,       do_ROOT         =   (cmd,where)         =>  {
                _.out('Current Root:',__dirname);
            }
    ,       do_GUI          =   (cmd,show)          =>  {
             try{   
                _.log(HttpD.Name,HttpD.Version);
                
                HttpD.setStaticFolders  ([__dirname + _.PUBLIC_HTML,__dirname + _.BOWER_DIR]);
                HttpD.map               ('/cmmnd'                   ,function (req,res,query) {
                    
                    var fn  = query;
                    
                    switch (fn) {
                      case 'arch' :
                                    var arch = do_ARCH(fn);
                                    if (arch) return arch;
                                    else      return 'ERROR!';
                                    break;
                      case 'list' :
                                    var list = do_LIST(fn);
                                    if (list) return JSON.stringify(list);
                                    else      return 'ERROR!';
                                    break;

                        default:
                            res.send('unknown command');
                    }
                });  
                
                HttpD.listen(_.LISTEN_PORT );
                
                //TODO!    
                //  _.log('Express server listening on '+_.URL_BASE+':'+_.LISTEN_PORT+'/');

                
                if (!show){
                 var child=ChildProc.spawn("cmd",['/C','START',_.URL_BASE+':'+_.LISTEN_PORT, cmd] );
                    child.on('error',function (err) { _.err(err);    me.exit(-123);  });
                    child.on('exit', function (code){ _.log(); });
                }
             }
             catch (ex) {
                 _.err(ex);
                 me.exit(-123);
             }       
            }
    ;            
//  ----------------------------------- --------------------------- ---------------------------------
            Http.head       =   (url, cb)           =>  {                                               //  keep it simple :D
                var options=Url.parse(url);
                options.method='HEAD';
                var req=Http.request(options,cb);
                    req.end();
                return req;    
            }
//  ----------------------------------- --------------------------- ---------------------------------
//  ----------------------------------- --------------------------- ---------------------------------

    //  ===================================================== 
    //  ===================================================== GUI Configuration
            _APP.PUBLIC_HTML    =   '/GUI'; 
            _APP.BOWER_DIR      =   '/js-libs';
            _APP.LISTEN_PORT    =   process.env.PORT || 1111;
            _APP.URL_BASE       =   'http://localhost';
            _APP.out            =   _log
            _APP.log            =   _log
            _APP.wrn            =   _wrn
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
    Fs.readFile('./full_list.json', function read(err, data) {
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
        process.exit(c); 
    })
//  ----------------------------------- --------------------------- ---------------------------------
    Fs.readFile('package.json', "utf8", (err, data) => {
        if (err) _.log(err);
        else {
            var oo=JSON.parse(data);
            info.version =   oo.version;
            info.desc    =   oo.description;
            info.author  =   oo.author;
        }
    });
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
     
//  ----------------------------------- --------------------------- ---------------------------------
    try {
     var    child=ChildProc.spawn(findNodeCommand ,['node','>','whereIsNode'],{  stdio: 'inherit' } );

            child.on('error',function (err) { _.err(err);    me.exit(-123);  });
            child.on('exit', function (code){ main();                        });
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
        catch (ex) { //_.err(ex);
            if (!ex.message.startsWith("Cannot read property 'x'")) _.err(ex);
            if (cmd) {
                _.log('unknown command: '+cmd);
                _.log();
            }
            usage();
            me.exitCode = -1;
        }

    };
//  ----------------------------------- --------------------------- ---------------------------------
