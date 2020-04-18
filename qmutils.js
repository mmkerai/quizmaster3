//var socket = io.connect();
var socket = io('', {
	'reconnection': true,
    'reconnectionDelay': 1000,
    'reconnectionAttempts': 5
});

var $table,$select;

const version = "QM v0.6";
//const GOOGLE_CLIENT_ID="132511972968-co6rs3qsngvmc592v9qgreinp1q7cicf.apps.googleusercontent.com";
const GOOGLE_CLIENT_ID="132511972968-ubjmvagd5j2lngmto3tmckdvj5s7rc7q.apps.googleusercontent.com";
var auth2; // The Sign-In object.
var googleUser; // The current user.

/**
 * Calls startAuth after Sign in V2 finishes setting up.
 */
var appStart = function() {
	gapi.load('auth2', initSigninV2);
  };
  
/**
 * Initializes Signin v2 and sets up listeners.
 */
var initSigninV2 = function() {
	auth2 = gapi.auth2.init({
		client_id: GOOGLE_CLIENT_ID,
		scope: 'profile'
	});

	// Listen for sign-in state changes.
	auth2.isSignedIn.listen(signinChanged);

	// Listen for changes to current user.
	auth2.currentUser.listen(userChanged);  

	// Sign in the user if they are currently signed in.
	if (auth2.isSignedIn.get() == true) {
		auth2.signIn();
	}

	// Start with the current live values.
	refreshValues();
}
/**
 * Listener method for sign-out live value.
 * @param {boolean} val the updated signed out state.
 */
var signinChanged = function(val) {
	console.log('Signin state changed to ', val);
}

/**
 * Listener method for when the user changes.
 *
 * @param {GoogleUser} user the updated user.
 */
var userChanged = function (user) {
	console.log('User now: ', user);
	googleUser = user;
	updateGoogleUser();
	document.getElementById('curr-user-cell').innerText =
	  JSON.stringify(user, undefined, 2);
  };

  /**
 * Updates the properties in the Google User table using the current user.
 */
var updateGoogleUser = function () {
/* 	if (googleUser) {
		document.getElementById('user-id').innerText = googleUser.getId();
		document.getElementById('user-scopes').innerText =
		googleUser.getGrantedScopes();
		document.getElementById('auth-response').innerText =
		JSON.stringify(googleUser.getAuthResponse(), undefined, 2);
	} else {
		document.getElementById('user-id').innerText = '--';
		document.getElementById('user-scopes').innerText = '--';
		document.getElementById('auth-response').innerText = '--';
	} */
};

/**
 * Retrieves the current user and signed in states from the GoogleAuth
 * object.
 */
var refreshValues = function() {
	if (auth2){
		console.log('Refreshing values...');
		googleUser = auth2.currentUser.get();

		document.getElementById('curr-user-cell').innerText =
		JSON.stringify(googleUser, undefined, 2);
		document.getElementById('signed-in-cell').innerText =
		auth2.isSignedIn.get();
		updateGoogleUser();
	}
}

function onRegister(googleUser) {
	var profile = googleUser.getBasicProfile();
	console.log('Register request: ' + profile.getEmail());
	var id_token = googleUser.getAuthResponse().id_token;
//	console.log("ID Token: " + id_token);
	socket.emit('registerRequest',id_token);
	clearMessages();
}

function onSignIn(googleUser) {
	var profile = googleUser.getBasicProfile();
	console.log("ID: " + profile.getId()); // Don't send this directly to your server!
	console.log('Logged in: ' + profile.getName());
	var id_token = googleUser.getAuthResponse().id_token;
//	console.log("ID Token: " + id_token);
	socket.emit('loginRequest',id_token);
	clearMessages();
}

function signOut() {
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		console.log('User signed out.');
		socket.emit('logoutRequest',"");
		setDefaultValues();
	});
}

// This is only for testing without using Google login
function checksignedin() {
/* 	QM = JSON.parse(sessionStorage.getItem("QM"));
	if(QM.qmname)
		socket.emit('TestLoginRequest',QM.qmname);
	clearMessages(); */
}

function clearMessages() {
	$("#error").text("");
	$("#message1").text("");
	$("#message2").text("");
}

function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

socket.on('disconnect', function () {
	socket.emit('logoutRequest',"");
});

socket.on('infoResponse', function(data) {
	$("#message1").text(data);
});

socket.on('errorResponse',function(data) {
	$('#error').text(data);
});

socket.on('gameSetupErrorResponse',function(data) {
	$('#setupgameerror').text(data);
});

socket.on('loginResponse', function(userinfo) {
	if(userinfo) {
		QM = userinfo;	// save the user info
		$('#username').text(userinfo.name);
		$('#userimg').attr("src",userinfo.imageUrl);
		$('#signinbutton').hide();
		$('#signoutbutton').show();
		$('#username').show();
		$('#userimg').show();
		$("#error").text("");
		setPostLoginValues();
		$('#registerlabel').hide();
		console.log("User successfully signed in: "+JSON.stringify(userinfo));
//		getUserInfo(userinfo);
	}
	else {
		$("#error").text("Login not valid");
	}
});

