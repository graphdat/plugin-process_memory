//var _param = require('./param.json');

var sigar = require('sigar');

var cpus = sigar().cpuList()
for(var i = 0; i < cpus.length; i++){
	console.log(cpus[i]);
}
return;

var _pollInterval = 1000;

function poll()
{

	setTimeout(poll, _pollInterval);
}

poll();