// This file contains all Questions Functions
require('dotenv').config();
//const dl = require('damerau-levenshtein-js');
const db = require('./DBfunctions.js');
var Dbt = new db();
class QMApp {
  constructor(name,email,url,ip,hpwd) {
    this.appname = name;
    this.appemail = email;
    this.appurl = url;
    this.appsecret = "secret";
    this.appip = ip;
    this.password = hpwd;
    this.regdate = new Date().getTime();
    this.regusers = 0;
    this.numrequests = 0;
  }
};

class QMQuestion {
      constructor(Id,Category,Subcategory,Difficulty,Type,Question,Image,Answer) {
          this.qid = Id;
          this.category = Category;
          this.subcategory = Subcategory;
          this.type = Type;
          this.imageurl = Image;
          this.question = Question;
          this.difficulty = Difficulty;
          this.answer = Answer;
          this.used = 0;
          this.correct = 0;
      }
};

// This is used when registering a quizmaster using Google ID
class QMaster {
  constructor(user,ip) {
    this.name = user.name;
    this.email = user.email;
    this.qmid = user.sub;
    this.app_id = user.jti;
    this.app_ip = ip;
    this.api_key = user.at_hash;
    this.api_requests = 0;
    this.reg_date = new Date().getTime();
    this.reg_users = 0;
    this.max_con = 8;   // max contestants allowed
    this.max_q = 10;    // max questions per game
    this.games = [];    //all the games created by this QM
  }
};

// This object is only created when a game starts - not stored as is in the DB
class QMGame {
      constructor(game) {
          this.gameid = generateGameId();    // create a new game ID - unique id for this game
          this.qmid = game.qmid;
          this.max_con = 
          this.max_q = 
          this.gamename = game.gamename;
          this.numquestions = game.questions.length;  // number of questions in the array
          this.timelimit = game.timelimit;    // time per question in seconds
          this.gametype = game.gametype;
          this.accesscode = game.accesscode;
          this.questions = game.questions;  // array of question ids
          this.contestants = new Array();
          this.cqno = 0;   // current question number - 0:game hasnt started, -1 = game finished
          this.qstarttime;   // question start time in unix time
          this.answers = 0;   // no of answers received for current question. Reset after each question
      }
};

// This is used when a game starts. One object per contestant
// gameid is used to uniquely identify the game user has joined
class QMContestant {
      constructor(con,gameid) {
          this.cname = con.userid;
          this.gameid = gameid;  // game this contestant has joined
          this.answers = [];    // list of answers, could be text, numbers or multichoice
          this.points = [];   // points for each question/answer in same order
          this.totals = 0;
      }
};

const QCAT = {
"GEOGRAPHY":["GENERAL","CAPITALS","COUNTRIES","FLAGS","LANDMARKS","LANGUAGES"],
"ANIMALS":["GENERAL"],
"TECHNOLOGY":["COMPUTERS"],
"FOOD":["GENERAL","LOGOS"],
"HISTORY":["GENERAL"],
"MISC":["GENERAL","LOGOS","MENONLY","DITLOIDS","ACRONYMS","MATHS"],
"MOVIES":["GENERAL","ACTORS","ACTRESSES","FOURSTARS","MOVIESTARS","VILLAINS","DISNEY"],
"MUSIC":["GENERAL","BANDLOGOS","ALBUMCOVERS","DITLOIDS"],
"RELIGION":["GENERAL"],
"SCIENCE":["GENERAL"],
"SPORTS":["FOOTBALL","GENERAL"],
"CARTOONS":["GENERAL"],
"TV":["GENERAL","QUOTES"],
"VIDEOGAMES":["GENERAL"]
}
/*
const QCAT = {
  TV:['tv'],MOVIES:['moviestars','actors','actresses'],SCIENCE:['science'],
  GEOGRAPHY:['general','landmarks'],HISTORY:['history'],
  LITERATURE:['literature'],MISC:['misc'],MUSIC:['music'],ANIMALS:['animals'],FOOD:['food'],
  RELIGION:['religion'],SPORTS:['sports'],VIDEOGAMES:['videgames'],CARTOONS:['cartoons'],
  TECHNOLOGY:['technology']};

const QSUBCAT = {
  FOOTBALL:'football',FLAGS:'flags',CAPITALS:'capitals',GENERAL:'general',
  CELEBRITIES:'celebrities',LOGOS:'logos',ALBUMCOVERS:'albumcovers',MOVIESTARS:'moviestars',
  ACTORS:'actors',ACTRESSES:'actresses',COUNTRIES:'countries',BANDLOGOS:'bandlogos',
  FOODLOGOS:'foodlogos',VILLAINS:'villians',FOURSTARS:'fourstars',LANDMARKS:'landmarks',
  QUOTES:'quotes'};
*/
const QDIFF = {
    EASY:'easy',MEDIUM:'medium',HARD:'hard',MIXED:'mixed'};

