var _param = require('./param.json');
var _os = require('os');
var _fs = require('fs');
var _sysconf = require('sysconf');
var _tools = require('graphdat-plugin-tools');

var _pollInterval = _param.pollInterval || 1000;
var _pagesize = _sysconf.get(_sysconf._SC_PAGESIZE);

function pollProcess(prc)
{
	var pidinfo;

	if (!prc.pid || prc.pid <= 0)
	{
		pidinfo = _tools.findProcId(prc);
		prc.pid = pidinfo.pid;

	}

	if (prc.pid <= 0)
	{
		// Couldn't locate, spit out an error once and keep trying
		if (!prc.notified)
		{
			prc.notified = true;
			console.error('Unable to locate process for ' + prc.source + ', ' + pidinfo.reason);
		}
	}
	else
		prc.notified = false;

	if (prc.pid > 0)
	{
		try
		{
			var memuse = _fs.readFileSync('/proc/' + prc.pid + '/stat', 'utf8').split(' ')[23] * _pagesize;

			console.log('MEM_PROCESS %d %s', memuse, prc.source);

		}
		catch(ex)
		{
			if (ex.message.indexOf('ENOENT') != -1)
				prc.pid = 0;
			else
				console.error('Unexpected error for ' + prc.source + ': ' + ex.message);

			console.log('MEM_PROCESS 0 %s', prc.source);
		}
	}
	else
		console.log('MEM_PROCESS 0 %s', prc.source);

}

function poll()
{
	if (_param.items)
		_param.items.forEach(pollProcess);
	else
	{
		console.error('No configuration, exiting');
		process.exit(1);
	}


	setTimeout(poll, _pollInterval);
}

poll();

