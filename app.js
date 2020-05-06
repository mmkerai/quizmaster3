/* Node.js test
 * This script should run under Node.js on local server
 */
// Version 2.0
var http = require('http');
var bodyParser = require('body-parser');
var app = require('express')();
var	server = http.createServer(app);
var	io = require('socket.io')(server);
const fs = require('fs');
const rln = require('readline');
const {OAuth2Client} = require('google-auth-library');

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

const db = require('./DBfunctions.js');
const qm = require('./QMfunctions.js');
//require('@google-cloud/debug-agent').start();
var dbt = new db();
var qmt = new qm();

//********** set the port to use
const PORT = process.env.PORT || 3000;
server.listen(PORT);
console.log("Dir path: "+__dirname);
//*****Globals *************
//const GOOGLE_CLIENT_ID="132511972968-co6rs3qsngvmc592v9qgreinp1q7cicf.apps.googleusercontent.com";
const GOOGLE_CLIENT_ID="132511972968-ubjmvagd5j2lngmto3tmckdvj5s7rc7q.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "xx";
const oauthclient = new OAuth2Client(GOOGLE_CLIENT_ID);
//const SUPERADMIN = "thecodecentre@gmail.com";
const SUPERADMIN = "103301973641709867567"; //google id for thecodecentre@gmail.com
var AUTHUSERS = new Object(); // keep list of authenticated users by their socket ids
var SUPERUSERS = new Object(); // keep list of authenticated super users by their socket ids
const QFile = "";
//const QFile = "QMQuestions2.json";
const QIDSTART = 3626;
const GCOUNTDOWNTIME = 5;   // countdown in seconds before each question
var NewCats = new Object();
const IMAGEURL = "http://tropicalfruitandveg.com/quizmaster/";

