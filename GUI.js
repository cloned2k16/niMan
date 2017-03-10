 const
            info            =   {
                                version :   '0.0.1'
                            ,   desc    :   'Node Installation Manager GUI'
                            }
        ,   express         =   require ('express')
        ,   morgan          =   require ('morgan')
        ,   socketIO        =   require ('socket.io')
        ,   _log            =   (...args)       =>  { Function.apply.call(console.log   ,console,args); }
        ,   _err            =   (...args)       =>  { Function.apply.call(console.error ,console,args); }
        ;                    
    //  ===================================================== GUI Configuration
    const   _APP                =   {};
            _APP.PUBLIC_HTML    = '/GUI'; 
            _APP.BOWER_DIR      = '/js-libs';
            _APP.LISTEN_PORT    = process.env.PORT || 1111;
            _APP.URL_BASE       = 'http://localhost';
            _APP.log            = _log
            _APP.err            = _err
            _APP.timeSt         = (name)  => { return timers[name]= (new Date()).getTime();};
            _APP.timeEn         = (name)  => { return (new Date()).valueOf() - timers[name];};
            _                   = _APP;
   
    //  ===================================================== 
    let     ND
    ,       me              =   process
    ,       show            =   true
    ;
    me.on('exit', function (c) { process.exit(c); })


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
                            