/*
*	Quizmaster Home page
*/

var QM = new Object();
var Questions = [];
var Marray = [];

$(document).ready(function() {
	setDefaultValues();
//	checksignedin();
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

socket.on('loginResponse',function(qm) {
	QM = qm;
	console.log("Login response: "+QM.qmname);
	setPostLoginValues(QM);
	socket.emit("getGamesRequest",QM.qmid);
});

socket.on('joinGameResponse',function(contestant) {
	$('#joingamex').hide();
	$('#menu').hide();
//	$('#gameheader').text(message);
	$('#userbutton').text(contestant.userid);
	$('#userbutton').show();
	saveCookie("quizmaster",contestant.token,1800);	// save credentials for 30 mins
});

socket.on('timeUpdate',function(message) {
//	$('#tremain').text(message);
	if(message == 0) {
		hideCountdown();
	} else {
		showCountdown();
		$('#counter').text(message);
	}
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

socket.on('scoresUpdate',function(score) {
	$('#scores').show();
	var table = new Tabulator("#scores", {
		layout:"fitColumns",
		data: score,
		responsiveLayout:true,
	    columns:[
			{title:"Name", field:"cname"},
			{title:"Points", field:"points"},
			{title:"Points", field:"points",formatter:"progress",formatterParams:{color:["#00dd00","orange","rgb(255,0,0)"]},width:500}
		]	
	});
});

// submit a text or num answer with token
function submitanswer() {
	let ans = new Object;
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

function showCountdown() {
  document.getElementById("counter").style.display = "block";
}

function hideCountdown() {
  document.getElementById("counter").style.display = "none";
}