const QTYPE = {
    TEXT:'text',MULTICHOICE:'multichoice',NUMBER:'number'};

const GTYPE = {
    PUBQUIZ:'pubquiz',SELFPLAY:'selfplay',FUNQUIZ:'funquiz'};
// const GTYPE = {PUBQUIZ:'pubquiz'};
  
var ActiveGameByName = new Object();    //list of all active games in play by gamename
var ActiveGameByAccessCode = new Object();    //list of all accesscodes for active games
var ActiveGameByGameId = new Object();    //list of all active games

function QMQ() {
console.log("QM Class initialised");
}

QMQ.prototype.testDL = function() {
  let w1 = "manji kerai";
  console.log("TestDL1: "+dlevenshtein(w1,"Manji Kerai"));
  console.log("TestDL2: "+dlevenshtein(w1,"manjikerai"));
  console.log("TestDL3: "+dlevenshtein(w1,"manji keria"));
  console.log("TestDL4: "+dlevenshtein(w1,"kslskss kerai"));
  console.log("TestDL5: "+dlevenshtein(w1,"kerai manji"));
}

QMQ.prototype.testAns = function() {
  let q1 = {"type":'number',"answer":"234"};
  let q2 = {"type":'text',"answer":"manji kerai"};
  let q3 = {"type":'text',"answer":"man"};
  let g1 = {"cqno":0,"questions": [q1,q2,q3],"timelimit": 10,"qstarttime":new Date()};

  console.log("Test1: "+checkAnswer(g1,"manji"));
  console.log("Test2: "+checkAnswer(g1,"2345"));
  console.log("Test3: "+checkAnswer(g1,"234"));
  g1.cqno=1;
  console.log("Test4: "+checkAnswer(g1,"234"));
  console.log("Test5: "+checkAnswer(g1,"manji keqmqmt"));
  console.log("Test6: "+checkAnswer(g1,"Manji Kera"));
  g1.cqno=2;
  console.log("Test7: "+checkAnswer(g1,"234567"));
  console.log("Test8: "+checkAnswer(g1,"manji"));
  console.log("Test9: "+checkAnswer(g1,"man"));
}

QMQ.prototype.createQMaster = function(qm,ipaddr) {
  const myobj = new QMaster(qm,ipaddr);  // needs qm info plus ip address
  return myobj;
}

// This is used to get a game ready to play
// i.e. take game details from DB and create a game object
QMQ.prototype.gameReady = function(qmid,gname,callback) {
  Dbt.getGameByName(qmid,gname,function(game) {
    if(!game)
      return(callback(game));   // no game found null returned

    // this gets question objects based on question ids
    Dbt.getQuestionsByID(game.questions,function(qs) {
      let newg = new QMGame(game);
//      console.log("active game: "+JSON.stringify(newg));
      newg.questions = qs;  //replace question ids with full details of the questions
      // build list of accesscodes so its quicker to join later
      ActiveGameByName[game.gamename] = newg;    // add game to the list
      ActiveGameByAccessCode[game.accesscode] = newg;     // used to get full game details using access code
      ActiveGameByGameId[newg.gameid] = newg;     // used to get full game details when in play
      callback(newg);
    });
  });
}

// Like gameReady but for self play
// QMQ.prototype.selfPlayGameReady = function(game,callback) {
//     // this gets question objects based on question ids
//     Dbt.getQuestionsByID(game.questions,function(qs) {
//       let newg = new QMGame(game);
//       newg.questions = qs;  //replace question ids with full details of the questions
//       callback(newg);
//     });
// }

// Find the active game before starting
QMQ.prototype.getActiveGameFromGameId = function(gameid) {
  return(ActiveGameByGameId[gameid]);
}

// Superadmin debug only
QMQ.prototype.getAllActiveGames = function() {
  let garray = [];
  Object.keys(ActiveGameByName).forEach(g => {
    garray.push(ActiveGameByName[g]);
  }); 
  return(garray);
}

QMQ.prototype.getCategories = function() {
  return(QCAT);
}

QMQ.prototype.getSubCategories = function(cat) {
  return(QCAT[cat]);
}

QMQ.prototype.getDifficulties = function() {
  return(QDIFF);
}

QMQ.prototype.getQuestionTypes = function() {
  return(QTYPE);
}

QMQ.prototype.getGameTypes = function() {
  return(GTYPE);
}

QMQ.prototype.setGameType = function(game,type) {
  game.gametype = GTYPE[type];
}

QMQ.prototype.isSelfPlayGame = function(game) {
  if(game.gametype = 'selfplay')
    return true;
  else
    return false;
}

QMQ.prototype.checkGameTypes = function(gtype) {
  if(GTYPE.hasOwnProperty(gtype))
    return(true);

  return(false);
}

