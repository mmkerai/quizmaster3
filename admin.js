/*
*	Quizmaster admin page
*/
var QM = new Object();
var Questions = [];
/* var filterCategory = {
	somekey: 'Cat',
	anotherkey: 'Cat2'
	}; */

$(document).ready(function() {
	setDefaultValues();
	$table = $('#btable');
	$select = $('#myselect');
	$('#qselectform').submit(function(event) {
		event.preventDefault();
	});
	$('#qcat').change(function() {
		let cat = $('#qcat option:selected').val();
		console.log("selected option: "+cat);
		socket.emit("getSubcatsRequest",QM.qmid,cat);
	});
});

$(function() {
    $select.click(function () {
      alert('getSelections: ' + JSON.stringify($table.bootstrapTable('getSelections')))
	});
});

function chooseq() {
	if(!QM) return($('#error').text("You need to login first"));

	$('#qselect').show();
	socket.emit('getCatsRequest',QM.qmid);
}

/* function getqs() {
	if(!QM) return($('#error').text("You need to login first"));

	console.log("Getting Questions");
	$('#qtable').show();
	socket.emit('getQuestionsRequest',QM.qmid);	
}
 */
function newgame() {
	if(!QM) return($('#error').text("You need to login first"));

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

// // Bootstrap table
// socket.on('getQuestionsResponse', function(qlist) {
// 	console.log(qlist);
// 	$table.bootstrapTable({data: qlist});
// });

socket.on('newGameResponse',function(data) {
	clearMessages();
	$('#message1').text("Game created");
	socket.emit("getGamesRequest",QM.qmid);
});

function setDefaultValues() {
	$('#version').text(version);
	$('#username').hide();
	$('#userimg').hide();
	$('#signoutbutton').hide();
	$('#signinbutton').show();
	$('#qselect').hide();
	$('#gamestable').show();
	$('#yourgames').hide();
	$('#qtable').hide();
	$('#newgame').hide();
	clearMessages();
}

function setPostLoginValues(qm) {
	clearMessages();
	$('#gameplay').show();
	$('#prestart').show();
	$('#yourgames').show();
	$('#gamestable').hide();
	$('#newgame').hide();
}
	