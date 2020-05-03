var QM = new Object();

$(document).ready(function() {
	setDefaultValues();
	$table = $('#btable');
	$select = $('#myselect');
/* 	$('#reviewq').submit(function(event) {
		event.preventDefault();
	}); */
/* 	$('#qcat').change(function() {
      let cat = $('#qcat option:selected').val();
			console.log("selected option: "+cat);
			socket.emit("getSubcatsRequest",QM.qmid,cat);
	}); */
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

function loadq() {
	console.log("Loading Questions");
	clearMessages();
	socket.emit('loadQuestionsRequest',QM.qmid);
}

function reviewq() {
	if(!QM)	return($('#error').text("You need to login first"));
	console.log("Reviewing Questions");
	clearMessages();
	socket.emit('getCatsRequest',QM.qmid);
}

function getqs() {
	if(!QM)	return($('#error').text("You need to login first"));
//	console.log("Getting Questions");
	clearMessages();
	var cat = $('#qcat option:selected').val();		// get the selected category
	socket.emit('getQuestionsByCatRequest',QM.qmid,cat);	
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
//		console.log("Super successfully signed in: "+JSON.stringify(userinfo));
	}
	else {
		$("#error").text("Login not valid");
	}
});

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

function actionFormatter(value, row, index) {
    return [
      '<a class="edit" href="javascript:void(0)" title="Edit">',
		'<img src="images/gears40.png" alt="edit"',
	  '</a>',
	  '<a class="delete" href="javascript:void(0)" title="Delete">',
		'<img src="images/trash40.png" alt="trash"',
	  '</a>'
    ].join('');
}

window.operateEvents = {
    'click .edit': function (e, value, row, index) {
		window.open("qedit.html?qid="+row.qid, '_blank');
	},
	'click .delete': function (e, value, row, index) {
	  if(confirm('Are you sure you want to delete this question: ' + JSON.stringify(row.gamename))) {
		  socket.emit('deleteQuestionRequest',QM.qmid,row);
	  }
	}
}
