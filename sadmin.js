var QM = new Object();
var $table,$select;

$(document).ready(function() {
	setDefaultValues();
	signInSuper();
	$table = $('#btable');
	$select = $('#select');
	$('#reviewq').submit(function(event) {
		event.preventDefault();
	});
	$('#qcat').change(function() {
      let cat = $('#qcat option:selected').val();
			console.log("selected option: "+cat);
			socket.emit("getSubcatsRequest",cat);
	});
});

// This is only for testing without using Google login
function signInSuper() {
	socket.emit('SignInSuperRequest',"");
}

function loadq() {
	console.log("Loading Questions");
	socket.emit('loadQuestionsRequest','');
}

function createqm() {
	console.log("Creating default quizmaster");
	socket.emit('createTestQMasterRequest','test');
}

function createapp() {
	console.log("Creating Test App");
	socket.emit('createTestAppRequest','test');
}

function reviewq() {
	console.log("Reviewing Questions");
	socket.emit('getCatsRequest',QM.qmid);
}

function getqs() {
	if(!QM)
		return($('#error').text("You need to login first"));

		console.log("Getting Questions");
		$('#qtable').show();
		socket.emit('getQuestionsRequest',QM.qmid);	
}

socket.on('createQTableResponse',function(data) {
	$("#message1").text(data);
});

socket.on('createDBTablesResponse',function(data) {
	$("#message1").text(data);
});

socket.on('createAppResponse',function(data) {
	$("#message1").text(data);
});

socket.on('SignInSuperResponse',function(name) {
	QM = name;
	setPostLoginValues(name);
});

// Bootstrap table
socket.on('getQuestionsResponse',function(qlist) {
	$table.bootstrapTable({data: qlist});
});

$(function() {
    $select.click(function () {
      alert('getSelections: ' + JSON.stringify($table.bootstrapTable('getSelections')))
	});
});
