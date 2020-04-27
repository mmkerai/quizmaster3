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
	$gmtable = $('#gamestable');
	$('#qselectform').submit(function(event) {event.preventDefault(); }); // stops form submit function
});

$(function() {
	$('#qcat').change(function() {
		let cat = $('#qcat option:selected').val();
		console.log("selected option: "+cat);
		socket.emit("getSubcatsRequest",QM.qmid,cat);
	});
});

$(function() {
    $('#myselect').click(function () {
		var qids = "";
		let ids=$table.bootstrapTable('getSelections');
//		JSON.stringify(ids);
		ids.forEach(function(item,index) {
//			console.log("QID: " +item.qid);
			qids = item.qid +","+qids;
		});
		console.log("QIDs: " +qids);
		$("#qmgquestions").val(qids);
	});
});

/* $(function() {
    $gmtable.click(function () {
      alert('getSelections: ' + JSON.stringify($gmtable.bootstrapTable('getSelections')))
	});
}); */

function responseHandler(res) {
    $.each(res.rows, function (i, row) {
      row.state = $.inArray(row.id, selections) !== -1
	});
	console.log("Selection: "+ res);
    return res
  }

function chooseq() {
	if(!QM) return($('#error').text("You need to login first"));

	$('#qselect').show();
	socket.emit('getCatsRequest',QM.qmid);
}

function getqs() {
	if(!QM) return($('#error').text("You need to login first"));

	console.log("Getting Questions");
	$('#qtable').show();
	$('#myselect').show();
	socket.emit('getQuestionsRequest',QM.qmid);	
}

function newgame() {
	if(!QM) return($('#error').text("You need to login first"));

	$('#newgame').show();
	$('#gtable').hide();
	socket.emit('getCatsRequest',QM.qmid);
	socket.emit('getDiffsRequest',QM.qmid);
	socket.emit('getGameTypesRequest',QM.qmid);
}

function setupGame() {
//	console.log("Creating New Game");
	let newg = new Object();
	newg.qmid = QM.qmid;
	newg.gamename = $('#qmgname').val();
	console.log("Game:"+newg.gamename);
	newg.questions = $('#qmgquestions').val();
	newg.timelimit = $('#qmgtime').val();
	newg.gametype = $('#qmgtype').val();
	socket.emit('newGameRequest',QM.qmid,newg);
}

socket.on('getGamesResponse',function(glist) {
//	console.log(glist);
	$('#gtable').show();
	$('#qtable').hide();
	$('#newgame').hide();
  	$gmtable.bootstrapTable({data: glist});
});

socket.on('newGameResponse',function(msg) {
	clearMessages();
	$('#message1').text(msg);
	socket.emit("getGamesRequest",QM.qmid);
});

socket.on('deleteGameResponse',function(msg) {
	clearMessages();
	$('#message1').text(msg);
});

function setDefaultValues() {
	$('#version').text(version);
	$('#username').hide();
	$('#userimg').hide();
	$('#signoutbutton').hide();
	$('#signinbutton').show();
	$('#qselect').hide();
	$('#yourgames').hide();
	$('#qtable').hide();
	$('#newgame').hide();
	$('#myselect').hide();
	$('#gtable').hide();
	clearMessages();
}

function setPostLoginValues() {
	clearMessages();
	$('#gameplay').show();
	$('#prestart').show();
	$('#yourgames').show();
	$('#adminmsg').hide();
	$('#newgame').hide();
	socket.emit("getGamesRequest",QM.qmid);
}

function actionFormatter(value, row, index) {
    return [
      '<a class="play" href="javascript:void(0)" title="Start Play">',
//	  '<i class="fa fa-heart"></i>',
		'<img src="images/playicon40.png" alt="start"',
      '</a>  ',
      '<a class="edit" href="javascript:void(0)" title="Edit">',
		'<img src="images/gears40.png" alt="edit"',
	  '</a>',
	  '<a class="delete" href="javascript:void(0)" title="Delete">',
		'<img src="images/trash40.png" alt="trash"',
	  '</a>'
    ].join('');
}

window.operateEvents = {
    'click .play': function (e, value, row, index) {
//	  alert('You click action, row: ' + JSON.stringify(row));
		window.open("gplay.html?gameid="+row.gamename, '_blank');
    },
    'click .edit': function (e, value, row, index) {
		$('#newgame').show();
		$('#gtable').hide();
		$('#qmgname').val(row.gamename);
		$('#qmgquestions').val(row.questions);
	 	$('#qmgtime').val(row.timelimit);
	 	$('#qmgtype').val(row.gametype);
	},
	'click .delete': function (e, value, row, index) {
	  if(confirm('Are you sure you want to delete game: ' + JSON.stringify(row.gamename))) {
		  socket.emit('deleteGameRequest',QM.qmid,row);
	  }
	}
}
