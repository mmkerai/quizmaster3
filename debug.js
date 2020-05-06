var QM = new Object();

$(document).ready(function() {
	setDefaultValues();
	$table = $('#acgtable');
	$select = $('#myselect');
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

function viewag() {
	if(isEmpty(QM))	return($('#error').text("You need to login first"));
	clearMessages();
	console.log("Getting active games");
	socket.emit('getActiveGamesRequest',QM.qmid);	
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
//		console.log("Super successfully signed in: "+JSON.stringify(userinfo));
	}
	else {
		$("#error").text("Login not valid");
	}
});

socket.on('getActiveGamesResponse', function(glist) {
	console.log(glist);
	$('#agtable').show();
	$table.bootstrapTable({data: glist});
	$table.bootstrapTable('load', glist);
});

function setDefaultValues() {
	$('#version').text(version);
	$('#username').hide();
	$('#userimg').hide();
	$('#signoutbutton').hide();
	$('#signinbutton').show();
	$('#agtable').hide();
	clearMessages();
	console.log("Doc ready");
}

function setPostLoginValues() {
	$('#gameplay').show();

}