//const socket = io.connect();

$(document).ready(function() {
	setDefaultValues();
	checksignedin();
	$('#reviewq').submit(function(event) {
		event.preventDefault();
	});
	$('select[name="qcat"]').change(function() {
      let cat = $('select[name="qcat"] option:selected').val();
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

function loadqinmem() {
	console.log("Loading Questions in Memory");
	socket.emit('loadInMemRequest','testq.json');
}

function createQTable() {
	console.log("Creating Tables");
	socket.emit('createQTableRequest','test');
}

function createdb() {
	console.log("Creating Tables");
	socket.emit('createDBTablesRequest','test');
}

function createapp() {
	console.log("Creating Test App");
	socket.emit('createAppRequest','test');
}

function reviewq() {
	console.log("Reviewing Questions");
	socket.emit('getCatsRequest','test');
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

socket.on('SignInSuperResponse', function(data) {
	setPostLoginValues(data);
});

socket.on('getQuestionsResponse', function(qlist) {
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
});
