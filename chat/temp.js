'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = {}; //this objects array use username as index, and store each users' object.
var defaultname;

var SingleUserDetail = (function () {
	//this class is for storing a user's socket.	

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

app.use('/bower_components', express['static'](__dirname + '/bower_components')); //here just include the
app.get('/', function (req, res) {
	//webcomponents' path
	res.sendfile('index.html'); //will load the index.html to the browser
});

http.listen(3000); //set the port to 3000.
io.on('connection', function (socket) {
	socket.on('new user', function (data, callback) {
		//this part will check the whether the input username is valid
		if (data in users) {
			// or user want have a default username.
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
		//send all the keys of user array, let the front-side update
		io.sockets.emit('usernames', Object.keys(users)); //update the users's list
	}

	socket.on('checktyping', function (data) {
		//if the frontside selected a user from userlist, it means a
		if (data.type === true) {
			//private message, then if the sender is typing, the receiver
			users[data.value].getSocket().emit('changetypeStatus', { type: true, value: socket.nickname }); //will display
		} else {
			//the "send is typing"
			users[data.value].getSocket().emit('changetypeStatus', { type: false, value: ' ' });
		}
	});

	socket.on('send message', function (data, callback) {
		//check the message， send the private message;
		var msg = data.trim(); //trim the space from message, prevent mistyping.
		var ind = msg.indexOf(' ');
		var name = msg.substring(0, ind);
		var msg = msg.substring(ind + 1);
		if (name in users) {
			users[name].getSocket().emit('whisper', { msg: msg, touser: name, nick: socket.nickname });
			users[socket.nickname].getSocket().emit('whisper', { msg: msg, touser: name, nick: socket.nickname });
		} else {
			callback('Error!  Enter a valid user.');
		}
	});

	socket.on('send message to all', function (data) {
		// send the public message;
		var msg = data.trim();
		io.sockets.emit('new message', { msg: msg, nick: socket.nickname });
	});

	socket.on('disconnect', function () {
		//when user is offline, delete the object is the users{}
		if (!socket.nickname) return; //let the rest users receive a notification
		delete users[socket.nickname];
		socket.broadcast.emit('userleave', { user: socket.nickname });
		updateNicknames();
	});
});

