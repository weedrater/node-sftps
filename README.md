node-sftps
=========

SFTP client for node.js, mainly a `sftp` wrapper.

This is a fork of the `ftps` module.  This fork only supports sftp, and uses the `sftp` command instead of `lftp`.  This allows you to specify ssh-specific options such as private key file.

Requirements
------------

You need to have the executable `sftp` installed on your computer.
If you are using password authentication, you also need to have the `sshpass` utility installed.

Installation
-----------

``` sh
npm install sftps
```

Usage
-----

``` js
var SFTPS = require('sftps');
var sftp = new SFTPS({
  host: 'domain.com', // required
  username: 'Test', // required
  password: 'Test', // required
  port: 22 // optional
});
// Do some amazing things
sftp.cd('myDir').addFile(__dirname + '/test.txt').exec(console.log);
```

Some documentation
------------------

Here are chainable fonctions :

``` js
ftps.ls()
ftps.pwd()
ftps.cd(directory)
ftps.cat(pathToRemoteFiles)
ftps.put(pathToLocalFile, [pathToRemoteFile]) // alias: addFile
ftps.get(pathToRemoteFile, [pathToLocalFile]) // download remote file and save to local path (if not given, use same name as remote file), alias: getFile
ftps.mv(from, to) // alias move
ftps.rm(file1, file2, ...) // alias remove
```

Execute a command on the remote server:
<pre>sftp.raw('ls -l')</pre>

For information, ls, pwd, ... rm are just some alias of raw() method.

Run the commands !
``` js
sftp.exec(function (err, res) {
  // err will be null (to respect async convention)
  // res is an hash with { error: stderr || null, data: stdout }
});
```

Also, take note that if a command fails it will not stop the next commands from executing, for example:
``` js
sftp.cd('non-existing-dir/').affFile('./test.txt').exec(console.log);
/*
Will add file on ~/ and give:
{
  error: 'cd: non-existing-dir: No such file or directory\n',
  data: ''
}
So...be cautious because ./test.txt has been added
*/

```

Why?
----

Just because I didn't found sftp and ftps module in node.js, it's pretty dirty to spawn `sftp` command, but sorry, it does the work for me, maybe for you too :)
Ah and sorry for tests, it's a hack, so I just do some manual tests.
