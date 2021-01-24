/*
*	Quizmaster admin page
*/
var QM = new Object();
var Questions = [];
var playname;
Chart.defaults.global.animation.duration = 3000;	// chart.js is used for scores
Chart.defaults.global.legend.position = "bottom";

$(document).ready(function() {
	setDefaultValues();
	$table = $('#btable');
});

/* $(function() {
	$('#qcat').change(function() {
		let cat = $('#qcat option:selected').val();
		console.log("selected option: "+cat);
		socket.emit("getSubcatsRequest",QM.qmid,cat);
	});
});
 */

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
	createNewNavTab("Questions","q-tab","#questions");
	$("#q-tab").click();
	$("#qlist").text($("#qmgquestions").val());
	socket.emit('getCatsRequest',QM.qmid);
	// socket.emit('getGameQuestionsRequest',QM.qmid,$('#qmgquestions').val());
}

function getqs() {
	if(!QM) return($('#error').text("You need to login first"));
	var cat = $('#qcat').val();
//	console.log("Getting Questions for category: "+cat);
	socket.emit('getQuestionsByCatRequest',QM.qmid,cat);	
}

function newgame() {
	if(!QM) return($('#error').text("You need to login first"));
	$gqtable = $('#mqtable');
	clearGameSetup();	// reset all variables
	createNewNavTab("Setup Quiz","setup-tab","#setup");
	$("#setup-tab").click();
	createQuestionTable("myqtable","mqtable");
	socket.emit('getCatsRequest',QM.qmid);
	socket.emit('getDiffsRequest',QM.qmid);
	socket.emit('getGameTypesRequest',QM.qmid);
}

function setupGame() {
//	console.log("Creating New Game");
	clearMessages();
	let newg = new Object();
	newg.qmid = QM.qmid;
	newg.gamename = $('#qmgname').val();
//	console.log("Game:"+newg.gamename);
	newg.questions = $('#qmgquestions').val();
	newg.timelimit = $('#qmgtime').val();
	newg.gametype = $('#qmgtype').val();
	newg.gamedesc = $('#qmgdesc').val();
	if(newg.gamedesc.length == 0) {
		newg.gamedesc = "This is the game description";
	}
	newg.gameicon = "";
	socket.emit('newGameRequest',QM.qmid,newg);
}

function myselect() {
	var qids = "";
	var ids=$table.bootstrapTable('getSelections');
	ids.forEach(function(item,index) {
//			console.log("QID: " +item.qid);
		qids = item.qid +","+qids;
	});
	alert("Questions Added: " +qids);
	var str = $("#qmgquestions").val();		// get existing list of questions
	if(str.charAt(str.length-1) != ',')		// if last char isnt a , the add it
		str = str + ',';
	$("#qlist").text(str+qids);				// show on questions tab
	$("#qmgquestions").val(str+qids);		// add new selected questions
}

socket.on('getGamesResponse',function(glist) {
//	console.log(glist);
  	$('#gamestable').bootstrapTable({data: glist});
	$('#gamestable').bootstrapTable('load', glist);
});

socket.on('newGameResponse',function(msg) {
	clearMessages();
	cancelSetup();
	socket.emit("getGamesRequest",QM.qmid);
	$('#message1').text(msg);
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
	$('#mynavtabs').hide();
	$('#myTabContent').hide();
	$('#adminmsg').show();
	$('#selectqtable').hide();
	clearMessages();
}

function setPostLoginValues() {
	clearMessages();
	$('#mynavtabs').show();
	$('#myTabContent').show();
	$('#gameplay').show();
	$('#prestart').show();
	$('#yourgames').show();
	$('#adminmsg').hide();
	socket.emit("getGamesRequest",QM.qmid);
	$('#admin-tab').click();
}

function cancelSetup() {
	$('#admin-tab').click();
	$('#setup-tab').remove();
}

function cancelQSelect() {
	$('#setup-tab').click();
	createQuestionTable("myqtable","mqtable");
	$gqtable = $('#mqtable');
	var qlist = $("#qlist").text()
	socket.emit('getGameQuestionsRequest',QM.qmid,qlist.split(","));
	$('#q-tab').remove();
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
	// Go to play quiz page. If play tab already open then dont open another one
    'click .play': function (e, value, row, index) {
		var tab,id;
		var flag = true;
		var navtabs = document.getElementsByClassName("nav-link");
		navtabs.forEach(function(value,index) {
			id = navtabs[index].getAttribute("id");
			tab = navtabs[index].getAttribute("href");
//			console.log("NavTab: "+tab);
			if(tab.includes("play")) {	
				flag = false;
				alert(id+" already in play");
			}
		});
		if(flag) {		// only if a game not already in play
			var pageid = "#play"+row.gamename;
			createNewNavTab("Play "+row.gamename,row.gamename,pageid);
			var node = document.createElement("div");	// Create a <li> node
			node.setAttribute("class","tab-pane fade");
			node.setAttribute("role","tabpanel");
			node.setAttribute("id","play"+row.gamename);
			document.getElementById("myTabContent").appendChild(node);
			document.getElementById(row.gamename).click();
			playname = row.gamename;
			$(pageid).load("gplay.html");
		}
    },
    'click .edit': function (e, value, row, index) {
		socket.emit('getGameTypesRequest',QM.qmid);
		clearMessages();
		createNewNavTab("Edit Quiz","setup-tab","#setup");
		$("#setup-tab").click();
		$('#newgame').show();
		$('#qmgname').val(row.gamename);
		$('#qmgquestions').val(row.questions);
	 	$('#qmgtime').val(row.timelimit);
		$('#qmgtype').val(row.gametype);
		$('#qmgdesc').val(row.gamedesc);
		createQuestionTable("myqtable","mqtable");
		$gqtable = $('#mqtable');
		socket.emit('getGameQuestionsRequest',QM.qmid,row.questions);
	},
	'click .delete': function (e, value, row, index) {
	  if(confirm('Are you sure you want to delete game: '+JSON.stringify(row.gamename))) {
		  socket.emit('deleteGameRequest',QM.qmid,row);
	  }
	}
}

function questionFormatter(value, row, index) {
	var str;
	if(row.imageurl) {
		str = '<img src="http://tropicalfruitandveg.com/quizmaster/'+row.imageurl+'" alt="img">'
	}
	else 
		str = "No image";
    return [str].join('');
}

window.questionEvents = {
	// Go to play quiz page
    'click .viewimage': function (e, value, row, index) {
		console.log("image: "+row.imageurl);
    }
}