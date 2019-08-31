/*
*	Quizmaster play game
*/

var QM = new Object();
var Questions = [];
const gid = getURLParameter("gameid");

$(document).ready(function() {
	$('#users').hide();
	setDefaultValues();
	checksignedin();
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

socket.on('loginResponse',function(qm) {
	$('#error').text("");
	QM = qm;
	setPostLoginValues(QM);
	socket.emit("preGameStartRequest",QM.qmid,gid);
	clearMessages();
});

socket.on('preGameStartResponse',function(game) {
	updateContestants(game.contestants);
	$('#users').show();
	$('#answers').text(0);
	socket.emit("getQuestionsRequest",game);
	clearMessages();
});

socket.on('startGameResponse',function(game) {
	$('#gameplay').show();
	$('#prestart').hide();
	$('#answait').hide();
});

socket.on('currentQuestionUpdate',function(qobject) {
	if(qobject == "") {
		$('#message1').text("");
		$('#shscores').show();
//		$('#nextq').show();
	}
	else {
		$('#answait').hide();
		$('#nextq').show();
	}
	$('#question').text(qobject);
	$('#answait').show();
});

socket.on('timeUpdate',function(message) {
	$('#tremain').text(message);
});

socket.on('getQuestionsResponse',function(qlist) {
//	console.log('Qlist: '+JSON.stringify(qlist));
	$('#qlist').show();
		var table = new Tabulator("#qlist", {
		    data: qlist,
		    columns:[
		    {title:"ID", field:"qid"},
				{title:"Category", field:"category"},
		    {title:"Subcategory", field:"subcategory"},
		    {title:"Difficulty", field:"difficulty",widthGrow:2},
		    {title:"Type", field:"type", align:"center"},
		    {title:"Question", field:"question",width:320},
		    {title:"Answer", field:"answer"},
		 	{title:"Image", field:"imageurl"}],
		});
});

// This is called when a new contestant joins the game
// con is an array of contestant names
socket.on('contestantUpdate',function(con) {
	updateContestants(con);
});

// This is called when a contestant submits an answer
socket.on('answersUpdate',function(ans) {
	$('#answers').text(ans);
	$('#scores').hide();
});

function updateContestants(con) {
//	console.log("Contestants:"+con);
	$('#users').text(Object.keys(con).length);
	let ulist = "";
	for(var i in con) {
		ulist = ulist + con[i].cname +"<br/>";
	}
	$('#userlist').html(ulist);
}

socket.on('image',function(im) {
	$('#qimage').attr('src',im);
});

socket.on('scoresUpdate',function(scores) {
	$('#scores').show();
	var table = new Tabulator("#scores", {
		layout:"fitColumns",
		data: scores,
		columns:[
		{title:"Name", field:"cname"},
		{title:"Points", field:"points"},
		{title:"Points", field:"points",formatter:"progress",formatterParams:{color:["#00dd00", "orange", "rgb(255,0,0)"]},width:500}]
	});
});

socket.on('endGameResponse',function() {
	window.close();
});

