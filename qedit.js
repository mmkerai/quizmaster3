//const socket = io.connect();

const qid = getURLParameter("qid");

function updateq() {
	socket.emit('getCatsRequest','');
	socket.emit('getSubcatsRequest','');
	socket.emit('getDiffsRequest','');
	socket.emit('getTypesRequest','');
	socket.emit('getQuestionByIdRequest',qid);
}

$(document).ready(function() {
	setDefaultValues();
});

socket.on('getQuestionByIdResponse',function(q) {

console.log(q);
$('#qid').val(q.qid);
$('#qcat').val(q.category);
$('#qsubcat').val(q.subcategory);
$('#qdiff').val(q.difficulty);
$('#qtype').val(q.type);
$('#question').val(q.question);
$('#answer').val(q.answer);
	if(q.imageurl == '') {
		$('#imurl').hide();
		$('#qimage').hide();
	}
	else {
		$('#imurl').show();
		$('#qimage').show();
		$('#imurl').val(q.imageurl);
		let url = "http://tropicalfruitandveg.com/quizmaster/"+q.imageurl;
		$('#qimage').attr('src',url);
	}
});

socket.on('loginResponse', function(data) {
	setPostLoginValues(data);
	updateq();
});

socket.on('updateQuestionResponse', function(data) {
	$("#message1").text(data);
	console.log("Question Updated");
});

function qsave() {
	let qobj = new Object();
	qobj.qid = $('#qid').val();
	qobj.category = $('#qcat').val();
	qobj.subcategory = $('#qsubcat').val();
	qobj.difficulty = $('#qdiff').val();
	qobj.type = $('#qtype').val();
	qobj.question = $('#question').val();
	qobj.answer = $('#answer').val();
	qobj.imageurl = $('#imurl').val();
	console.log("Saving...");
	socket.emit('updateQuestionRequest',qobj);
}

function nextq() {
	var qid = $('#qid').val();
	qid++;
	socket.emit('getQuestionByIdRequest',qid);
}

function previousq() {
	var qid = $('#qid').val();
	qid--;
	socket.emit('getQuestionByIdRequest',qid);
}
