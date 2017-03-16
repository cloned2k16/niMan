    var ND 
    ,   _               =   _ || {}
    ,   leftPad         =   _padLeft.func
    ,   _W              =   window        
    ,   _D              =   document
    ,   _O              =   Object
    ,   _C              =   console
    ,   _B              =   _D.body
    ,   _FN             =   Function.apply
    ,   _ById           =   function  (id)                      { return _D.getElementById (id);        }
    ,   _ByQs           =   function  (id)                      { return _D.querySelector  (id);        }
    ,   _newHtmlEl      =   function  (el)                      { return _D.createElementNS  ('http://www.w3.org/1999/xhtml', el);   }
    ,   _newSvgEl       =   function  (el)                      { return _D.createElementNS  ('http://www.w3.org/2000/svg'  , el);   }
    ,   _newEL          =   function  (elm,id)                  { var el=_D.createElement    (elm); if (id) el.id=id; return el;     }
    ,   _newTXT         =   function  (txt)                     { var el=_D.createTextNode   (txt); return el;                       }
    ,   _setAttr        =   function  (e,a,v)                   { e.setAttribute(a,v); return e;        }
    ,   _Ajax           =   function  (req , cb , err, sts )    {
        var     xhttp;
        
        if (window.XMLHttpRequest) {
            xhttp = new XMLHttpRequest();
            xhttp.timeout = 12000;
        } 
        else {
            // code for IE6, IE5
            xhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }

        
        xhttp.onreadystatechange = function() {
            if (sts) sts(xhttp);
            switch (xhttp.readyState ) {
            
             case 4: {
              switch(xhttp.status) {
                case 200: 
                        cb    (xhttp.responseText); 
                        break;
                 default: 
                        err   ({'sts' : xhttp.status ,'txt' : xhttp.responseText}); 
                        break;
              }
             }
             default:
               //log(xhttp.readyState,xhttp.status);
            }   
        };
       
        xhttp.open("GET", req, true);
        
        try {
         xhttp.send();
        }
        catch (e) { log (e); }    
    }
    ,   getLang         =   function  ()                        {

        if (navigator.languages !== ND) return navigator.languages[0]; 

        else return navigator.language;

    }
    ,   toLocale        =   function  (ds)                      { 

            var da      = ds.split("-")

            ,   date    = new Date(da[0], da[1]-1,da[2])

            ;

            return date.toLocaleDateString(getLang(),{ 'month' : 'short','year':'numeric','day':'numeric'})

    }    
    ,   _newHtmlEl      =   function  (el)                      { return _D.createElementNS  ('http://www.w3.org/1999/xhtml', el);   }
    ,   _log            =   function  ()                        { _FN.call(console.log, console, arguments); }
    ,   _OrEmpty        =   function  (v)                       { return v?v:''; } 
    ,   showError       =   function  (lbl, err)                {
            var tbl=_ById('list');
                  
                  tbl.innerHTML+='<TR><TD colspan=10>'+lbl+'ERROR: ' + err.sts+'&nbsp;'+ (err.txt?err.txt:'') +'</TD></TR>';
    }
    ,   onlyMainVersions=   function    (list)                  {
        var vi = {}
        ,   vl = []
        ,   v
        ,   i
        ,   hiv
        ,   n
        ;
        for (i in list){
            v = list[i];
            n = numeric(v.version);
            hiv = n.substring(0,3);
            vo  = vi[hiv];
            if (vo==ND || (vo.version - v.version)>0)   vi[hiv]=v;  
            
        }
        for (i in vi) vl.push(vi[i]);
        return vl;
    }
    ,   showList        =   function    (list)                  {
         list=onlyMainVersions(list);
         
            var tbl=_ById('list');
                 for (v in list){
                  var ver=list[v];
                  tbl.innerHTML+='<TR><TD><A target=dist href="' + (ver.origin == 'NODE' ? 'https://nodejs.org/dist/' : 'https://iojs.org/dist/') + ver.version + '/">' +ver.version+'</A>'
                                +'</TD><TD>'+_OrEmpty(ver.origin            )
                                +'</TD><TD>'+_OrEmpty(toLocale(ver.date)    )
                                +'</TD><TD>'+_OrEmpty(ver.lts               )
                                +'</TD><TD>'+_OrEmpty(ver.npm               )
                                +'</TD><TD>'+_OrEmpty(ver.v8                )
                                +'</TD><TD>'+_OrEmpty(ver.openssl           )
                                +'</TD><TD>'+_OrEmpty(ver.zlib              )
                                +'</TD><TD>'+_OrEmpty(ver.uv                )
                                +'</TD></TR>';
                 }
    }
    ,   getNodeListInProgress   = true
    ,   getIoJsListInProgress   = true
    ,   nodeList
    ,   nodeError
    ,   iojsList
    ,   iojsError
    ,   numeric         =   function    ( vs )                  {
        vs = vs.substring(1);
        vs = vs.split('.');
        var len = vs.length;
        if (len!=3) return 0;
        var num= leftPad(vs[0],3,0) + leftPad(vs[1],3,0) + leftPad(vs[2],4,0) ;
        return num;
        
    }
    ,   compareVersion  =   function    ( nV ,iV)               { return  numeric(nV) > numeric(iV); }
    ,   raimbowCol      =   function    (i, ofMax, r, ph)       {
     var    
            f   = 360 / ofMax
     ,      rd  = Math.PI / 180
     ,      mid = 128
     ,      ph  = (ph ||  40) % 360
     ,      r   = (r  || 127) 
     ,      R   = Math.round(Math.sin((f*i-  0+ph)*rd) * r + mid)
     ,      G   = Math.round(Math.sin((f*i-120+ph)*rd) * r + mid)
     ,      B   = Math.round(Math.sin((f*i-240+ph)*rd) * r + mid)
     ,      c   
     ;
      R= R>160?255:R>96?127:0;
      G= G>160?255:G>96?127:0;
      B= B>160?255:B>96?127:0;
      c = (R*0x10000+G*0x100+B)
      return c;
    }
    ,   addYearMark     =   function    (dv, date,start,step)   {
        var mrk = _newHtmlEl('div')
            mrk.setAttribute('class','yearMark');
            
        var x= (date.getTime()-start) * step;
            mrk.innerHTML=date.getFullYear();
            mrk.setAttribute('style','left: '+(x>>0)+'px; top:0px; height:100%;');
            dv.appendChild(mrk);
    }
    ,   showGraph       =   function    (values,col)            {
        var my      = this
        ,   dv      = _ById('svgDiv')
        ,   bound   = dv.getBoundingClientRect()
        ,   W       = bound.width
        ,   H       = bound.height
        ,   len     = values.length
        ,   min     = new Date(values[len-1].date).getTime()
        ,   max     = new Date(values[0]    .date).getTime()
        ,   step    = (W-64)/(max-min)
        ,   i       = 0
        ,   x       = 0
        ,   y       = 0
        ;
        
        addYearMark(dv,new Date('1-1-2012'),min,step);
        addYearMark(dv,new Date('1-1-2013'),min,step);
        addYearMark(dv,new Date('1-1-2014'),min,step);
        addYearMark(dv,new Date('1-1-2015'),min,step);
        addYearMark(dv,new Date('1-1-2016'),min,step);
        addYearMark(dv,new Date('1-1-2017'),min,step);
        
        var alt     = _newHtmlEl('div')
        ,   altTxt  = null
        ;
            alt.setAttribute('class','altLabl');
            document.body.appendChild(alt);
        
        for (i=0; i<len; i++) {
         var val =   values[len-i-1];
         y = H-numeric(val.version)   / 100000000*H *1.01
         x = (new Date(val.date).getTime()-min) * step
         
         
         var    col     = raimbowCol(i,len/2).toString(16)
                col     = '0'.repeat(6-col.length)+col;
         var    el     = _newHtmlEl('div')        
                el.setAttribute('class','verLab');
                el.setAttribute('style','left: '+((x>>0))+'px; top:'+((y>>0)-32)+'px; color:#'+col+';');
                if (val.origin=='NODE')
                      el.innerHTML='<a target=DOCs href="https://nodejs.org/docs/'+val.version+'/api/">'+val.version+'</a>';
                else  el.innerHTML='<a target=DOCs href="https://iojs.org/docs/'  +val.version+'/api/">'+val.version+'</a>';
                
                el.addEventListener('mouseenter', function (e){
                   if (!altTxt) { 
                    alt.innerHTML= altTxt = this.innerHTML; 
                    alt.style.visibility = 'visible';
                   }
                   this.xx=e.clientX;
                   this.yy=e.clientY;
                });
                
                el.addEventListener('mousemove', function (e){
                   alt.style.top  = ''+ (e.clientY -48)  +'px';
                   alt.style.left = ''+ (e.clientX -48)   +'px';
                   
                });
                
                el.addEventListener('mouseout', function (e){
                   alt.style.visibility = 'hidden';
                   altTxt = null;
                   alt.innerHTML = '';
                });
                
                dv.appendChild(el);
        } 
        
        
    }
    ,   onAcquiredLists =   function    ()                      {
        
            if (getNodeListInProgress || getIoJsListInProgress) {
                if (nodeError) {}
                if (iojsError) {}
                return; // not having both ready!
            }    
            
                var total   =   0
                ,   nodeLen =   nodeList? nodeList.length : 0
                ,   iojsLen =   iojsList? iojsList.length : 0
                ,   i
                ,   j       =   0
                ,   k       =   0
                ,   merged  =   []
                ,   empty   =   'v'
                ,   smmry   =   _ById('smmry');
                ;
                
                
                if (nodeError) { log(nodeError); showError('NODE:',nodeError); }
                else total += nodeLen;
                
                if (iojsError) { log(iojsError); showError('IOJS:',iojsError); }
                else total += iojsLen;
                
                for (i=0; i < total; i++) {
                  var nodeVer = (nodeList && nodeList[j]) ?  nodeList[j].version : empty;
                  var iojsVer = (iojsList && iojsList[k]) ?  iojsList[k].version : empty;
                 
                  if (compareVersion(nodeVer,iojsVer))  { merged[i]=nodeList[j++]; merged[i].origin='NODE'; }
                  else                                  { merged[i]=iojsList[k++]; merged[i].origin='IO.JS'; }
                }
                _log (j,k, merged.length);
                
                smmry.innerHTML = "Found <b>"+merged.length+"</b> releases ..<br>  ("+j+") from NODE and ("+k+") from IO.JS"
                                ;
                
                
                showList(merged);
                
                showGraph(merged);
    }
    ,   doUse           =   function    (el)                    {
            alert('doUse: '+el );
    }
    ;
    
    _onDocReady ( function () { _log('DOM is Ready ..');

    
            _Ajax ('/cmmnd?list' 
            , function (res) { 
                var list        =   JSON.parse(res)
                ,   inUse       =   _ById('inUse')
                ;
                _log('installed list',list);
                
                for (i in list){
                  var oo=list[i];
                  for (v in oo) if (v!='xyw') break;                  
                  inUse.innerHTML   +=  '<TR '+(oo.xyw?'class=inUseV':'') +'>'
                                    +    '<TD><div onclick=doUse(this) class="     btn paper paper-lift">'+v             +'</div></TD>'
                                    +    '<TD><div                     class="arch btn paper paper-lift">'+oo[v]    +'</div></TD>'
                                    +  '</TR>';
                }
                    
            }
            , function (err) { _log('ERR:',err); }
            );
            
    
            _Ajax ('node_dist.json'  //'http://nodejs.org/dist/index.json' 
            , function (res) { 
                var list        =   JSON.parse(res);
                    nodeList    =   list;
                    getNodeListInProgress=false;
                    _log('got Node list');
                    onAcquiredLists();
            }
            , function (err) { nodeError=err; _log('ERR:',err); onAcquiredLists(); }
            );
            
            _Ajax ('iojs_dist.json'  //'https://iojs.org/dist/index.json'
            , function (res) { 
                var list        =   JSON.parse(res);
                    iojsList    =   list;
                    getIoJsListInProgress=false;
                    _log('got IoJs list');
                    onAcquiredLists();
            }
            , function (err) { iojsError=err; _log('ERR:',err); onAcquiredLists(); }
            );
            
    });  
            
