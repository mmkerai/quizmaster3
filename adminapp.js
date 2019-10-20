/* Node.js test
 * This is the admin app for main app. Has DB stuff
 */
// Version 2.0
var http = require('http');
var https = require('https');
var app = require('express')();
var bodyParser = require('body-parser');
var app = require('express')();
var	server = http.createServer(app);
var	io = require('socket.io')(server);
var fs = require('fs');
const rln = require('readline');
const db = require('./DBfunctions.js');
const qm = require('./QMfunctions.js');
const {OAuth2Client} = require('google-auth-library');
//require('@google-cloud/debug-agent').start();
var dbt = new db();
var qmt = new qm();

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


//********** set the port to use
const PORT = process.env.PORT || 3000;
server.listen(PORT);
console.log("Dir path: "+__dirname);
//*****Globals *************
const GOOGLE_CLIENT_ID = "132511972968-ubjmvagd5j2lngmto3tmckdvj5s7rc7q.apps.googleusercontent.com";
const SUPERADMIN = "thecodecentre@gmail.com";
var AUTHUSERS = new Object(); // keep list of authenticated users by their socket ids
var QMSockets = new Object(); // keep list of socket ids for each quizmaster

const QFile = "test.json";
//const QFile = "QMQuestions.json";
const QIDSTART = 2178;
const QMIDSTART = 3141597;
var QIDLast = QIDSTART;
var QMIDLast = QMIDSTART;
var NewCats = new Object();
const oauthclient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.get('/*.js', function(req, res){
  res.sendFile(__dirname + req.path);
}); 
app.get('/*.css', function(req, res){
  res.sendFile(__dirname + req.path);
}); 
app.get('/sadmin.html', function(req, res){
    res.sendFile(__dirname + req.path);
});
app.get('/qedit.html', function(req, res){
  res.sendFile(__dirname + req.path);
});
/*
process.on('uncaughtException', function (err) {
  console.log('Exception: ' + err);
});
*/
console.log("Server started on port "+PORT);
//qmt.testDL();
//qmt.testAns();

// Set up socket actions and responses
io.on('connection',function(socket) {
//  console.log("Socket id: "+socket.id);
  socket.on('disconnect',function () {
    removeSocket(socket.id,"disconnect");
  });

  socket.on('end',function() {
    removeSocket(socket.id,"end");
  });

  socket.on('connect_timeout', function() {
    removeSocket(socket.id,"timeout");
  });
/*
  socket.on('loginRequest',function(token) {
    async function verify() {
      const ticket = await oauthclient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      console.log("sub is "+payload['sub']);
//      console.log(payload);
//      if(SUPERADMIN == payload['email']) {
//        console.log("Superadmin signed in: "+socket.id);
          dbt.getQMByEmail(payload,socket);
//        AUTHUSERS[socket.id] = obj.email;
//          socket.emit('loginResponse',payload.name);
      }
//        else
//          socket.emit('errorResponse',"Login failed, please register");
/*      }
      else {
        AUTHUSERS[socket.id] = false;
        autherror(socket);
      }
    verify().catch(console.error);
  });
*/

  /*
  * This is for localhost testing without authentication
  */
  socket.on('loginRequest',function() {
    AUTHUSERS[socket.id] = true;
    let qm = new Object();
    qm['qmname'] = "TCC-Admin";
    socket.emit("SignInSuperResponse",qm);
  });

  // This is for proper login
  socket.on('SignInSuperRequest',function() {
    AUTHUSERS[socket.id] = true;
    let qm = new Object();
    qm['qmname'] = "TCC-Admin";
    socket.emit("SignInSuperResponse",qm);
  });

  socket.on('logoutRequest',function(token) {
    AUTHUSERS[socket.id] = false;
    console.log("Logged out: "+socket.id)
    autherror(socket,"Logged out");
  });

	socket.on('loadQuestionsRequest',function(filename) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    const str = "Loading Questions to DB from file "+QFile;
		console.log(str);
    loadquestions(QFile,socket);
		socket.emit('infoResponse',str);
  });

  socket.on('createTestQMasterRequest',function(filename){
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    qmt.createTestQM(socket,QMIDLast++);
  });

  socket.on('createTestAppRequest',function() {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    qmt.createTestApp(socket);
  });

  socket.on('getCatsRequest',function(qmid) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    console.log("Getting categories");
    let qcat = qmt.getCategories();
//    console.log("Categories are: "+qcat);
		socket.emit('getCatsResponse',qcat);
  });

  socket.on('getSubcatsRequest',function(cat) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    let qsubcat = qmt.getSubCategories(cat);
		socket.emit('getSubcatsResponse',qsubcat);
  });

  socket.on('getDiffsRequest',function(qmid){
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    let qdiff = qmt.getDifficulties();
		socket.emit('getDiffsResponse',qdiff);
  });

  socket.on('getQuestionTypesRequest',function(qmid) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    let qtype = qmt.getQuestionTypes();
		socket.emit('getQuestionTypesResponse',qtype);
  });

  socket.on('getGameTypesRequest',function(qmid) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    let qtype = qmt.getGameTypes();
		socket.emit('getGameTypesResponse',qtype);
  });

  socket.on('getQuestionsByCatandSubcat',function(qmid,cat,subcat) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
//    console.log("Getting questions for category: "+cat+":"+subcat);
    dbt.getQuestionsByCatandSubcat(cat,subcat,function(qlist) {
      socket.emit("getQuestionsResponse",qlist);
    });
  });

  socket.on('getQuestionByIdRequest',function(qid) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
//    console.log("Getting question with ID: "+qid);
    dbt.getQuestionById(qid,function(question) {
      //    console.log(question);
      socket.emit("getQuestionByIdResponse",question);
    });
 });

  socket.on('updateQuestionRequest',function(qobj) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
//    console.log("Updating question with ID: "+qobj.qid);
    let obj = qmt.verifyquestion(qobj);  // check that question has correct values
    if(obj != null) {
      dbt.updateQuestion(obj,function(res) {
//        console.log("Successfully updated");
        socket.emit("updateQuestionResponse","Question Updated: "+res.qid);
      });
    }
  });

