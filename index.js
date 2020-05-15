/*
*	Quizmaster Home page
*/

var QM = new Object();
var Questions = [];
var Marray = [];

$(document).ready(function() {
	setDefaultValues();
	$('#joinform').submit(function(event) {
		event.preventDefault();
	});
	$('#ansform').submit(function(event) {
		event.preventDefault();
	});
});

function doJoin() {
	let contestant = new Object();
	contestant.token = readCookie("quizmaster");
	if(contestant.token)
		socket.emit('joinGameRequest',contestant);
	else
		$('#joingamex').show();
}

function joinquiz() {
	clearMessages();
	let contestant = new Object();
	contestant.userid = $('#cname').val();
	contestant.accesscode = $('#cacode').val();
	contestant.token = readCookie("quizmaster");
	socket.emit('joinGameRequest',contestant);
}

// Contestant leave the game - which means basically clear cookie and tidy up
function cleave() {
	ctoken = readCookie("quizmaster");
	if(ctoken) {
		socket.emit('conLeaveRequest',ctoken);		// tidy up on server
		deleteCookie("quizmaster");
	}
	setDefaultValues();
}

socket.on('joinGameResponse',function(contestant) {
	$('#joingamex').hide();
	$('#menu').hide();
	$('#play').show();
	$('#username').text(contestant.userid);
	$('#username').show();
	$('#leave').show();
	$('#gameheader').text("You have joined: "+contestant.gamename);
	saveCookie("quizmaster",contestant.token,1800);	// save credentials for 30 mins
});

/* socket.on('timeUpdate',function(message) {
	$('#timer').text(message);
}); */

// This is called when a new contestant joins the game
// con is an array of contestant names
/* socket.on('contestantUpdate',function(con) {
	$('#users').empty();	// remove all old buttons (usernames)
	for(var i in con) {		// start afresh with user list
		var button = document.createElement('button');
		button.innerText = con[i].cname;
		button.className = "btn btn-primary";
		document.getElementById('users').appendChild(button);
	}
}); */

socket.on('currentQuestionUpdate',function(qobject) {
	$('#users').hide();		// only required the first time to hide contentants who joined the game
	$('#canswer').hide();
	$('#scores').hide();
	if(qobject.length == 0) {
		clearMessages();
		$('#qaform').hide();
		$('#question').hide();
		$('#qanswer').val("");
		$('#qimage').hide();
		$('#mchoice').hide();
	}
	else {
		$('#qaform').show();
		$('#question').text(qobject);
		$('#question').show();
		$('#sbutton').removeAttr('disabled');
	}
});

socket.on('multichoice',function(arr) {
	if(arr) {
		$('#qaform').hide();
		Marray = arr;
		$('#mchoice1').text(arr[0]);
		$('#mchoice2').text(arr[1]);
		$('#mchoice3').text(arr[2]);
		$('#mchoice4').text(arr[3]);
		$('#mchoice').show();
	}
});

socket.on('image',function(im) {
	$('#qimage').attr('src',im);
	$('#qimage').show();
});

socket.on('correctAnswer',function(message) {
	$('#canswer').text("Correct Answer: "+message);
	$('#canswer').show();
});

socket.on('submitAnswerResponse',function(msg) {
//	console.log(msg);
	$('#message1').text(msg);
	$('#sbutton').attr('disabled','disabled');
	$('#mchoice').hide();
});

// submit a text or num answer with token
function submitanswer() {
	let ans = new Object();
	ans.val = $('#qanswer').val();
	ans.token = readCookie("quizmaster");
//	console.log("Ans: "+ans.val+":"+ans.token);
	socket.emit('submitAnswerRequest',ans);
}

// submit a multichoice answer
function mcanswer(value) {
//	console.log("Ans is "+Marray[value]);
	let ans = new Object;
	ans.val = Marray[value];
	ans.token = readCookie("quizmaster");
	socket.emit('submitAnswerRequest',ans);
}

function setDefaultValues() {
	$('#version').text(version);
	$('#username').hide();
	$('#game').hide();
	$('#play').hide();
	$('#qaform').hide();
	$('#mchoice').hide();
	$('#scores').hide();
	$('#gameheader').hide();
	$('#menu').show();
	$('#users').show();
	var token = readCookie("quizmaster");
	if(token)
		$('#leave').show();
	else
		$('#leave').hide();
	clearMessages();
}