app.get('/*', function(req, res){
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
  AUTHUSERS[socket.id] = 999;   // initialise with a number
  SUPERUSERS[socket.id] = 999;   // initialise with a number

  socket.on('disconnect',function () {
    removeSocket(socket.id,"disconnect");
  });

  socket.on('end',function() {
    removeSocket(socket.id,"end");
  });

  socket.on('connect_timeout', function() {
    removeSocket(socket.id,"timeout");
  });

  // only used by super admin. Hard coded to tcc
  socket.on('loginSuperRequest',function(token) {
    async function verify() {
      const ticket = await oauthclient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
//      console.log(payload);
      var user;
      if(payload.sub == SUPERADMIN) {
          console.log("Super admin logged in: "+payload.given_name+" at "+ new Date().toISOString());
          SUPERUSERS[socket.id] = payload.sub; // this is the google user ID
          AUTHUSERS[socket.id] = payload.sub; // this is the google user ID
          user = {qmid: payload.sub,name: payload.given_name, imageUrl: payload.picture};
        }
        else {
          user = null;
          console.log("Super admin login error");
        }
        socket.emit('loginSuperResponse',user);
    }
    verify().catch(console.error);
  });

  // only used by super admin. Hard coded to tcc
  socket.on('getActiveGamesRequest',function(uid) {
    if(SUPERUSERS[socket.id] != uid) return(autherror(socket));
      socket.emit('getActiveGamesResponse',qmt.getAllActiveGames());
  });

  socket.on('registerRequest',function(token) {
    async function verify() {
      const ticket = await oauthclient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
//        console.log(payload);
      var user;
      dbt.checkQMaster(payload.sub,function(exists) {
        if(exists) {  // user already in the DB
          socket.emit('registerResponse',null);
        }
        else { // not in DB so add it
          var newQM = new qmt.createQMaster(payload);
          dbt.newQMaster(newQM,function(valid) {
            if(valid) {
              AUTHUSERS[socket.id] = payload.sub;
              user = {qmid: payload.sub,name: payload.given_name, imageUrl: payload.picture};
            }
            else {
              user = null;
            }
            socket.emit('registerResponse',user);
          });
       }
     });
    }
    verify().catch(console.error);
  });

  socket.on('loginRequest',function(token) {
    async function verify() {
      const ticket = await oauthclient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
//      console.log(payload);
      var user;
      dbt.checkQMaster(payload.sub,function(valid) {
        if(valid) {
          AUTHUSERS[socket.id] = payload.sub;
          user = {qmid: payload.sub,name: payload.given_name, imageUrl: payload.picture};
       }
       else {
         user = null;
       }
        socket.emit('loginResponse',user);
      });
    }
    verify().catch(console.error);
  });

  socket.on('logoutRequest',function() {
    AUTHUSERS[socket.id] = 0;
    console.log("Logged out: "+socket.id)
    autherror(socket,"Logged out");
  });

  socket.on('getUserInfoRequest',function(uid) {
    if(AUTHUSERS[socket.id] != uid) return(autherror(socket));
    dbt.getUserInfo(uid,function(uinfo) {
      socket.emit('getUserInfoResponse',uinfo);
    });
  });    

  // Only allowed by Super admin
  socket.on('loadQuestionsRequest',function(qmid) {
    if(SUPERUSERS[socket.id] != qmid) return(autherror(socket));
    const str = "Loading Questions to DB from file "+QFile;
		console.log(str);
    loadquestions(QFile,socket);
		socket.emit('infoResponse',str);
  });

  socket.on('getCatsRequest',function(qmid){
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    let qcat = qmt.getCategories();
 //   console.log("Categories are: "+JSON.stringify(qcat));
		socket.emit('getCatsResponse',qcat);
  });

  socket.on('getSubcatsRequest',function(qmid,cat){
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
//    console.log("Get subcats for "+cat);
    let qsubcat = qmt.getSubCategories(cat);
		socket.emit('getSubcatsResponse',qsubcat);
  });

  socket.on('getDiffsRequest',function(qmid){
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    let qdiff = qmt.getDifficulties();
		socket.emit('getDiffsResponse',qdiff);
  });

  socket.on('getQuestionTypesRequest',function(qmid){
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    let qtype = qmt.getQuestionTypes();
		socket.emit('getQuestionTypesResponse',qtype);
  });

  socket.on('getGameTypesRequest',function(qmid) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    let gtype = qmt.getGameTypes();
		socket.emit('getGameTypesResponse',gtype);
  });

// This should not be called during PROD as there are too many questions 
// Only allowed by Super admin
  socket.on('getQuestionsRequest',function(qmid,game) {
    if(SUPERUSERS[socket.id] != qmid) return(autherror(socket));
    console.log("Getting questions");
    dbt.getQuestions(function(qlist) {
      socket.emit('getQuestionsResponse',qlist);
    });
  });

  socket.on('getQuestionsByCatRequest',function(qmid,cat) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    console.log("Getting questions for category: "+cat);
    dbt.getQuestionsByCat(cat, function(qlist) {
      if(qlist.length > 0)
        socket.emit('getQuestionsResponse',qlist);
      else
        socket.emit('errorResponse',"No questions");
    });
  });

  socket.on('getQuestionByIdRequest',function(qmid,qid) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    console.log("Getting question with ID: "+qid);
    dbt.getQuestionById(qid,function(qm) {
      if(qm.length > 0) //make sure question id was valid
        socket.emit("getQuestionByIdResponse",qm[0]);
      else
        socket.emit('errorResponse',"Question ID not found");
    });
  });

  socket.on('updateQuestionRequest',function(qmid,qobj) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
//    console.log("Updating question with ID: "+qobj.qid);
    dbt.updateQuestion(qobj,function(status) {
      if(status)
        socket.emit("updateQuestionResponse","Question Updated");
      else
        socket.emit('errorResponse',"Question update error");
    });
  });

  socket.on('getGamesRequest',function(qmid) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    console.log("Getting Games for: "+qmid);
    dbt.getGames(qmid,function(games) {
      if(games.length > 0) {
        socket.emit('getGamesResponse',games);
      }
      else {
        console.log("No games for QM: "+qmid);
        socket.emit('errorResponse',"You have no games");
      }
    });
  });

// this event is used to prepare for game start.
// Needs to be called before starting play so players can join.
  socket.on('preGameStartRequest',function(qmid,gname) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    
    qmt.gameReady(qmid,gname,function(game) {
      if(!game)
        socket.emit("errorResponse","Game not found: "+gname);
      else {
      // Chuck everybody out of the room in case they were already there from previous game play      
        io.of('/').in(gname).clients((error, socketIds) => {
          if (error) throw error;
          socketIds.forEach(socketId => io.sockets.sockets[socketId].leave(gname));
        });
        socket.join(gname);
        socket.emit('preGameStartResponse',game);
        socket.emit('contestantUpdate',game.contestants);
      }
    });
  });

  socket.on('newGameRequest',function(qmid,game) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    if(!qmt.checkGameTypes(game.gametype))
      return(socket.emit("gameSetupErrorResponse","Invalid Game Type"));
    if(game.gamename.length < 6)
      return(socket.emit("gameSetupErrorResponse","Please use a name at least 6 chars long"));
    if(game.timelimit < 5)
      return(socket.emit("gameSetupErrorResponse","Time for each question should be at least 5 seconds"));

    game.questions = qmt.getQuestionList(game.questions);
    if(game.questions.length < 1)
      return(socket.emit("gameSetupErrorResponse","Question list error"));
    if(game.questions.length > 10)
      return(socket.emit("gameSetupErrorResponse","Maximum 10 questions allowed"));

// If existing game then update it else create new one.
// Game name needs to be unique per QM id (google user)
    dbt.gameExists(game,function(status) {
      let str = "";
      if(status) {  // game exists
        console.log("Updating game: "+game.gamename);
        dbt.updateGame(game,function(res) {
          if(res) // went well
            str = "Game updated: "+game.gamename;
          else
            str = "Game update error: "+game.gamename;

          socket.emit('newGameResponse',str);
        });
      }
      else {    // game doesnt exist so create new one
        console.log("Creating new game: "+game.gamename);
        dbt.createNewGame(game,function(res) {
          if(res) // went well
            str = "New Game created: "+game.gamename;
          else
            str = "Game error: "+game.gamename;

          socket.emit('newGameResponse',str);
        });
      }
     });
  });

  // called by quizmaster to delete a game
  socket.on('deleteGameRequest',function(qmid,game) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    dbt.deleteGame(game, function (status) {
      if(status)  // all good
        socket.emit("deleteGameResponse","Game deleted: "+game.gamename);
      else
        socket.emit("errorResponse","Error deleting "+game.gamename);
    });
  });

