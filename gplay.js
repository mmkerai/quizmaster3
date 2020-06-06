/*
*	Quizmaster play game
*/
// var QM = new Object();
// const gid = getURLParameter("gameid");
// const qmid = getURLParameter("qm");
var gid = playname;
//console.log("Game: "+gid);

$(document).ready(function() {
//	console.log("QMid: "+QM.qmid);
	setDefaultValues();
	socket.emit("preGameStartRequest",QM.qmid,gid);
	createQuestionTable("playqtable","pqtable");
});

function startGame() {
	socket.emit("startGameRequest",QM.qmid,gid);
	clearMessages();
}

function nextQuestion() {
	socket.emit("nextQuestionRequest",QM.qmid,gid);
	clearMessages();
}

function showScores() {
	socket.emit("showScoresRequest",QM.qmid,gid);
	clearMessages();
}

function endGame() {
	socket.emit("endGameRequest",QM.qmid,gid);
	clearMessages();
}

function setDefaultValues() {
	$('#play').hide();
	$('#scores').hide();
	$('#prestart').hide();
	$('#gamecontrol').hide();
	$('#mchoice').hide();
	clearMessages();
}

function cancelPlay() {
	$('#play'+gid).remove();		// remove tab content
	$('#'+gid).remove();			// remove tab label
	$('#admin-tab').click();
//	document.getElementById(gid).remove();
}

socket.on('preGameStartResponse',function(game) {
//	console.log("Game: "+JSON.stringify(game));
	$('#gameheader').text("Game: "+gid+" (Access Code: "+game.accesscode+")");
	$('#prestart').show();
	$('#answers').text(0);
	clearMessages();
	$('#pqtable').bootstrapTable({data: game.questions});
});

socket.on('startGameResponse',function(game) {
	$('#play').show();
	$('#startgame').hide();
//	$('#answait').hide();
});

socket.on('currentQuestionUpdate',function(qobject) {
	$('#users').hide();		// only required the first time to hide contentants who joined the game
	if(qobject == "") {
		clearMessages();
		$('#gamecontrol').show();
		$('#question').hide();
		$('#qanswer').val("");
		$('#qimage').hide();
		$('#mchoice').hide();
	}
	else {
		$('#question').show();
		$('#gamecontrol').hide();
	}
	$('#question').text(qobject);
//	$('#answait').show();
});

socket.on('timeUpdate',function(message) {
	$('#timer').text(message);
});

// This is called when a contestant submits an answer
socket.on('answersUpdate',function(ans) {
	$('#answers').text(ans);
	$('#scores').hide();
});

socket.on('image',function(im) {
	$('#qimage').attr('src',im);
	$('#qimage').show();
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

socket.on('endGameResponse',function(gname) {
	$('#admin-tab').click();
	var gametab = "#"+gname;
	$(gametab).remove();
});

