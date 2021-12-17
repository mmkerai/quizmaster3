/* Node.js test
 * This script should run under Node.js on local server
 */
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

io.set('heartbeat timeout',20000);
const db = require('./DBfunctions.js');
const qm = require('./QMfunctions.js');
//require('@google-cloud/debug-agent').start();
var dbt = new db();
var qmt = new qm();

//********** set the port to use
const PORT = process.env.PORT || 3000;
server.listen(PORT);
//console.log("Dir path: "+__dirname);
//*****Globals *************
//const GOOGLE_CLIENT_ID="132511972968-ubjmvagd5j2lngmto3tmckdvj5s7rc7q.apps.googleusercontent.com";
const GOOGLE_CLIENT_ID="616776538800-qn2ergke0mq311tjkmkmf11149h6vbbn.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "xx";
const oauthclient = new OAuth2Client(GOOGLE_CLIENT_ID);
//const SUPERADMIN = "thecodecentre@gmail.com";
const SUPERADMIN = "103301973641709867567"; //google id for thecodecentre@gmail.com
var AUTHUSERS = new Object(); // keep list of authenticated users by their socket ids
var SUPERUSERS = new Object(); // keep list of authenticated super users by their socket ids
//const QFile = "";
const QFile = "QMQuestions.json";
const QIDSTART = 1965;
const GCOUNTDOWNTIME = 5;   // countdown in seconds before each question
const IMAGEURLBASE = "http://tropicalfruitandveg.com/quizmaster/";
const GAMEDESCLENGTH = 96;    // length of the game description
const DEFAULTGAMEICON = "images/myquiz.jpg";

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
  SUPERUSERS[socket.id] = 999;   // initialise with a number
  const clientIp = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
//  console.log("Client IP is: "+clientIp);

  socket.on('disconnect',function (reason) {
    removeSocket(socket.id,"disconnect: "+reason);
  });

  socket.on('end',function() {
    removeSocket(socket.id,"end");
  });

  socket.on('connect_timeout', function() {
    removeSocket(socket.id,"timeout");
  });

  socket.on('loginRequest',function(token) {
    async function verify() {
      const ticket = await oauthclient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
//      console.log(payload);
      var user = null;
      dbt.checkQMaster(payload.sub,function(valid) {
        if(valid) {
          user = {qmid: payload.sub,name: payload.name, imageUrl: payload.picture};
          AUTHUSERS[socket.id] = user;
        }
        socket.emit('loginResponse',user);
      });
    }
    verify().catch(console.error);
  });

  socket.on('logoutRequest',function() {
    delete AUTHUSERS[socket.id];
    console.log("Logged out: "+socket.id)
    socket.emit("errorResponse","Logged Out");
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
      var user = null;
      if(payload.sub == SUPERADMIN) {
          console.log("Super admin logged in: "+payload.given_name+" at "+ new Date().toISOString());
          user = {qmid: payload.sub,name: payload.name, imageUrl: payload.picture};
          SUPERUSERS[socket.id] = payload.sub; // this is the google user ID
          AUTHUSERS[socket.id] = user; // user object
        }
        else {
          console.log("Super admin login error");
        }
        socket.emit('loginSuperResponse',user);
    }
    verify().catch(console.error);
  });

  // only used by super admin. Hard coded to tcc
  socket.on('getActiveGamesRequest',function(uid) {
    if(SUPERUSERS[socket.id] != uid) return(socket.emit("errorResponse","Please login as admin"));
    socket.emit('getActiveGamesResponse',qmt.getAllActiveGames());
  });