//  This converts a string of numbers separated by , to an array of question ids
// It ensures that no fields are empty
QMQ.prototype.getQuestionList = function(qstr) {
  var res = qstr.split(",");
  var qlist = [];
  res.forEach(function (q,n) {
    if(q != "") qlist.push(q);  // create new array with only valid fields
  });
  return(qlist);
}

// check all values are valid and sanitise before inserting into database
QMQ.prototype.validatequestion = function(jstr,qid) {
  let qobj = JSON.parse(jstr,'utf8');
  let subcats = new Array();
  let cat = qobj.Category.toUpperCase();
  let subcat = qobj.Subcategory.toUpperCase();
  let type = qobj.Type.toUpperCase();
  let difficulty = qobj.Difficulty.toUpperCase();

    if(QDIFF[difficulty] == null) {
      console.log("Difficulty invalid: "+jstr);
      return null;
    }
    if(QTYPE[type] == null) {
      console.log("Question Type invalid: "+jstr);
      return null;
    }
    if(QCAT[cat] == null) {
      console.log("Question Category invalid: "+jstr);
      return null;
    }
    subcats = QCAT[cat];
//    console.log("Cat and Subcats: "+cat+"-"+subcats);
    for(const i of subcats) {
      if(subcat == i) {
//      console.log("valid Subcat:"+i+"-"+subcat);
        return new QMQuestion(qid,cat,subcat,difficulty,type,
          qobj.Question,qobj.Image,qobj.Answer);
      }
    }
//  console.log("Question SubCategory invalid: "+jstr);
    return null;
}

// check all values are valid before updating existing question
QMQ.prototype.verifyquestion = function(qobj) {

    if(QDIFF[qobj.difficulty] == null) {
      console.log("Difficulty invalid: "+qobj.difficulty);
      return null;
    }
    if(QTYPE[qobj.type] == null) {
      console.log("Question Type invalid: "+qobj.type);
      return null;
    }
    if(QCAT[qobj.category] == null) {
      console.log("Question Category invalid: "+qobj.category);
      return null;
    }
    let subcats = QCAT[qobj.category];
    for(const i of subcats) { // make sure subcat is in the list for this cat
      if(i == qobj.subcategory) {
        return qobj;
      }
    }
    return null;
}

// This returns the game object from the assigned access code
// Only used after quizmaster has started the game
QMQ.prototype.getGameFromAccessCode = function(code) {
  return(ActiveGameByAccessCode[code]);    // get game if access code matches
}

// This is called when starting self play, if public quiz then uses the superadmin (TCC) games
// otherwise checks the game is valid for the quizmaster
// QMQ.prototype.getSelfGameFromAccessCode = function(qmid,accesscode,callback) {
//   Dbt.getGameFromAccesscode(qmid,accesscode, function(game) {
//       callback(game);
//   });

// }

// New contestant joins an active game, access code has already beem verified at this stage
// TODO check max contestants have not been exceeded in the QM object
QMQ.prototype.joinGame = function(game,contestant) {
    game.contestants.forEach(con => {
      if(con.cname == contestant.userid)   // username already exists
        return(false);
    }); // all good, username is unique
    let con = new QMContestant(contestant,game.gameid);
    game.contestants.push(con); // add this contestant to this game
    return(con);  // return the game object
}

// get the game object from the gameid
QMQ.prototype.getGameFromGameId = function(gameid) {

}

// // get the game info using the token. Token is in format "accesscode:uniquestring"
// QMQ.prototype.getGameFromToken = function(token) {
//   let tarr = token.split(":");
//   let code = tarr[0];   // first field is the accesscode
//   return(ActiveGameByAccessCode[code]);
// }

// // This returns the contestant object from the their token
// QMQ.prototype.getContestantFromToken = function(game,token) {
//   for(var i in game.contestants) {
//     if(game.contestants[i].token == token) {
// //      console.log("test token: "+game.contestants[i].token);
//       return(game.contestants[i]);
//     }
//   }
//   return(false);
// }

// This removes the contestant object from the list
QMQ.prototype.removeContestantFromGame = function(game,contestant) {
  for(var i in game.contestants) {
    if(game.contestants[i].cname == contestant.userid) {
      game.contestants.splice(i,1);   // remove from array
    }
  }
}

// Contestant submits an answer to a question.
// Need to register it so points can be calculated later
QMQ.prototype.registerAnswer = function(game,ans) {
  if(game.cqno == -1) {  // game has ended, so cant accept answer
    console.log("Cannot register - game ended");
    return -1;
  }
  // console.log("Answer: "+ans.contestant.userid+":"+ans.val);
  let points = checkAnswer(game,ans.val);
  if(points == -1) {  
    console.log("answer received too late");
    return -1;
  }
  // console.log("Points: "+points);
  game.contestants.forEach(con => {   // find this contestant using his token and update the answer
      if(con.cname == ans.contestant.userid) {
        con.answers[game.cqno] = ans.val;
        con.points[game.cqno] = points;
        con.totals += points;
      }
  });
  
  return(points);
}

