var QM = new Object();
/* var filterCategory = {
	somekey: 'Cat',
	anotherkey: 'Cat2'
	}; */

$(document).ready(function() {
	setDefaultValues();
	$table = $('#btable');
	$select = $('#myselect');
	$('#reviewq').submit(function(event) {
		event.preventDefault();
	});
});

$(function() {
    $select.click(function () {
      alert('getSelections: ' + JSON.stringify($table.bootstrapTable('getSelections')))
	});
});

function loadq() {
	console.log("Loading Questions");
	clearMessages();
	socket.emit('loadQuestionsRequest',QM.qmid);
}

function reviewq() {
	if(!QM)	return($('#error').text("You need to login first"));
	console.log("Reviewing Questions");
	$("#error").text("");
	socket.emit('getCatsRequest',QM.qmid);
}

function getqs() {
	if(!QM)	return($('#error').text("You need to login first"));

	console.log("Getting Questions");
	$("#error").text("");
	$('#qtable').show();
	socket.emit('getQuestionsRequest',QM.qmid);	
}

function setDefaultValues() {
	$('#version').text(version);
	$('#username').hide();
	$('#userimg').hide();
	$('#signoutbutton').hide();
	$('#signinbutton').show();
	clearMessages();
	console.log("Doc ready");
}

function setPostLoginValues() {
	$('#gameplay').show();

}