// only used by super admin. Hard coded to tcc
  socket.on('getActiveUsersRequest',function(uid) {
    if(SUPERUSERS[socket.id] != uid) return(socket.emit("errorResponse","Please login as admin"));
    var users = [];
    Object.keys(AUTHUSERS).forEach(u => {
      var obj = new Object();
      obj.socketid = u;
      obj.userid = AUTHUSERS[u].qmid;
      obj.username = AUTHUSERS[u].name;
      users.push(obj);
    });
    socket.emit('getActiveUsersResponse',users);
  });

  socket.on('registerRequest',function(token) {
    async function verify() {
      const ticket = await oauthclient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
//        console.log(payload);
      var user = null;
      dbt.checkQMaster(payload.sub,function(exists) {
        if(exists) {  // user already in the DB
          socket.emit('registerResponse',null);
        }
        else { // not in DB so add it
          const clientIp = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
          console.log("Client IP is: "+clientIp);
          var newQM = new qmt.createQMaster(payload,clientIp);
          dbt.newQMaster(newQM,function(valid) {
            if(valid) {
              user = {qmid: payload.sub,name: payload.name, imageUrl: payload.picture};
              AUTHUSERS[socket.id] = user;
            }
            socket.emit('registerResponse',user);
          });
       }
     });
    }
    verify().catch(console.error);
  });

  socket.on('getUserInfoRequest',function(uid) {
    if(!validUser(socket,uid)) return;
    dbt.getUserInfo(uid,function(uinfo) {
      socket.emit('getUserInfoResponse',uinfo);
    });
  });    

  // Only allowed by Super admin
  socket.on('loadQuestionsRequest',function(qmid) {
    if(SUPERUSERS[socket.id] != qmid) return(socket.emit("errorResponse","Please login as admin"));
    const str = "Loading Questions to DB from file "+QFile;
		console.log(str);
//    loadquestions(QFile,socket);    // safety incase I accidently load questions again
		socket.emit('infoResponse',str);
  });

  socket.on('getCatsRequest',function(uid){
    if(!validUser(socket,uid)) return;
    let qcat = qmt.getCategories();
 //   console.log("Categories are: "+JSON.stringify(qcat));
		socket.emit('getCatsResponse',qcat);
  });

  socket.on('getSubcatsRequest',function(uid,cat){
    if(!validUser(socket,uid)) return;
//    console.log("Get subcats for "+cat);
    let qsubcat = qmt.getSubCategories(cat);
		socket.emit('getSubcatsResponse',qsubcat);
  });

  socket.on('getDiffsRequest',function(uid){
    if(!validUser(socket,uid)) return;
    let qdiff = qmt.getDifficulties();
		socket.emit('getDiffsResponse',qdiff);
  });

  socket.on('getQuestionTypesRequest',function(uid){
    if(!validUser(socket,uid)) return;
    let qtype = qmt.getQuestionTypes();
		socket.emit('getQuestionTypesResponse',qtype);
  });

  socket.on('getGameTypesRequest',function(uid) {
    if(!validUser(socket,uid)) return;
    let gtype = qmt.getGameTypes();
		socket.emit('getGameTypesResponse',gtype);
  });

