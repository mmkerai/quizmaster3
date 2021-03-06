/*
*	Quizmaster Home page
*/

var QM = new Object();
var Questions = [];
var Marray = [];
Chart.defaults.global.animation.duration = 3000;	// chart.js is used for scores
Chart.defaults.global.legend.position = "bottom";

$(document).ready(function() {
	setDefaultValues();
	$('#joinform').submit(function(event) {
		event.preventDefault();
	});
	$('#ansform').submit(function(event) {
		event.preventDefault();
	});

	socket.emit("getPopularQuizesRequest","");
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
	$('#popular').hide();
	$('#menu').hide();
	$('#play').show();
	$('#username').text(contestant.userid);
	$('#username').show();
	$('#leave').show();
	$('#gameheader').text("You have joined: "+contestant.gamename);
	saveCookie("quizmaster",contestant.token,1800);	// save credentials for 30 mins
});

socket.on('currentQuestionUpdate',function(qobject) {
	$('#pjoinmsg').hide();		// only required the first time to hide contentants who joined the game
	$('#users').hide();		// only required the first time to hide contentants who joined the game
	$('#correctans').hide();
	$('#yourans').hide();
	$('#yourpts').hide();
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
		$('#sbutton').show();
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
	$('#correctans').text("Correct answer: "+message);
	$('#correctans').show();
	$('#yourans').show();
	$('#yourpts').show();
	$('#qimage').hide();
	$('#mchoice').hide();
});
 
socket.on('submitAnswerResponse',function(ans) {
//	console.log(msg);
	$('#yourans').text("Your answer: "+ans.answer);
	$('#points').text(ans.points);
	$('#yourans').show();
	$('#sbutton').hide();
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
	$('#correctans').hide();
	$('#yourans').hide();
	$('#yourpts').hide();
	$('#scores').hide();
	$('#gameheader').hide();
	$('#menu').show();
	$('#pjoinmsg').show();
	$('#users').show();
	var token = readCookie("quizmaster");
	if(token)
		$('#leave').show();
	else
		$('#leave').hide();
	clearMessages();
}
