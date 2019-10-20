var QM = new Object();
var $table,$select;

$(document).ready(function() {
	setDefaultValues();
	signInSuper();
	$table = $('#btable');
	$select = $('#select')
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

socket.on('createQTableResponse',function(data) {
	$("#message1").text(data);
});

socket.on('createDBTablesResponse',function(data) {
	$("#message1").text(data);
});

socket.on('createAppResponse',function(data) {
	$("#message1").text(data);
});

socket.on('SignInSuperResponse', function(name) {
	QM = name;
	setPostLoginValues(name);
});

// Tabulator table
/* socket.on('getQuestionsResponse', function(qlist) {
//	console.log(qlist);
	var table = new Tabulator("#qtable", {
	    data: qlist,
	    columns:[
	    {title:"Category", field:"category"},
	    {title:"Subcategory", field:"subcategory"},
	    {title:"Difficulty", field:"difficulty",widthGrow:2},
	    {title:"Type", field:"type", align:"center"},
	    {title:"Question", field:"question",width:320},
	    {title:"Answer", field:"answer"},
	 		{title:"Image", field:"imageurl"}],
			rowDblClick:function(e, row) {
				console.log(row._row.data.qid);
				window.open("qedit.html?qid="+row._row.data.qid, '_blank');
  			},
	});
}); */

// Bootstrap table
socket.on('getQuestionsResponse', function(qlist) {
	$table.bootstrapTable({data: qlist});
});

$(function() {
    $select.click(function () {
      alert('getSelections: ' + JSON.stringify($table.bootstrapTable('getSelections')))
	});
});