// get all questions for a game
  socket.on('getQuestionsRequest',function(game) {
    if(AUTHUSERS[socket.id] != game.qmid) return(autherror(socket));
    let qlist = qmt.getGameQuestions(game);
      socket.emit('getQuestionsResponse',qlist);
//      console.log('qlist: '+JSON.stringify(qlist));
  });

}); //end of io.on

/*******************************************
/* Functions below this point
********************************************/
function removeSocket(id,evname) {
		console.log("Socket "+id+" "+evname+" at "+ new Date().toISOString());
    delete AUTHUSERS[id];
}

function loadquestions(file,socket) {

    dbt.clearAllQuestions();
    QIDLast = QIDSTART;    // reset question id
    var rd = rln.createInterface({
        input: fs.createReadStream(file),
        console: false
    });

    rd.on('line', function(line) {
//      collectCats(line);
      let qobj = qmt.validatequestion(line,QIDLast);  // check that questions have correct values
      if(qobj != null) {
        dbt.insertQuestion(qobj);
        QIDLast++;       // increment last question id - ready for the next one
      }
    });

    rd.on('close', function() {
      dbt.getNumQuestions(function(num) {
        socket.emit('infoResponse',"Questions loaded: "+num);
      });
//      dbt.getNumQuestionsByCat("",socket);
//      console.log(JSON.stringify(NewCats));
  });
}

function autherror(socket,msg) {
  if(!msg)
    msg = "Please login as admin";
  socket.emit("errorResponse",msg);
}

function collectCats(str) {
  let scexists = 0;
  let subcats = new Array();
  let obj = JSON.parse(str,'utf8');
  if(NewCats[obj.Category.toUpperCase()]) {
    subcats = NewCats[obj.Category.toUpperCase()];
    for(var i in subcats) {
      if(subcats[i] == obj.Subcategory.toUpperCase())
        scexists = 1;         // sub cat already in array
    }
    if(scexists == 0) {   // sub cat doesnt exist so add it to this Category
      subcats.push(obj.Subcategory.toUpperCase());
      NewCats[obj.Category.toUpperCase()] = subcats;
    }
  }
  else {    // category doesnt exist so add both category and subcategory
    subcats.push(obj.Subcategory.toUpperCase());
    NewCats[obj.Category.toUpperCase()] = subcats;
  }
}
