var fs 			= 	fs || require('fs')
,	deepest		=	0
,	log			=	console.log
,	walkSync 	= 	function(dir, filelist) {
	var	files 		= 	fs.readdirSync(dir)
	;
	filelist = filelist || [];
	files.forEach(function(file) {
        var path=  dir + file;		
		if (fs.statSync(path).isDirectory()) {
			filelist = walkSync(path + '/', filelist);
		}
		else {
			filelist.push(file);
			
			var fullPath=path+file
			,	len= (fullPath).length;
			if (len>deepest){
				deepest=len;
				log(len,fullPath);
			}
		}
	});
  return filelist;
};


var allFiles= walkSync(process.cwd()+'/');

log("max:",deepest);