// called by quizmaster to start a game
  socket.on('startGameRequest',function(qmid,gameid) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    let game = qmt.getActiveGame(gameid);
    if(game) {
      socket.emit("startGameResponse",game);
      preQuestion(game);
    }
    else {
      socket.emit("errorResponse","Game not active or has finished");
    }
  });

// called by quizmaster to show next question
  socket.on('nextQuestionRequest',function(qmid,gameid) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    let game = qmt.getActiveGame(gameid);
    if(game) {
      game.cqno++;
      preQuestion(game);
    }
    else {
      socket.emit("errorResponse","Game not active or has finished");
    }
  });

// called by quizmaster to show latest scores
  socket.on('showScoresRequest',function(qmid,gname) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
//    let scores = [];
    let scores = qmt.getContestantScores(gname);   // current scores
/* // Test to see how score is displayed
    for(var i=0; i < 3; i++) {
      let c = new Object();
      c["cname"] = "con"+i;
      c["points"] = Math.random() * 100;
      scores.push(c);
    } */
    if(scores) {
      io.in(gname).emit('scoresUpdate',scores);
    }
    else {
      socket.emit("errorResponse","Game not active");
    }
  });

  // called by quizmaster to end the game
  socket.on('endGameRequest',function(qmid,gamename) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    qmt.endOfGame(gamename); //housekeeping
    io.in(gamename).emit('announcement','Quizmaster has ended the game!');
    socket.emit("endGameResponse","");
  });

// used by contestant to join game so no login/auth required
// if previously joined then there will be a token saved in a cookie
  socket.on('joinGameRequest',function(contestant) {
    if(!contestant.token) {
      if(!contestant.userid || !contestant.accesscode) {
        socket.emit("errorResponse","Please enter Nickname and Accesscode");
      }
      else {
        let game = qmt.getGameFromAccessCode(contestant.accesscode);
        if(game) {
          const con = qmt.joinGame(game,contestant);  // adds contestant to the game and return his details
          if(con) {   // all good
            contestant.gamename = game.gamename;  // set the game name back for front end UI
            contestant.token = con.token;
            console.log(contestant.userid+" Joining game "+game.gamename+":"+contestant.token);
            socket.join(game.gamename); // add contestant to the game room
            socket.emit("joinGameResponse",contestant); // confirm back to contestant
            // update everyone in the room
            io.in(game.gamename).emit('announcement','Please wait for the Quizmaster to start your game');
            io.in(game.gamename).emit('contestantUpdate',game.contestants);
//            io.to(QMSockets[game.qmid]).emit("contestantUpdate",game.contestants);  // tell the quizmaster
          }
          else {
            socket.emit("errorResponse","Name already in use, please try another");
          }
        }
        else {
          socket.emit("errorResponse","Access code invalid or game not started");
        }
      }
    }
    else {
      let game = qmt.getGameFromToken(contestant.token);    // contestant logging back in so dont join again
      if(game) {
 //       console.log("Token: "+contestant.token);
        let con = qmt.getContestantFromToken(game,contestant.token);
        if(con) {
          contestant.gamename = game.gamename;  // set the game name back for front end UI
          contestant.userid = con.cname;
//          console.log(contestant.userid+" Re-joining game "+game.gamename);
          socket.join(game.gamename); // add contestant to the game room
          socket.emit("joinGameResponse",contestant); // confirm back to contestant
        }
        else {
//          console.log("Contestant token error: "+game.gamename);
          socket.emit("errorResponse","Contestant token error, please signout and re-join");
        }
      }
      else {
        socket.emit("errorResponse","Game token error, please sign out and re-join");
      }
    }
  });

