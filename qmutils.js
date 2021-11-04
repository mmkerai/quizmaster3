//var socket = io.connect();
var socket = io('', {
	'reconnection': true,
    'reconnectionDelay': 5000,
    'reconnectionAttempts': 5
});

var $table;

const version = "QM v0.96";
var auth2; // The Sign-In object.
var googleUser; // The current user.
var countdownsound = new Audio('audio/countdown.mp3');
var qcountsound = new Audio('audio/questionwait.mp3');
var newcontestantsound = new Audio('audio/smsalert3.mp3');
// Chart.defaults.global.animation.duration = 3000;	// chart.js is used for scores
// Chart.defaults.global.legend.position = "bottom";

/**
 * Calls startAuth after Sign in V2 finishes setting up.
 */
// var appStart = function() {
// 	gapi.load('auth2', initSigninV2);
//   };
  
/**
 * Initializes Signin v2 and sets up listeners.
 */
// var initSigninV2 = function() {
// 	auth2 = gapi.auth2.init({
// 		client_id: GOOGLE_CLIENT_ID,
// 		scope: 'profile'
// 	});

// 	// Listen for sign-in state changes.
// 	auth2.isSignedIn.listen(signinChanged);

// 	// Listen for changes to current user.
// 	auth2.currentUser.listen(userChanged);  

// 	// Sign in the user if they are currently signed in.
// 	if (auth2.isSignedIn.get() == true) {
// 		auth2.signIn();
// 	}

// 	// Start with the current live values.
// 	refreshValues();
// }
// /**
//  * Listener method for sign-out live value.
//  * @param {boolean} val the updated signed out state.
//  */
// var signinChanged = function(val) {
// 	console.log('Signin state changed to ', val);
// }

// /**
//  * Listener method for when the user changes.
//  *
//  * @param {GoogleUser} user the updated user.
//  */
// var userChanged = function (user) {
// 	console.log('User now: ', user);
// 	googleUser = user;
// 	updateGoogleUser();
// 	document.getElementById('curr-user-cell').innerText =
// 	  JSON.stringify(user, undefined, 2);
//   };

//   /**
//  * Updates the properties in the Google User table using the current user.
//  */
// var updateGoogleUser = function () {
// /* 	if (googleUser) {
// 		document.getElementById('user-id').innerText = googleUser.getId();
// 		document.getElementById('user-scopes').innerText =
// 		googleUser.getGrantedScopes();
// 		document.getElementById('auth-response').innerText =
// 		JSON.stringify(googleUser.getAuthResponse(), undefined, 2);
// 	} else {
// 		document.getElementById('user-id').innerText = '--';
// 		document.getElementById('user-scopes').innerText = '--';
// 		document.getElementById('auth-response').innerText = '--';
// 	} */
// };

// /**
//  * Retrieves the current user and signed in states from the GoogleAuth
//  * object.
//  */
// var refreshValues = function() {
// 	if (auth2){
// 		console.log('Refreshing values...');
// 		googleUser = auth2.currentUser.get();

// 		document.getElementById('curr-user-cell').innerText =
// 		JSON.stringify(googleUser, undefined, 2);
// 		document.getElementById('signed-in-cell').innerText =
// 		auth2.isSignedIn.get();
// 		updateGoogleUser();
// 	}
// }

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
	// console.log("ID: " + profile.getId()); // Don't send this directly to your server!
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
		location.reload();
	});
}

