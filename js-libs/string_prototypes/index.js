'use strict';


var _String_Prototypes  =   {
                                Name:       'String Prototypes (aka es6-strings)' 
                            ,   Desc:       'Provides ES5 and ES6 compliant prototype functions, along with helpful others ..'
                            ,   Version:    '0.0.3'
                        }
                        // 'str.'.repeat        (3)         ->      'str.str.str.'
                        // 'str.'.startsWith    ('st')      ->      true
                        // 'str.'.endsWith      ('r.')      ->      true
                        // 'str.'.includes      ('tr')      ->      true
                        
                        // 'file.com'.subStr    (-4)        ->      '.com'
                        // 'file.com'.subStr    (-3,-1)     ->      '.'
                        // 'file.com'.subStr    (-4, 1)     ->      '.'
                        // 'file.com'.subStr    ( 4,-4)     ->      'file'

_String_Prototypes.apply = function (scope) {
    var ND // undefined
    ,   th  = scope.String.prototype
    ,   sbs = 'substring'
    ,   ln  = 'length'
    ;
    
    if (!   th.subStr       )   { // handy extension to substring funcionality  subStr(-3) subStr(-3,2)
            th.subStr  =    function subStr (st,len) {
                var s = st  == ND ? 0         : st  < 0 ? this[ln]+st : st;
                var e = len == ND ? this[ln]  : len < 0 ? s+len       : st < 0 ? s+len : len;
                return this[sbs](s,e);
            }    
    }
    
    if (!   th.repeat       )   { // ES6 ! 
            th.repeat   =   function repeat (n) {
            var res =   ''
            ,   me  =   this
            ;
            
            do {
                res += (n & 1) ? me : '';
                me  += me;
                n>>>=1;    
            }
            while (n);
            return res;
        }
    }         
        // we silently convert s to string ... flexibility gives always a better user experience
    
    if (!   th.startsWith   )   {   // ES6 !
            th.startsWith   =   function    startsWith  (s) { 
                var re = new RegExp('^'+s);
                return re.test(this);
            }     
    }
    
    if (!   th.endsWith     )   {   // ES6 !
            th.endsWith     =   function    endsWith    (s) {
                var re = new RegExp(''+s+'$');
                return re.test(this);
            }     
    }

    if (!   th.includes     )   {   // ES6 !
            th.includes     =   function    include     (s) {
                var re = new RegExp(''+s);
                return re.test(this);
            }     
    }

    if (!   th.codePointAt  )   {   // ES6 !
            th.codePointAt  =   function    codePointAt (p) {
                var me  = this
                ,   len = me.len
                ,   p   = p ? Number(p) : -1
                ;
                if (    p != p //NaN
                    ||  p  < 0
                    ||  p >  len
                    )               return undefined;
                var fst = me.charCodeAt(p)
                ,   sec 
                ;    
                if ( fst >= 0xD800 && fst <= 0xDFFF && len > (p+1)) {
                    sec = me.charCodeAt(p+1);
                    return      ((fst - 0xD800) <<  11)
                            +   ((sec - 0xDC00) +   0x10000)
                }
                return fst;
            }     
    }

    if (!   th.trim         )   {   // ES5 !
            (function() {
                var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
                String.prototype.trim = function() {
                    return this.replace(rtrim, '');
                };
            })();
    }; 
    
 return this;    
};

if (typeof module !== 'undefined' && module.exports)  module.exports  = _String_Prototypes;

