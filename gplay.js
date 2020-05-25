/*
*	Quizmaster play game
*/
// var QM = new Object();
// const gid = getURLParameter("gameid");
// const qmid = getURLParameter("qm");
var gid = playname;
//console.log("Game: "+gid);

$(document).ready(function() {
	setDefaultValues();
//	console.log("QMid: "+QM.qmid);
	$table = $('#questiontable');
 	socket.emit("preGameStartRequest",QM.qmid,gid);
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
	$('#qtable').hide();
	clearMessages();
}

socket.on('preGameStartResponse',function(game) {
//	console.log("Game: "+JSON.stringify(game));
	$('#gameheader').text("Game: "+gid+" (Access Code: "+game.accesscode+")");
	$('#prestart').show();
	$('#answers').text(0);
//	socket.emit("getQuestionsRequest",QM.qmid,game);
	clearMessages();
	$('#qtable').show();
	$table.bootstrapTable({data: game.questions});
});

socket.on('startGameResponse',function(game) {
	$('#play').show();
	$('#startgame').hide();
	$('#answait').hide();
});

socket.on('currentQuestionUpdate',function(qobject) {
	$('#users').hide();		// only required the first time to hide contentants who joined the game
	if(qobject == "") {
		clearMessages();
		$('#shscores').show();
		$('#question').hide();
		$('#qanswer').val("");
		$('#qimage').hide();
		$('#mchoice').hide();
	}
	else {
		$('#question').text(qobject);
		$('#question').show();
		$('#answait').hide();
		$('#nextq').show();
	}
	$('#question').text(qobject);
	$('#answait').show();
});

socket.on('timeUpdate',function(message) {
	$('#timer').text(message);
});

socket.on('getQuestionsResponse',function(qlist) {
//	console.log('Qlist: '+JSON.stringify(qlist));
	$('#qlist').show();
	$table.bootstrapTable({data: qlist});
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

