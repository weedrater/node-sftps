var spawn = require('child_process').spawn,
	_ = require('underscore');

var escapeshell = function(cmd) {
  return cmd.replace(/(["\s'$`\\])/g,'\\$1');
};

/*
** Params :
** {
**   host: 'domain.com', // required
**   username: 'Test', // required
**   password: 'Test', // optional
**   port: '28', // optional
**   key: '/path/to/private/key', // optional
**   sshOptions: { ... } // map from SSH options to option values
** }
**
** Usage :
** ftp.cd('to_maleamassage').rm('./test.txt').exec(console.log);
*/

var FTP = function (options) {
	this.initialize(options);
	this.cmds = [];
};

FTP.prototype.initialize = function (options) {
	var defaults = {
		host: '',
		username: '',
		password: '',
		key: ''
	};
	var opts = _.pick(_.extend(defaults, options), 'host', 'username', 'password', 'port', 'key', 'sshOptions');
	if (!opts.host) throw new Error('You need to set a host.');
	if (!opts.username) throw new Error('You need to set an username.');
	if (options.protocol && options.protocol !== 'sftp') throw new Error('Only sftp protocol is supported.');
	if (!opts.sshOptions) opts.sshOptions = {};
	if (opts.key) opts.sshOptions.IdentityFile = opts.key;
	this.options = opts;
};

FTP.prototype.exec = function (cmds, callback) {
	if (typeof cmds === 'string')
		cmds = cmds.split(';');
	if (Array.isArray(cmds))
		this.cmds = this.cmds.concat(cmds);
	if (typeof cmds === 'function' && !callback)
		callback = cmds;
	if (!callback)
		throw new Error('callback is missing to exec() function.')

	var shellCmd = 'sftp';
	var shellOpts = [];
	if (this.options.password) {
		shellCmd = 'sshpass';
		shellOpts.push('-p', this.options.password, 'sftp');
	}
	for (var sshOptKey in this.options.sshOptions) {
		shellOpts.push('-o' + sshOptKey + '=' + this.options.sshOptions[sshOptKey]);
	}
	if (this.options.port) shellOpts.push('-P', '' + this.options.port);
	shellOpts.push('' + this.options.username + '@' + this.options.host);

	cmds = this.cmds;
	this.cmds = [];
	cmds.push('exit');
	var cmdString = cmds.join('\n') + '\n';

	var sftp = spawn(shellCmd, shellOpts);

	var data = "";
	var error = "";
	sftp.stdout.on('data', function (res) {
		data += res;
	});
	sftp.stderr.on('data', function (res) {
		error += res;
	});
	function finished(err) {
		error = error.split('\n').filter(function(line) {
			if (/^Connected to /.test(line)) return false;
			return true;
		}).join('\n');
		data = data.split('\n').filter(function(line) {
			if (/^sftp> /.test(line)) return false;
			return true;
		}).join('\n');
		if (callback) {
			if (err) {
				callback(err, { error: error || null, data: data });
			} else if (error) {
				callback(null, { error: error, data: data });
			} else {
				callback(null, { error: null, data: data });
			}
			callback = null;
		}
	}
	sftp.on('error', finished);
	sftp.on('exit', function (code) {
		if (code === 0) {
			finished();
		} else {
			finished('Nonzero exit code: ' + code);
		}
	});
	sftp.stdin.write(cmdString, 'utf8');
	return this;
};

FTP.prototype.raw = function (cmd) {
	if (cmd && typeof cmd === 'string')
		this.cmds.push(cmd);
	return this;
};

FTP.prototype.ls = function () { return this.raw('ls'); };
FTP.prototype.pwd = function () { return this.raw('pwd'); };
FTP.prototype.cd = function (directory) { return this.raw('cd ' + escapeshell(directory)); };
FTP.prototype.put = function (localPath, remotePath) {
	if (!localPath)
		return this;
	if (!remotePath)
		return this.raw('put '+escapeshell(localPath));
	return this.raw('put '+escapeshell(localPath)+' '+escapeshell(remotePath));
};
FTP.prototype.addFile = FTP.prototype.put;
FTP.prototype.get = function (remotePath, localPath) {
	if (!remotePath)
		return this;
	if (!localPath)
		return this.raw('get '+escapeshell(remotePath));
	return this.raw('get '+escapeshell(remotePath)+' '+escapeshell(localPath));
};
FTP.prototype.getFile = FTP.prototype.get;
FTP.prototype.mv = function (from, to) {
	if (!from || !to)
		return this;
	return this.raw('rename ' + escapeshell(from) + ' ' + escapeshell(to));
};
FTP.prototype.move = FTP.prototype.mv;
FTP.prototype.rm = function () { return this.raw('rm ' + Array.prototype.slice.call(arguments).map(escapeshell).join(' ')); };
FTP.prototype.remove = FTP.prototype.rm;

module.exports = FTP;
