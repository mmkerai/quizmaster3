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
	// isSignedIn();
	socket.emit("getPopularQuizesRequest","");
});

function doJoin() {
	var contestant = new Object();
	// contestant = JSON.parse(readCookie("quizmaster"));
	// if(contestant)
	// 	socket.emit('joinGameRequest',contestant);
	// else
	$('#joingamex').show();
	$('#popular').hide();
}

// when user wants to play game by themselves (not via quizmaster)
function playself(gamename) {
	var cname = prompt("Please enter your nickname to start playing", "");
	if(cname == null || cname == "") {
		return;
	}
	else {
		var contestant = new Object();
		contestant.userid = cname;
		contestant.gamename = gamename;
		socket.emit('playSelfRequest',contestant);	// contestant joining
	}
}

function joinquiz() {
	clearMessages();
	var contestant = new Object();
	contestant.userid = $('#cname').val();
	contestant.accesscode = $('#cacode').val();
	socket.emit('joinGameRequest',contestant);
}

// Contestant leave the game - which means basically clear cookie and tidy up
function cleave() {
	var contestant = JSON.parse(readCookie("quizmaster"));
	if(contestant) {
		socket.emit('conLeaveRequest',contestant);		// tidy up on server
		deleteCookie("quizmaster");
	}
	location.reload();
}

// used during self play for next question
function selfPlayNextQuestion() {
	var contestant = JSON.parse(readCookie("quizmaster"));
	socket.emit("selfPlayNextQuestionRequest",contestant);
	clearMessages();
}

// used during self play to end early
function endSelfPlay() {
	var contestant = JSON.parse(readCookie("quizmaster"));
	socket.emit("selfPlayEndGameRequest",contestant);
	clearMessages();
}

socket.on('joinGameResponse',function(contestant) {
	$('#joingamex').hide();
	$('#popular').hide();
	$('#menu').hide();
	$('#play').show();
	$('#username').text(contestant.userid);
	$('#username').show();
	$('#leave').show();
	$('#gameheader').text("You are playing quiz: "+contestant.gamename);
	$('#gameheader').show();
//	console.log("Contestant: "+JSON.stringify(contestant));
	saveCookie("quizmaster",JSON.stringify(contestant),1800);	// save credentials for 30 mins
});

socket.on('currentQuestionUpdate',function(qobject) {
	$('#pjoinmsg').hide();		// only required the first time to hide contentants who joined the game
	$('#users').hide();		// only required the first time to hide contentants who joined the game
	$('#correctans').hide();
	$('#yourans').hide();
	$('#yourpts').hide();
	$('#totalpts').hide();
	$('#scores').hide();
	$('#gamecontrol').hide();
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
	$('#qanswer').focus();
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
	$('#gamecontrol').show();
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

// Show running total after each question/answer
socket.on('selfPlayTotal', function(points) {
	$('#total').text(points);
	$('#totalpts').show();
	$('#gamecontrol').hide();
});

socket.on('selfPlayEndGameResponse', function() {
	$('#qheader').text("End of Game");
	deleteCookie("quizmaster");
	setTimeout(location.reload(), 2000);	// refresh after a short time
});

// submit a text or num answer with contestant details
function submitanswer() {
	let ans = new Object();
	ans.val = $('#qanswer').val();
	ans.contestant = JSON.parse(readCookie("quizmaster"));
//	console.log("Ans: "+ans.val+":"+ans.token);
	socket.emit('submitAnswerRequest',ans);
}

// submit a multichoice answer with contestant details
function mcanswer(value) {
//	console.log("Ans is "+Marray[value]);
	let ans = new Object;
	ans.val = Marray[value];
	ans.contestant = JSON.parse(readCookie("quizmaster"));
	socket.emit('submitAnswerRequest',ans);
}

function setDefaultValues() {
	$('#version').text(version);
	$('#username').hide();
	$('#userimg').hide();
	$('#signinbutton').show();
	$('#signupbutton').show();
	$('#signoutbutton').hide();
	$('#game').hide();
	$('#play').hide();
	$('#gamecontrol').hide();
	$('#qaform').hide();
	$('#mchoice').hide();
	$('#correctans').hide();
	$('#yourans').hide();
	$('#yourpts').hide();
	$('#totalpts').hide();
	$('#scores').hide();
	$('#gameheader').hide();
	$('#menu').show();
	$('#pjoinmsg').show();
	$('#users').show();
	$('#popular').show();
	var contestant = JSON.parse(readCookie("quizmaster"));
	if(contestant)
		$('#leave').show();
	else
		$('#leave').hide();
	clearMessages();
}
