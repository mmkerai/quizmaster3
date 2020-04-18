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

function onSignInSuper(googleUser) {
	var profile = googleUser.getBasicProfile();
	console.log("ID: " + profile.getId()); // Don't send this directly to your server!
	console.log('Logged in: ' + profile.getName());
	var id_token = googleUser.getAuthResponse().id_token;
//	console.log("ID Token: " + id_token);
	socket.emit('loginSuperRequest',id_token);	// this is for super admin only
	clearMessages();
}

function loadq() {
	console.log("Loading Questions");
	$("#error").text("");
	socket.emit('loadQuestionsRequest',QM.qmid);
}

function reviewq() {
	if(!QM)	return($('#error').text("You need to login first"));
	console.log("Reviewing Questions");
	$("#error").text("");
	socket.emit('getCatsRequest',QM.qmid);
}

/* function getqs() {
	if(!QM)	return($('#error').text("You need to login first"));

	console.log("Getting Questions");
	$("#error").text("");
	$('#qtable').show();
	socket.emit('getQuestionsRequest',QM.qmid);	
}
 */
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
		console.log("Super successfully signed in: "+JSON.stringify(userinfo));
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