// This should not be called during PROD as there are too many questions 
// Only allowed by Super admin
  socket.on('getQuestionsRequest',function(qmid,game) {
    if(SUPERUSERS[socket.id] != qmid) return(socket.emit("errorResponse","Please login as admin"));
    console.log("Getting questions");
    dbt.getQuestions(function(qlist) {
      socket.emit('getQuestionsResponse',qlist);
    });
  });

  socket.on('getQuestionsByCatRequest',function(uid,cat) {
    if(!validUser(socket,uid)) return;
//    console.log("Getting questions for category: "+cat+" for "+AUTHUSERS[socket.id].name);
    dbt.getQuestionsByCat(cat, function(qlist) {
      if(qlist.length > 0)
        socket.emit('getQuestionsResponse',qlist);
      else
        socket.emit('errorResponse',"No questions");
    });
  });

  socket.on('getQuestionByIdRequest',function(uid,qid) {
    if(!validUser(socket,uid)) return;
//    console.log("Getting question with ID: "+qid);
    dbt.getQuestionById(qid,function(qm) {
      if(qm.length > 0) //make sure question id was valid
        socket.emit("getQuestionByIdResponse",qm[0]);
      else
        socket.emit('errorResponse',"Question ID not found");
    });
  });

  socket.on('updateQuestionRequest',function(uid,qobj) {
    if(!validUser(socket,uid)) return;
//    console.log("Updating question with ID: "+qobj.qid);
    dbt.updateQuestion(qobj,function(status) {
      if(status)
        socket.emit("updateQuestionResponse","Question Updated");
      else
        socket.emit('errorResponse',"Question update error");
    });
  });

  socket.on('getGamesRequest',function(qmid) {
    if(!validUser(socket,qmid)) return;
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

// This gets all question for specific game.
socket.on('getGameQuestionsRequest',function(qmid,gname) {
  if(!validUser(socket,qmid)) return;
  dbt.getQuestionsByID(gname,function(qs) {
    socket.emit("getGameQuestionsResponse",qs);
  });
});

// this event is used to prepare for game start.
// Needs to be called before starting play so players can join.
  socket.on('preGameStartRequest',function(qmid,gname) {
    if(!validUser(socket,qmid)) return;
    
    qmt.gameReady(qmid,gname,function(game) { // this sets up dynamic game object to track play
      if(!game)
        socket.emit("errorResponse","Game not found: "+gname);
      else {
      // // Chuck everybody out of the room in case they were already there from previous game play      
      //   io.of('/').in(gname).clients((error, socketIds) => {
      //     if (error) throw error;
      //     socketIds.forEach(socketId => io.sockets.sockets[socketId].leave(gname));
      //   });
        socket.join(game.gameid);
        socket.emit('preGameStartResponse',game);
        socket.emit('contestantUpdate',game.contestants);
      }
    });
  });


/* This func checks game params are valid and then creates DB entry.
 * game object fields:
 * gamename
 * qmid (quizmaster id)
 * gametype
 * questions (this is an array of question ids)
 * timelimit
 * accesscode (this is created randomly later)
 * gamedesc (game description)
 * gameicon (URL to image file)
 * likes
 */
  socket.on('newGameRequest',function(qmid,game) {
    if(!validUser(socket,qmid)) return;
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
    game.gamedesc = game.gamedesc.substr(0,GAMEDESCLENGTH);   // limit length of description
    if(game.gameicon.length > 0) {
      if(game.gameicon.indexOf("http://") == -1 || game.gameicon.indexOf("https://") == -1)
        return(socket.emit("gameSetupErrorResponse","Game icon should be full domain url"));
    } else {
        game.gameicon = DEFAULTGAMEICON;
    }

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
        game.likes = 1;   // initialise the game likes
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
    if(!validUser(socket,qmid)) return;
    dbt.deleteGame(game, function (status) {
      if(status)  // all good
        socket.emit("deleteGameResponse","Game deleted: "+game.gamename);
      else
        socket.emit("errorResponse","Error deleting "+game.gamename);
    });
  });

// called by quizmaster to start a game
  socket.on('startGameRequest',function(qmid,gameid) {
    if(!validUser(socket,qmid)) return;
    let game = qmt.getActiveGameFromGameId(gameid);
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
    if(!validUser(socket,qmid)) return;
    let game = qmt.getActiveGameFromGameId(gameid);
    if(game) {
      game.cqno++;
      preQuestion(game);
    }
    else {
      socket.emit("errorResponse","Game not active or has finished");
    }
  });

// used to show next question during self play only
socket.on('selfPlayNextQuestionRequest',function(contestant) {
  if(!contestant || !contestant.userid || !contestant.gameid)
    return(socket.emit("errorResponse","Problem playing this game"));

  let game = qmt.getActiveGameFromGameId(contestant.gameid);
  if(game) {
    game.cqno++;
    preQuestion(game);
  }
  else {
    socket.emit("errorResponse","Game not active or has finished");
  }
});

// called by quizmaster to show latest scores
  socket.on('showScoresRequest',function(qmid,gameid) {
    if(!validUser(socket,qmid)) return;
    let scores = qmt.getContestantScores(gameid);   // current scores
// Test to see how score is displayed
/*     let scores = [];
    for(var i=0; i < 4; i++) {
      let c = new Object();
      c["cname"] = "con"+i;
      c["points"] = Math.random() * 100;
      scores.push(c);
    } */
    if(scores) {
      io.in(gameid).emit('scoresUpdate',scores);
    }
    else {
      socket.emit("errorResponse","Game not active");
    }
  });

  // called by quizmaster to end the game
  socket.on('endGameRequest',function(qmid,gameid) {
    if(!validUser(socket,qmid)) return;
    qmt.endOfGame(gameid); //housekeeping
    io.in(gameid).emit('announcement','Quizmaster has ended the game!');
    socket.emit("endGameResponse",gameid);
  });

  // called by contestant to end the game
  socket.on('selfPlayEndGameRequest',function(contestant) {
    qmt.endOfGame(contestant.gameid); //housekeeping
    io.in(contestant.gameid).emit('announcement','Game ended');
    socket.emit("selfPlayEndGameResponse","");
  });

// Get the pre-loaded quizes in case user does not want to create their own
// Used the qmid of the super admin (code centre)
socket.on('getPopularQuizesRequest',function() {
  dbt.getGames(SUPERADMIN,function(games) {
    if(games.length > 0) {
      socket.emit('getPopularQuizesResponse',games);
    }
  });
});

// used by contestant to join game so no login/auth required
// if previously joined then there will be a token saved in a cookie
  socket.on('joinGameRequest',function(contestant) {
    if(!contestant.gameid) {    // check if previously joined and is now re-joining
      if(!contestant.userid || !contestant.accesscode) {
        socket.emit("errorResponse","Please enter Nickname and Accesscode");
      }
      else {
        let game = qmt.getGameFromAccessCode(contestant.accesscode); // this only works after game has been started by the Quizmaster
        if(game) {
          const con = qmt.joinGame(game,contestant);  // adds contestant to the game and return his details
          if(con) {   // all good
            contestant.gamename = game.gamename;  // set the game name back for front end UI
            contestant.gameid = con.gameid;   // unique game that this contestenant has just joined
            console.log(contestant.userid+" Joining game "+game.gamename+":"+contestant.gameid);
            socket.join(game.gameid); // add contestant to the game room
            socket.emit("joinGameResponse",contestant); // confirm back to contestant
            // update everyone in the room
            io.in(game.gameid).emit('announcement','Please wait for the Quizmaster to start your game');
            io.in(game.gameid).emit('contestantUpdate',game.contestants);
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
      let game = qmt.getGameFromGameId(contestant.gameid);    // contestant logging back in so dont join again
      if(game) {
        // console.log("Gameid: "+contestant.gameid);
        // let con = qmt.getContestantFromToken(game,contestant.token);
        // if(con) {
          contestant.gamename = game.gamename;  // set the game name back for front end UI
//          contestant.userid = con.cname;
          console.log(contestant.userid+" Re-joining game "+game.gamename);
          socket.join(game.gameid); // add contestant to the game room
          socket.emit("joinGameResponse",contestant); // confirm back to contestant
          socket.emit('contestantUpdate',game.contestants);
//         }
//         else {
// //          console.log("Contestant error: "+game.gamename);
//           socket.emit("errorResponse","Contestant error, please signout and re-join");
//         }
      }
      else {
        socket.emit("errorResponse","Game error, please sign out and re-join");
      }
    }
  });

// This is used to start playing self game.
socket.on('playSelfRequest',function(contestant) {
  if(!contestant.userid || !contestant.gamename)
    return(socket.emit("errorResponse","Problem playing this game"));

  var qmid = SUPERADMIN;
  // qmt.getSelfGameFromAccessCode(qmid,contestant.accesscode,function(game) {
  //   if(!game)
  //     socket.emit("errorResponse","Game not found with accesscode: "+accesscode);
  //   else {
      qmt.gameReady(qmid,contestant.gamename,function(sgame) {
        if(!sgame)
          return(socket.emit("errorResponse","Game not found: "+contestant.gamename));
 
        qmt.setGameType(sgame,"SELFPLAY");    // so questions are controlled bu player not the quizmaster
        const con = qmt.joinGame(sgame,contestant);  // adds contestant to the game and return his details
        contestant.accesscode = sgame.accesscode;  // set the game accesscode back for front end UI
        contestant.gameid = sgame.gameid;   // unique game that this contestenant has just joined
        console.log(contestant.userid+" Joining game "+sgame.gamename);
        socket.join(sgame.gameid);
        socket.emit("joinGameResponse",contestant); // confirm back to contestant
//        socket.emit('playSelfResponse',sgame);
        preQuestion(sgame);
      });
  });

  // Send announcement to all contestants
  socket.on('announcementRequest',function(qmid,gameid,msg) {
    if(!validUser(socket,qmid)) return;
    io.in(gameid).emit('announcement',msg);
//    console.log("Announcement: "+msg);
  });

// used by contestant to submit their answer so no login/auth required
  socket.on('submitAnswerRequest',function(ans) {
    // console.log("Reg answer: "+ans.val+" for "+ans.contestant.gameid);
    let game = qmt.getActiveGameFromGameId(ans.contestant.gameid);
    if(game) {
      game.answers++;   // keep tab of how many answers submitted
      var points = qmt.registerAnswer(game,ans);  // register the answer for this contestant and calc points
      if(points == -1) 
        socket.emit("errorResponse","Answer not valid");
      else {
        cans = new Object();
        cans.answer = ans.val;
        cans.points = points;
        socket.emit("submitAnswerResponse",cans);
        io.in(game.gameid).emit('answersUpdate',game.answers);
//      io.to(QMSockets[game.qmid]).emit("answersUpdate",game.answers);  // tell the quizmaster
      }
    }
    else {
      socket.emit("errorResponse","Token invalid, problem registering your answer");
    }
  });

  // tidy up after contestant signs out of the game
  socket.on('conLeaveRequest',function(con) {
    if(con) {
      let game = qmt.getActiveGameFromGameId(con.gameid); 
      if(game) {
        qmt.removeContestantFromGame(game,con);
        socket.emit("infoResponse","Signed Out");
        io.in(game.gameid).emit('contestantUpdate',game.contestants);
      }
    }
    else {
      socket.emit("errorResponse","Token invalid");
    }
  });
}); //end of io.on

/*******************************************
/* Functions below this point
********************************************/
function removeSocket(id,evname) {
//		console.log("Socket "+id+" "+evname+" at "+ new Date().toISOString());
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
  });
}

// Check if socket is from a valid user
function validUser(sock,qmid) {
  // console.log("QMid: "+qmid);
  // console.log("Socket: "+JSON.stringify(AUTHUSERS[sock.id]));
  if(typeof AUTHUSERS[sock.id] !== 'undefined') {   // check not undefined otherwise it crashes
    if(AUTHUSERS[sock.id].qmid == qmid) return(true);
  }

  sock.emit("errorResponse","Please login");
  return(false);
}

// prepare to countdown before each question
function preQuestion(game) {
  io.in(game.gameid).emit('announcement','Get ready!');
  io.in(game.gameid).emit('currentQuestionUpdate','');
  game.answers = 0;   // reset the no of answers received
  io.in(game.gameid).emit('answersUpdate',game.answers);
  //  io.to(QMSockets[game.qmid]).emit("answersUpdate",game.answers);  // tell the QM
  var clock = setTimeout(gcountdown,1000,game,GCOUNTDOWNTIME);
  io.in(game.gameid).emit('audioUpdate',{action: 'start',type:'prequestion'});
}

// // prepare to countdown before each question
// function selfPlayPreQuestion(socket,game) {
//   socket.emit('announcement','Get ready!');
//   socket.emit('currentQuestionUpdate','');
//   game.answers = 0;   // reset the no of answers received
//   socket.emit('answersUpdate',game.answers);
//   setTimeout(gcountdown,1000,game,GCOUNTDOWNTIME);
//   socket.emit('audioUpdate',{action: 'start',type:'prequestion'});
// }

// count down before start of each question. Once coundown hits 0, show the question
function gcountdown(game,time) {
  io.in(game.gameid).emit('timeUpdate',time);
  if(time > 0)
    setTimeout(gcountdown,1000,game,time-1);  // continue countdown
  else {
    io.in(game.gameid).emit('timeUpdate',0);
    postQuestion(game); // show the question
    io.in(game.gameid).emit('audioUpdate',{action: 'stop',type:'prequestion'});
    }
}

// prepare to countdown during each question
function postQuestion(game) {
  let q = game.questions[game.cqno];
  io.in(game.gameid).emit('currentQuestionUpdate',q.question);
  if(q.type == 'MULTICHOICE') {
    let answers = q.answer.split('#');
    q.answer = answers[0];     // the first value is the correct answer
    answers.sort(function(a, b) {return 0.5 - Math.random()});   //mix up the multichoice options
    io.in(game.gameid).emit('multichoice',answers);
  }
  if(q.imageurl)
    io.in(game.gameid).emit('image',IMAGEURLBASE+q.imageurl);
  else {
    io.in(game.gameid).emit('image',"");
  }
  let str = "Question "+(game.cqno+1) +" of "+game.numquestions;
  io.in(game.gameid).emit('announcement',str);
  game.qstarttime = new Date();   // question start time
  io.in(game.gameid).emit('audioUpdate',{action: 'start',type:'postquestion'});
  setTimeout(qcountdown,1000,game,game.timelimit);
}

// count down after start of each question duration is as per game settings
function qcountdown(game,time) {
//  io.in(game.gameid).emit('timeUpdate','Time Remaining: '+time);
  io.in(game.gameid).emit('timeUpdate',time);
  if(time > 0)
    setTimeout(qcountdown,1000,game,time-1);  // continue countdown
  else {
    io.in(game.gameid).emit('audioUpdate',{action: 'stop',type:'postquestion'});
    endQuestion(game);
    }
}

// question has finished, clear question and prepare for the next one
function endQuestion(game) { 
  io.in(game.gameid).emit('currentQuestionUpdate',"");
  io.in(game.gameid).emit('image',"");
  io.in(game.gameid).emit('timeUpdate',"");
  io.in(game.gameid).emit('correctAnswer',game.questions[game.cqno].answer);
//  let points = qmt.getContestantPoints(game);
//  Show all scores for this question
// io.in(game.gameid).emit('scoresUpdate',points);
  if((game.cqno+1) >= game.numquestions) {    // been through all questions
    if(qmt.isSelfPlayGame(game)) {  //handle differently if self play
      io.in(game.gameid).emit('announcement',"End of Game");
      let scores = qmt.getContestantScores(game.gameid);   // latest scores
      if(scores)
        io.in(game.gameid).emit('selfPlayTotal',scores[0].points); // for selfplay should only have one entry
    }
    else    // normal game controlled by quizmaster
      io.in(game.gameid).emit('endOfGame','');
  }
  else {
    var str;
    if(qmt.isSelfPlayGame(game))
      str = "Click 'next question' to continue";
    else
      str = "Please wait for the next question";

    io.in(game.gameid).emit('announcement',str);
  }
}