socket.on('registerResponse', function(userinfo) {
	if(userinfo) {
		QM = userinfo;	// save the user info
		console.log("User successfully signed in: "+JSON.stringify(userinfo));
		window.location.href = "admin.html";
	}
	else {
		$("#error").text("User already registered");
	}
});

socket.on('getUserInfoResponse', function(userinfo) {
	if(userinfo) {
		$('#cxbuser').show();
		$("#uname").text(userinfo.name);
		$("#uemail").text(userinfo.email);
		$("#uappid").text(userinfo.app_id);
		$("#uapikey").text(userinfo.api_key);
		$("#uapirequests").text(userinfo.api_requests);
	}
	else {
		$("#error").text("User auth error");
	}
});

/* socket.on('getCatsResponse',function(cats) {
	let items = Object.getOwnPropertyNames(cats);
	console.log(items);
	$('select[name="qcat"]').empty();
	$('select[name="qsubcat"]').empty();
	//First entry in dropdown
	$('select[name="qcat"]').append($('<option>', {
			value: "select",
			text : "select a category"
		}));
	// subsequent entries in dropdown
	$.each(items,function(i,item) {
    $('select[name="qcat"]').append($('<option>', {
        value: item,
        text : item
    	}));
		});
	$('select[name="qcat"] option:selected').attr('disabled','disabled');
}); */

socket.on('getCatsResponse',function(cats) {
	let items = Object.getOwnPropertyNames(cats);
	console.log(items);
	$('#qcat').empty();
	$('#qsubcat').empty();
	//First entry in dropdown
	$('#qcat').append($('<option>', {
			value: "select",
			text : "select a category"
		}));
	// subsequent entries in dropdown
	$.each(items,function(i,item) {
    	$('#qcat').append($('<option>', {
        value: item,
        text : item
    	}));
	});
	$('#qcat option:selected').attr('disabled','disabled');
});

socket.on('getSubcatsResponse',function(subcats) {
	console.log(subcats);
	$('#qsubcat').empty();
	for(const item of subcats) {
    	$('#qsubcat').append($('<option>', {
        value: item,
        text : item
    	}));
	}
});

function getqs() {
	if(!QM)	return($('#error').text("You need to login first"));

	console.log("Getting Questions");
	$("#error").text("");
	$('#qtable').show();
	socket.emit('getQuestionsRequest',QM.qmid);	
}

// Bootstrap table
socket.on('getQuestionsResponse', function(qlist) {
	console.log(qlist);
	$table.bootstrapTable({data: qlist});
});

socket.on('getDiffsResponse', function(diffs) {
	$('#qdiff').empty();
	let items = Object.getOwnPropertyNames(diffs);
	$.each(items, function(i, item) {
    	$('#qdiff').append($('<option>', {
			value: item,
			text : item
    	}));
	});
});

socket.on('getQuestionTypesResponse', function(types) {
	$('#qtype').empty();
	let items = Object.getOwnPropertyNames(types);
	$.each(items, function(i, item) {
    	$('#qtype').append($('<option>', {
			value: item,
			text : item
    	}));
	});
});

socket.on('announcement',function(message) {
	$('#qheader').text(message);
});

socket.on('endOfGame', function() {
	$('#qheader').text("End of Game");
	delCookie("quizmaster");
});

function getUserInfo(user) {
	clearMessages();
	socket.emit('getUserInfoRequest',user.uid);
}

function readCookie(name)
{
  name += '=';
  var parts = document.cookie.split(/;\s*/);
  for (var i = 0; i < parts.length; i++)
  {
    var part = parts[i];
    if (part.indexOf(name) == 0)
      return part.substring(name.length);
  }
  return null;
}

/*
 * Saves a cookie for delay time. If delay is blank then no expiry.
 * If delay is less than 100 then assumes it is days
 * otherwise assume it is in seconds
 */
function saveCookie(name, value, delay)
{
  var date, expires;
  if(delay)
  {
	  if(delay < 100)	// in days
		  delay = delay*24*60*60*1000;	// convert days to milliseconds
	  else
		  delay = delay*1000;	// seconds to milliseconds
	  
	  date = new Date();
	  date.setTime(date.getTime()+delay);	// delay must be in seconds
	  expires = "; expires=" + date.toGMTString();		// convert unix date to string
  }
  else
	  expires = "";
  
  document.cookie = name+"="+value+expires+"; path=/";
}

/*
 * Delete cookie by setting expiry to 1st Jan 1970
 */
function delCookie(name) 
{
	document.cookie = name + "=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/";
}