// used by contestant to submit their answer so no login/auth required
  socket.on('submitAnswerRequest',function(ans) {
    console.log("Reg answer: "+ans.val+" for "+ans.token);
    let game = qmt.getGameFromToken(ans.token);
    if(game) {
      if(status = qmt.registerAnswer(game,ans)) {
      socket.emit("submitAnswerResponse","Answer registered: "+ans.val);
      io.in(game.gamename).emit('answersUpdate',game.answers);
//      io.to(QMSockets[game.qmid]).emit("answersUpdate",game.answers);  // tell the quizmaster
      }
      else {
        socket.emit("errorResponse","Answer not valid");
      }
    }
    else {
      socket.emit("errorResponse","Token invalid, problem registering your answer");
    }
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

//    dbt.clearAllQuestions();
    let qidlast = QIDSTART;    // reset question id
    var rd = rln.createInterface({
        input: fs.createReadStream(file),
        console: false
    });

    rd.on('line', function(line) {
//      collectCats(line);
      let qobj = qmt.validatequestion(line,qidlast);  // check that questions have correct values
      if(qobj != null) {
        dbt.insertQuestion(qobj);
        qidlast++;       // increment last question id - ready for the next one
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

// prepare to countdown before each question
function preQuestion(game) {
  io.in(game.gamename).emit('announcement','Get ready!');
  io.in(game.gamename).emit('currentQuestionUpdate','');
  game.answers = 0;   // reset the no of answers received
  io.in(game.gamename).emit('answersUpdate',game.answers);
  //  io.to(QMSockets[game.qmid]).emit("answersUpdate",game.answers);  // tell the QM
  var clock = setTimeout(gcountdown,1000,game,GCOUNTDOWNTIME);
  io.in(game.gamename).emit('audioUpdate',{action: 'start',type:'prequestion'});
}

// count down before start of each question. Once coundown hits 0, show the question
function gcountdown(game,time) {
  io.in(game.gamename).emit('timeUpdate',time);
  if(time > 0)
    setTimeout(gcountdown,1000,game,time-1);  // continue countdown
  else {
    io.in(game.gamename).emit('timeUpdate',0);
    postQuestion(game); // show the question
    io.in(game.gamename).emit('audioUpdate',{action: 'stop',type:'prequestion'});
    }
}

// prepare to countdown during each question
function postQuestion(game) {
  let q = game.questions[game.cqno];
  io.in(game.gamename).emit('currentQuestionUpdate',q.question);
  if(q.type == 'MULTICHOICE') {
    let answers = q.answer.split('#');
    q.answer = answers[0];     // the first value is the correct answer
    answers.sort(function(a, b) {return 0.5 - Math.random()});   //mix up the multichoice options
    io.in(game.gamename).emit('multichoice',answers);
  }
  if(q.imageurl)
    io.in(game.gamename).emit('image',IMAGEURL+q.imageurl);
  else {
    io.in(game.gamename).emit('image',"");
  }
  let str = "Question "+(game.cqno+1) +" of "+game.numquestions;
  io.in(game.gamename).emit('announcement',str);
  game.qstarttime = new Date();   // question start time
  io.in(game.gamename).emit('audioUpdate',{action: 'start',type:'postquestion'});
  setTimeout(qcountdown,1000,game,game.timelimit);
}

// count down after start of each question duration is as per game settings
function qcountdown(game,time) {
//  io.in(game.gamename).emit('timeUpdate','Time Remaining: '+time);
  io.in(game.gamename).emit('timeUpdate',time);
  if(time > 0)
    setTimeout(qcountdown,1000,game,time-1);  // continue countdown
  else {
    io.in(game.gamename).emit('audioUpdate',{action: 'stop',type:'postquestion'});
    endQuestion(game);
    }
}

// question has finished, clear question and prepare for the next one
function endQuestion(game) {
  io.in(game.gamename).emit('currentQuestionUpdate',"");
  io.in(game.gamename).emit('image',"");
  io.in(game.gamename).emit('timeUpdate',"");
  io.in(game.gamename).emit('correctAnswer',game.questions[game.cqno].answer);
  let points = qmt.getContestantPoints(game);
//  Show all scores for this question
//  io.in(game.gamename).emit('scoresUpdate',points);
  if((game.cqno+1) >= game.numquestions) {    // been through all questions
    io.in(game.gamename).emit('endOfGame','');
  }
  else {
    io.in(game.gamename).emit('announcement','Please wait for the next question');
//    preQuestion(game);
  }
}
