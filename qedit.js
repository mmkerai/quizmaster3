const qid = getURLParameter("qid");

$(document).ready(function() {
	setDefaultValues();
	$('#editq').submit(function(event) {
		event.preventDefault();
	});
	$('#qcat').change(function() {
	var cat = $('#qcat option:selected').val();
		socket.emit("getSubcatsRequest",QM.qmid,cat);
	});
});

function onSignInSuper(googleUser) {
	var profile = googleUser.getBasicProfile();
//	console.log("ID: " + profile.getId()); // Don't send this directly to your server!
	console.log('Logged in: ' + profile.getName());
	var id_token = googleUser.getAuthResponse().id_token;
//	console.log("ID Token: " + id_token);
	socket.emit('loginSuperRequest',id_token);	// this is for super admin only
	clearMessages();
}

socket.on('loginSuperResponse', function(userinfo) {
	if(userinfo) {
		QM = userinfo;	// save the user info
		$('#username').text(userinfo.name);
		$('#userimg').attr("src",userinfo.imageUrl);
		$('#signinbutton').hide();
		$('#signoutbutton').show();
		$('#username').show();
		$('#userimg').show();
		$("#error").text("");
		$('#registerlabel').hide();
		$('#registerbutton').hide();
		updateq();
	}
	else {
		$("#error").text("Login not valid");
	}
});

socket.on('getQuestionByIdResponse',function(q) {
	console.log(q);
	$('#qid').val(q.qid);
	$('#qcat').val(q.category);
	// The subcats will depend on the cats so get the specific subcats for this cat only
	socket.emit("getSubcatsRequest",QM.qmid,q.category);
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
		let url = "https://tropicalfruitandveg.com/quizmaster/"+q.imageurl;
		$('#qimage').attr('src',url);
	}
});

socket.on('updateQuestionResponse', function(data) {
	$("#message1").text(data);
	console.log("Question Updated");
});

function updateq() {
	socket.emit('getCatsRequest',QM.qmid);
//	socket.emit('getSubcatsRequest',QM.qmid); // dont fetch yet as will depend on the category
	socket.emit('getDiffsRequest',QM.qmid);
	socket.emit('getQuestionTypesRequest',QM.qmid);
	socket.emit('getQuestionByIdRequest',QM.qmid,qid);
}

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
	socket.emit('updateQuestionRequest',QM.qmid,qobj);
}

function nextq() {
	var qid = $('#qid').val();
	qid++;
//	window.open("qedit.html?qid="+qid, '_self');
	socket.emit('getQuestionByIdRequest',QM.qmid,qid);
}

function previousq() {
	var qid = $('#qid').val();
	qid--;
//	window.location.href = "qedit.html?qid="+qid;
	socket.emit('getQuestionByIdRequest',QM.qmid,qid);
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
