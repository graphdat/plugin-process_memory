var _param = require('./param.json');
var _os = require('os');
var _fs = require('fs');
var _sysconf = require('sysconf');

function silent(fnc)
{
	try
	{
		return fnc();
	}
	catch(ex)
	{
		return null;
	}
}

// Returns process id or 0 if not found, -1 if ambiguous, sets reason
var reason;
function findProcId()
{
	// Get all proc id's
	var procs = _fs.readdirSync('/proc').filter(function(e) { return !isNaN(parseInt(e)); });
	var pidResult = 0;

	var hit;

	procs.every(function(pid)
	{
		var stat = _fs.readFileSync('/proc/' + pid + '/stat', 'utf8').split(' ');
		var cwd = silent(function() { return _fs.readlinkSync('/proc/' + pid + '/cwd'); });
		var path = silent(function() { return _fs.readlinkSync('/proc/' + pid + '/exe'); });

		var re;

		var prc = {
			name : stat[1].substr(1, stat[1].length - 2),
			path : path || '',
			cwd : cwd || ''
		};

		if (_param.processName)
		{
			re = new RegExp(_param.processName);
			if (!re.test(prc.name))
				return true;
		}
		if (_param.processPath)
		{
			re = new RegExp(_param.processPath);
			if (!re.test(prc.path))
				return true;
		}
		if (_param.processCwd)
		{
			re = new RegExp(_param.processCwd);
			if (!re.test(prc.cwd))
				return true;
		}

		// Got a hit, make sure not ambiguous
		if (pidResult)
		{
			reason = 'process ambiguity: ' + JSON.stringify(prc) + ' is too similar to ' + JSON.stringify(hit);
			pidResult = -1;
			return false;
		}
		else
		{
			hit = prc;
			pidResult = pid;
			return true;
		}
	});

	if (!pidResult)
		reason = 'the process was not found';

	return pidResult;
}


var _pollInterval = _param.pollInterval || 1000;
var _source = _param.source || _os.hostname();
var _pagesize = _sysconf.get(_sysconf._SC_PAGESIZE);

var _pid;
var _notified;

function poll()
{
	if (!_pid)
	{
		_pid = findProcId();

		if (_pid <= 0)
		{
			// Couldn't locate, spit out an error once and keep trying
			if (!_notified)
			{
				_notified = true;
				console.error('Unable to locate process, ' + reason);
			}
		}
		else
			_notified = false;
	}

	if (_pid)
	{
		try
		{
			var memuse = _fs.readFileSync('/proc/' + _pid + '/stat', 'utf8').split(' ')[23] * _pagesize;

			console.log('%s %d', _source, memuse);

		}
		catch(ex)
		{
			if (ex.message.indexOf('No such process') != -1)
				_pid = 0;
			else
				console.error('Unexpected error: ' + ex.message);

			console.log('%s 0', _source);
		}
	}
	else
		console.log('%s 0', _source);


	setTimeout(poll, _pollInterval);
}

poll();