// get the contestant points for this specific question.
// Usually called after each question
QMQ.prototype.getContestantPoints = function(game) {
  let result = [];
  for(var i in game.contestants) {
    let c = new Object();
    c.cname = game.contestants[i].cname;
    c.points = game.contestants[i].points[game.cqno];
    result.push(c);
  }
  return(result);
}

// get the contestant total scores.
// Usually called after end of game but can be called during mid play
QMQ.prototype.getContestantScores = function(gameid) {
  let result = [];
  let game = ActiveGameByGameId[gameid];
  // TODO arrnage in order of points and limit to top 5
  if(game) {
    for(var i in game.contestants) {
      let c = new Object();
      c.cname = game.contestants[i].cname;
      c.points = game.contestants[i].totals;
      result.push(c);
    }
    return(result);
  }
}

// Games finished - housekeeping 
QMQ.prototype.endOfGame = function(gameid) {
  let game = ActiveGameByGameId[gameid];
  delete ActiveGameByAccessCode[game.accesscode];
  delete ActiveGameByName[game.gamename];
  delete ActiveGameByGameId[gameid];
  console.log("End game: "+game.gamename);
  game = null;   // release memory ?
}

// check if answer received is correct if so calc points based on time
// If answer is a number or string of 3 or less chars then it must be exact match
// If longer string then dl distance must be less than half the number of chars in correct answers
// e.g. if answer is cat then there must be an exact match
// if answer is mangosteen then up to 4 spelling errors are allowed
function checkAnswer(game,ans) {
  // console.log("Ans is: "+ans);
  let q = game.questions[game.cqno];
  let dlmax = q.answer.length;
  let dldist = dlevenshtein(q.answer.toLowerCase(),ans.toLowerCase());
  // console.log("dl distance: "+dldist);
  if((q.type='number' && q.answer == ans) ||
    (dlmax <= 3 && q.answer.toLowerCase() == ans.toLowerCase()) ||
    (q.type!='number' && dlmax > 3 && dldist < dlmax/2))
    {
      let response = new Date() - game.qstarttime;  // in milliseconds
//      console.log("response time is: "+response);
      let maxt = game.timelimit * 1000;   // convert to milliseconds
      if(response > maxt)   // shouldnt happen
        return -1;
      let points = ((maxt - response) * 100)/maxt; // max points is 100
      return(Math.floor(points));
    }
  return(0);
}

// // creates a random contestant token for for easy identification
// function generateCToken(code) {
//   var length = 12,
//   charset = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ23456789",
//   retVal = "";
//   for(var i = 0, n = charset.length; i < length; ++i) {
//       retVal += charset.charAt(Math.random() * n);
//   }
//   return(code+":"+retVal);
// }

// creates a random number for dymanic game id
// This is unique per active game, used as the socket id for joining game room
function generateGameId() {
  var length = 12,
  charset = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ23456789",
  retVal = "";
  for(var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.random() * n);
  }
  return(retVal);
}

//This is the damaerau levenshtein algo copied from dzone.com
function dlevenshtein(a, b)
{
	var i;
	var j;
	var cost;
	var d = new Array();
  if(!a) a = "";    // MK - incase it is null
  if(!b) b = "";   // MK - incase it is null

	if ( a.length == 0 )
	{
		return b.length;
	}

	if ( b.length == 0 )
	{
		return a.length;
	}

	for ( i = 0; i <= a.length; i++ )
	{
		d[ i ] = new Array();
		d[ i ][ 0 ] = i;
	}

	for ( j = 0; j <= b.length; j++ )
	{
		d[ 0 ][ j ] = j;
	}

	for ( i = 1; i <= a.length; i++ )
	{
		for ( j = 1; j <= b.length; j++ )
		{
			if ( a.charAt( i - 1 ) == b.charAt( j - 1 ) )
			{
				cost = 0;
			}
			else
			{
				cost = 1;
			}

			d[ i ][ j ] = Math.min( d[ i - 1 ][ j ] + 1, d[ i ][ j - 1 ] + 1, d[ i - 1 ][ j - 1 ] + cost );

			if(
         i > 1 &&
         j > 1 &&
         a.charAt(i - 1) == b.charAt(j-2) &&
         a.charAt(i-2) == b.charAt(j-1)
         ){
          d[i][j] = Math.min(
            d[i][j],
            d[i - 2][j - 2] + cost
          )
			}
		}
	}
	return d[ a.length ][ b.length ];
}

module.exports = QMQ;
