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
	clearMessages();
	deleteCookie("quizmaster");
//	socket.emit('consLeaveRequest',contestant);
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
socket.on('contestantUpdate',function(con) {
	//	console.log("Contestants:"+con);
		$('#users').text(Object.keys(con).length);
		let ulist = "";
		for(var i in con) {
			ulist = ulist + con[i].cname +"<br/>";
		}
		$('#userlist').html(ulist);
	});
	
socket.on('currentQuestionUpdate',function(qobject) {
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
	$('#leave').hide();
	$('#game').hide();
	$('#play').hide();
	$('#qaform').hide();
	$('#mchoice').hide();
	$('#scores').hide();
	clearMessages();
}