function clearMessages() {
	$("#error").text("");
	$("#message1").text("");
	$('#setupgameerror').text("");
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
		$('#registerlabel').hide();
//		console.log("User successfully signed in: "+JSON.stringify(userinfo));
		setPostLoginValues();
	}
	else {
		$("#error").text("Login not valid");
		console.log("User signed in failure");
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

socket.on('getCatsResponse',function(cats) {
	let items = Object.getOwnPropertyNames(cats);
//	console.log(items);
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
//	console.log(subcats);
	$('#qsubcat').empty();
	for(const item of subcats) {
    	$('#qsubcat').append($('<option>', {
        value: item,
        text : item
    	}));
	}
});

// Bootstrap table
socket.on('getQuestionsResponse', function(qlist) {
//	console.log(qlist);
	$('#qtable').show();
	$table.bootstrapTable({data: qlist});
	$table.bootstrapTable('load', qlist);
});

socket.on('getGameQuestionsResponse', function(qlist) {
	//	console.log(qlist);
		$gqtable.bootstrapTable({data: qlist});
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

socket.on('getGameTypesResponse', function(types) {
	$('#qmgtype').empty();
	let items = Object.getOwnPropertyNames(types);
	$.each(items, function(i, item) {
    	$('#qmgtype').append($('<option>', {
			value: item,
			text : item
    	}));
	});
});

socket.on('announcement',function(message) {
	$('#qheader').text(message);
});

// This is called when a new contestant joins the game
// con is an array of contestant names
socket.on('contestantUpdate',function(con) {
	//	console.log("Contestants:"+con);
		newcontestantsound.play();
		$('#numusers').text(Object.keys(con).length);
		let ulist = "";
		for(var i in con) {
			ulist = ulist + con[i].cname +"<br/>";
		}
		$('#userlist').html(ulist);
	
		$('#users').empty();	// remove all old buttons (usernames)
		for(var i in con) {		// start afresh with user list
			var button = document.createElement('button');
			button.innerText = con[i].cname;
			button.className = "btn btn-primary";
			document.getElementById('users').appendChild(button);
		}
	});
	
socket.on('timeUpdate',function(message) {
//	$('#timer').text(message);
	if(message == 0) {
		hideCountdown();
//		$('#countdownsound').get(0).pause();
	} else {
		showCountdown();
		$('#timer').text(message);
//		$('#countdownsound').get(0).play();
	}
});

socket.on('audioUpdate',function(sobj) {
	if(sobj.type == 'prequestion') {
		if(sobj.action == 'start')
			countdownsound.play();
		else
			countdownsound.pause();		// type must be stop
	}
	else if(sobj.type == 'postquestion') {
		if(sobj.action == 'start')
			qcountsound.play();
		else
			qcountsound.pause();		// type must be stop
	}
});

socket.on('endOfGame', function() {
	$('#qheader').text("End of Game");
	deleteCookie("quizmaster");
});

var scores;
socket.on('scoresUpdate',function(cpoints) {
	$('#scores').show();
	var cons = [];
	var pts = [];
	cpoints.forEach(c => {
		cons.push(c.cname);
		pts.push(c.points);
	})
	var ctx = $('#scores');
	var cconfig = {
		type: 'horizontalBar',
		data: {
			labels: cons,
			datasets: [{
				barPercentage: 0.9,
        		barThickness: "flex",
        		maxBarThickness: 40,
        		minBarLength: 2,
				label: 'Points',
				data: pts,
				backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"],
				borderWidth: 2
			}]
		},
		options: {
			scales: {
				xAxes: [{
					ticks: {
				  	beginAtZero: true
					}
			  	}]
			}
		}
	};
	if(scores != undefined) {
		scores.config = cconfig;
		scores.update();
	}
	else {
		scores = new Chart(ctx, cconfig);
	}
});

socket.on('getPopularQuizesResponse',function(quizes) {
//	console.log(quizes);
	var mobile = false;
	var maxcol;
	var pnum = 3;		// start with 1 less than maxcol so it creates the first row
	if(isMobileDevice())		// check if this is a mobile device so reduce to one column
		maxcol = 1;
	else
		maxcol = 4;
 
//	console.log("mobile is "+maxcol);
	$('#play').hide();
	$('#popular').show();
	var newrow;
	quizes.forEach(quiz => {
		pnum++;
		if(pnum % maxcol == 0)	{	// need a new row
			newrow = document.createElement("tr")
		}
		var node = document.createElement("td");
		node.setAttribute("class","popquiz");
		node.setAttribute("onClick","playself('"+quiz.accesscode+"')");
		var tdiv = document.createElement("div");
		tdiv.setAttribute("class","gameitem");
		var img = document.createElement("img");
		img.setAttribute("class","gicon");
		img.setAttribute("src",quiz.gameicon);
//		img.setAttribute("alt","quiz icon");
		var pn = document.createElement("p");	// quiz name
		pn.className = "gamename";
		var pntext = document.createTextNode(quiz.gamename);
		pn.appendChild(pntext);
		var pd = document.createElement("p");	// quiz description
		pd.className = "gamedesc";
		pntext = document.createTextNode(quiz.gamedesc);
		pd.appendChild(pntext);
		var like = document.createElement("img");	// likes
		like.setAttribute("src","images/h3.png");
		var lnum = document.createElement("span");	// num of likes
		var likes = quiz.likes || 1;
		pntext = document.createTextNode(likes);
		lnum.appendChild(pntext);
		tdiv.appendChild(img);
		tdiv.appendChild(pn);
		tdiv.appendChild(pd);
		tdiv.appendChild(like);
		tdiv.appendChild(lnum);
		node.appendChild(tdiv);
		newrow.appendChild(node);
		if(pnum % maxcol == 0)	{	// need a new row
			document.getElementById("poptable").appendChild(newrow);
		}
	});
});
	
// Create a new nav tab and navigate to it
function createNewNavTab(label,id,link) {
	var node = document.createElement("LI");	// Create a <li> node
    node.setAttribute("class","nav-item");
	var anc = document.createElement("a");	// Create a <a> node
	anc.innerText = label;
    anc.setAttribute("class","nav-link");
    anc.setAttribute("id",id);
    anc.setAttribute("data-toggle","tab");
    anc.setAttribute("href",link);
    anc.setAttribute("role","tab");
	node.appendChild(anc);
	document.getElementById("mynavtabs").appendChild(node);
}

// Check if a play nav tab already open
function checkPlayNavTab() {
	var tab;
	var navtabs = document.getElementsByClassName("nav-link");
	navtabs.forEach(function(value,index) {
		tab = navtabs[index].getAttribute("href");
		console.log("NavTab: "+tab);
		if(tab.includes("play")) {	// return true if valid
			console.log("true");
			return(true);	
		}
	});
	return(false);
}

// clear form fields before showing new game setup menu
function clearGameSetup() {
	$('#qmgname').val("");
	$('#qmgquestions').val("");
	$('#qmgtime').val(20);
	$('#qmgtype').val("");
	$gqtable.bootstrapTable('removeAll');
}

// Create a question table
function createQuestionTable(divid,tableid) {
	var str = `
		<table
			id="`+tableid+`"
			class="table table-striped"
			data-toggle="questiontable"
			data-side-pagination="server">
			<thead class="thead-light">
			<tr>
				<th data-field="qid">ID</th>
				<th data-field="category">Category</th>
				<th data-field="subcategory">Subcategory</th>
				<th data-field="difficulty">Difficulty</th>
				<th data-field="type">Type</th>
				<th data-field="question">Question</th>
				<th data-field="answer">Answer</th>
				<th data-field="imageurl" data-width="132" data-formatter="questionFormatter">Image</th>
			</tr>
			</thead>
		</table>`;
//	console.log(str);
	document.getElementById(divid).innerHTML = str;
}

function showCountdown() {
	document.getElementById("timer").style.display = "block";
}
  
  function hideCountdown() {
	document.getElementById("timer").style.display = "none";
}

function isEmpty(obj) {
    return !obj || Object.keys(obj).length === 0;
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
function deleteCookie(name) 
{
	document.cookie = name + "=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/";
}

function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}
