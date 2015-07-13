'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var express = require([express]);
var app = express();
var http = require([http]).Server(app);
var io = require([socket.io])(http);
var users = {};
var defaultname;

var SingleUserDetail = (function () {
	function SingleUserDetail(sokt) {
		_classCallCheck(this, SingleUserDetail);

		this.sokt = sokt;
	}

	_createClass(SingleUserDetail, [{
		key: 'getSocket',
		value: function getSocket() {
			return this.sokt;
		}
	}]);

	return SingleUserDetail;
})();

app.use('/bower_components', express['static'](__dirname + '/bower_components'));
app.get('/', function (req, res) {
	res.sendfile('index.html');
});

http.listen(3000);
io.on('connection', function (socket) {
	socket.on('new user', function (data, callback) {
		if (data in users) {
			callback(false);
		} else {
			var i = 0;
			if (data === '') {
				while (true) {
					defaultname = 'Guest';
					defaultname += i;
					if (!(defaultname in users)) {
						socket.nickname = defaultname;
						defaultname = 'Guest';
						users[socket.nickname] = new SingleUserDetail(socket);
						callback(socket.nickname);
						socket.broadcast.emit('usercome', { user: socket.nickname });
						updateNicknames();
						break;
					}
					i++;
				}
			} else {
				socket.nickname = data;
				callback(socket.nickname);
				socket.broadcast.emit('usercome', { user: socket.nickname });
				users[socket.nickname] = new SingleUserDetail(socket);
				updateNicknames();
			}
		}
	});

	function updateNicknames() {
		io.sockets.emit('usernames', Object.keys(users));
	}

	socket.on('checktyping', function (data) {
		if (data.type === true) {
			users[data.value].getSocket().emit('changetypeStatus', { type: true, value: socket.nickname });
		} else {
			console.log('received false');
			users[data.value].getSocket().emit('changetypeStatus', { type: false, value: ' ' });
		}
	});

	socket.on('send message', function (data, callback) {
		var msg = data.trim();
		console.log('after trimming message is: ' + msg);
		var ind = msg.indexOf(' ');
		if (ind !== -1) {
			var name = msg.substring(0, ind);
			var msg = msg.substring(ind + 1);
			if (name in users) {
				users[name].getSocket().emit('whisper', { msg: msg, touser: name, nick: socket.nickname });
				users[socket.nickname].getSocket().emit('whisper', { msg: msg, touser: name, nick: socket.nickname });
				console.log('message sent is: ' + msg);
				console.log('Whisper!');
			} else {
				callback('Error!  Enter a valid user.');
			}
		} else {
			io.sockets.emit('new message', { msg: msg, nick: socket.nickname });
		}
	});

	socket.on('disconnect', function () {
		if (!socket.nickname) return;
		delete users[socket.nickname];
		socket.broadcast.emit('userleave', { user: socket.nickname });
		updateNicknames();
	});
});

