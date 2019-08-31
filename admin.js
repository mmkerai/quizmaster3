/*
*	Quizmaster admin page
*/

var QM = new Object();
var Questions = [];

$(document).ready(function() {
	setDefaultValues();
	$('#newgame').hide();
	$('#qchoose').hide();
	checksignedin();
	$('#qchooseform').submit(function(event) {
		event.preventDefault();
	});
	$('select[name="qcat"]').change(function() {
			let cat = $('select[name="qcat"] option:selected').val();
			console.log("selected option: "+cat);
			socket.emit("getSubcatsRequest",QM.qmid,cat);
	});
});

function register() {
	$('#registerbutton').hide();
	$('#regqm').show();
}

function regNewQM() {
	let qm = new Object();
	let sub = $('#qmsubid').val();
	qm.sub = Number(sub);
	qm.name = $('#qmname').val();
	qm.email = $('#qmemail').val();
	console.log("Registering..."+qm.name);
	socket.emit('registerQMRequest',qm);
}

function chooseq() {
	if(!QM)
		return($('#error').text("You need to login first"));

	$('#qchoose').show();
	socket.emit('getCatsRequest',QM.qmid);
}

function reviewq() {
	if(!QM)
		return($('#error').text("You need to login first"));

	console.log("Reviewing Questions");
	socket.emit('getCatsRequest',QM.qmid);
//	socket.emit('getSubcatsRequest',QM.qmid);
//	socket.emit('getDiffsRequest',QM.qmid);
}

function newgame() {
	if(!QM)
		return($('#error').text("You need to login first"));

	$('#newgame').show();
	$('#gamestable').hide();
	socket.emit('getCatsRequest',QM.qmid);
	socket.emit('getDiffsRequest',QM.qmid);
	socket.emit('getGameTypesRequest',QM.qmid);
}

function addgame() {
//	console.log("Creating New Game");
	let newg = new Object();
	newg.qmid = QM.qmid;
	newg.gamename = $('#qmgname').val();
	console.log("Game:"+newg.gamename);
	newg.numquestions = Questions.length;
	newg.questions = Questions;
	newg.timelimit = $('#qmgtime').val();
	newg.gametype = $('#qmgtype').val();
//	newg.accesscode = $('#qmgacode').val();
	socket.emit('newGameRequest',QM.qmid,newg);
}

socket.on('loginResponse',function(qm) {
	QM = qm;
	console.log("Login response: "+QM.qmid);
	setPostLoginValues(QM);
	socket.emit("getGamesRequest",QM.qmid);
	$('#error').text("");
});

socket.on('registerQMResponse',function(qm) {
	console.log(qm);
	$('#registerbutton').hide();
	$('#regqm').hide();
});

socket.on('getGamesResponse',function(glist) {
//	console.log(glist);
	$('#gamestable').show();
	var table = new Tabulator("#gamestable", {
	    data: glist,
   		responsiveLayout:true,
	    columns:[
			{title:"Game Name", field:"gamename",width:300},
	    {title:"Game Type", field:"gametype"},
			{title:"Access Code", field:"accesscode"},
	    {title:"No of Questions", field:"numquestions"},
			{title:"Time Limit", field:"timelimit"}],
			rowDblClick:function(e, row) {
				console.log(row._row.data.gameid);
				window.open("gplay.html?gameid="+row._row.data.gameid, '_blank');
  			},
	});
});

socket.on('getQuestionsResponse',function(qlist) {
		var table = new Tabulator("#setqtable", {
		    data: qlist,
		    columns:[
		    {title:"Category", field:"category"},
		    {title:"Subcategory", field:"subcategory"},
		    {title:"Difficulty", field:"difficulty",widthGrow:2},
		    {title:"Type", field:"type", align:"center"},
		    {title:"Question", field:"question",width:320},
		    {title:"Answer", field:"answer"},
		 		{title:"Image", field:"imageurl"}],
				rowDblClick:function(e,row) {
					console.log(row._row.data.qid);
					Questions.push(row._row.data.qid);
					$('#qmgquestions').val(Questions);
	  		},
		});
});

socket.on('newGameResponse',function(data) {
	$('#message1').text("Game created");
	$('#error').text("");
	setPostLoginValues(QM);
	socket.emit("getGamesRequest",QM.qmid);
});
