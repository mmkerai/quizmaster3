/*
*	Quizmaster play game
*/
var QM = new Object();
var Questions = [];
const gid = getURLParameter("gameid");

$(document).ready(function() {
	setDefaultValues();
	$table = $('#questiontable');
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
	$('#version').text(version);
	$('#username').hide();
	$('#userimg').hide();
	$('#signoutbutton').hide();
	$('#signinbutton').show();
	$('#game').hide();
	$('#play').hide();
	$('#scores').hide();
	clearMessages();
//	console.log("Doc ready");
}

function setPostLoginValues() {
	clearMessages();
	$('#game').show();
	$('#prestart').show();
	$('#gameheader').text("Game: "+gid);
	socket.emit("preGameStartRequest",QM.qmid,gid);
}

socket.on('preGameStartResponse',function(game) {
//	console.log("Game: "+JSON.stringify(game));
	$('#users').show();
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
	if(qobject == "") {
		$('#shscores').show();
		clearMessages();
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

socket.on('scoresUpdate',function(cpoints) {
	$('#scores').show();
//	$stable = $('#scorestable');
//	$stable.bootstrapTable({data: scores});
	var chart = new CanvasJS.Chart("scores", {
		animationEnabled: true,
		title:{
			text:"Latest Scores"
		},
		axisX:{
			interval: 1
		},
		axisY2:{
			interlacedColor: "rgba(1,77,101,.2)",
			gridColor: "rgba(1,77,101,.1)",
			title: "Number of Companies"
		},
		data: [{
			type: "bar",
			name: "points",
			axisYType: "secondary",
			color: "#014D65",
			dataPoints: cpoints
		}]
	});
	chart.render();
});

socket.on('endGameResponse',function() {
	window.close();
});

