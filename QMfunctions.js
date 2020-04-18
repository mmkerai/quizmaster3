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
    this.games = [];    //all the games created by this QM
  }
};

// This is used when a game starts
class QMGame {
      constructor(game) {
          this.gameid = game.gameid;
          this.qmid = game.qmid;
          this.gamename = game.gamename;
          this.numquestions = game.numquestions;
          this.timelimit = game.timelimit;    // time per question in seconds
          this.gametype = game.gametype;
          this.accesscode = game.accesscode;
          this.questions = game.questions;
          this.contestants = new Object();
          this.cqno = 0;   // current question number - 0:game hasnt started, -1 = game finished
          this.qstarttime;   // question start time in unix time
          this.answers = 0;   // no of answers received for current question. Reset after each question
      }
};

// This is used when a game starts. One object per contestant
class QMContestant {
      constructor(cname) {
          this.cname = cname;
//          this.sid = socketid;
          this.answers = [];    // list of answers, could be text, numbers or multichoice
          this.points = [];
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
    PUBQUIZ:'pubquiz',ONEQUIZ:'onequiz',FUNQUIZ:'funquiz'};

var ActiveGames = new Object();    //list of all active games in play by id
var AccessCodes = new Object();    //list of all accesscodes for active games
var Contestants = new Object();    //list of all contestants for active games

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

QMQ.prototype.createTestApp = function(socket) {
  const myobj = new QMApp("testapp","thecodecentre@gmail.com","url.com","1.1.1.1","hashpwd");
  Dbt.createApp(myobj,socket);
}

QMQ.prototype.createQMaster = function(qm) {
  const myobj = new QMaster(qm,"1.1.1.1");  // needs qm info plus ip address
  return myobj;
}

QMQ.prototype.gameReady = function(game) {
  let newg = new QMGame(game);
  ActiveGames[game.gameid] = newg;    // add game to the list
/*  var array = JSON.parse("[" + game.questions + "]");
  let qarray = [];
  // array contains a list of question IDs. Now convert from ID to the question object
  // only valid while game is active
  for(var i in array) {
    let q = Dbt.getQuestionByID(array[i],function(q) {
//      console.log("Push q");
      qarray.push(q);
      ActiveGames[game.gameid].questions = qarray;
    });
  } */
  Dbt.getQuestionsByID(game.questions,function(qs) {
    ActiveGames[game.gameid].questions = qs;
  });
  
  AccessCodes[game.accesscode] = game.gameid;   // build list of accesscodes so its quicker to join later
  return(newg);
}

QMQ.prototype.getActiveGame = function(gameid) {
  let game = ActiveGames[gameid];
  if(game) {
    if(game.cqno == -1)   // game has finished
      return(null);
    else {
      return(game);
    }
  }
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

QMQ.prototype.checkGameTypes = function(gtype) {
  if(GTYPE.hasOwnProperty(gtype))
    return(true);

  return(false);
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

QMQ.prototype.getGameQuestions = function(game) {
  if(ActiveGames[game.gameid] !== 'undefined') {
//    console.log("Game q: "+JSON.stringify(ActiveGames[game.gameid].questions));
    return(ActiveGames[game.gameid].questions);
  }
  else {
    console.log("No game id");
  }
}

// Contestant joins an active game
// If token already exists then use same contestant else create a new contestant
QMQ.prototype.joinGame = function(contestant) {
  const gameid = AccessCodes[contestant.accesscode];    // get game id if access code matches
  const token = contestant.token;
//  console.log("c access code:"+contestant.accesscode);
//  console.log("game:"+gameid);
  let game = ActiveGames[gameid];
  if(game) {
    if(game.cqno == -1)    // game has finished, so cant join
      return;
// check that this is a existing contestant re-logging in and not new contestant with an old token
    if(Contestants[token] && ActiveGames[gameid].contestants[token])
      return(game);   // existing contestant
    // new contestant
    let con = new QMContestant(contestant.userid);
    ActiveGames[gameid].contestants[token] = con; // add this contestant
    Contestants[token] = game.gameid;    // save the game for this contestant
    return(game);  // return the game object
    }
  else
    console.log("Access code invalid: "+contestant.accesscode);
}

// Contestant submits an answer to a question.
// Need to register it so points can be calculated later
QMQ.prototype.registerAnswer = function(answer,token) {
  let gameid = Contestants[token];    // get game id for this contestant
  if(gameid) {
    let game = ActiveGames[gameid];
    if(game.cqno == -1) {  // game has finished, so cant accept answer
      console.log("Game finished");
      return null;
    }

    let points = checkAnswer(game,answer);
    if(points == -1) {  
      console.log("answer received too late");
      return null;
    }
    console.log("Points: "+points);
    game.contestants[token].answers[game.cqno] = answer;
    game.contestants[token].points[game.cqno] = points;
    game.contestants[token].totals += points; // increment total points
    game.answers++;
    return game;
  }
  else
    console.log("Invalid User");
}

// get the contestant points for this specific question.
// Usually called after each question
QMQ.prototype.getContestantPoints = function(game) {
  let result = [];
  for(var i in game.contestants) {
    let c = new Object();
    c["cname"] = game.contestants[i].cname;
    c["points"] = game.contestants[i].points[game.cqno];
    result.push(c);
  }
  return(result);
}

// get the contestant total scores.
// Usually called after end of game
QMQ.prototype.getContestantScores = function(gameid) {
  let result = [];
  let game = ActiveGames[gameid];
  if(game) {
    for(var i in game.contestants) {
      let c = new Object();
      c["cname"] = game.contestants[i].cname;
      c["points"] = game.contestants[i].totals;
      result.push(c);
    }
    return(result);
  }
}

// Games finished - housekeeping 
QMQ.prototype.endOfGame = function(gameid) {
  delete ActiveGames[gameid];
}

// check if answer received is correct if so calc points based on time
// If answer is a number or string of 3 or less chars then it must be exact match
// If longer string then dl distance must be less than half the number of chars in correct answers
// e.g. if answer is cat then there must be an exact match
// if answer is mangosteen then up to 4 spelling errors are allowed
function checkAnswer(game,ans) {
  console.log("Ans is: "+ans);
  let q = game.questions[game.cqno];
  let dlmax = q.answer.length;
  let dldist = dlevenshtein(q.answer.toLowerCase(),ans.toLowerCase());
//  console.log("dl distance: "+dldist);
  if((q.type='number' && q.answer == ans) ||
    (dlmax <= 3 && q.answer.toLowerCase() == ans.toLowerCase()) ||
    (q.type!='number' && dlmax > 3 && dldist < dlmax/2))
    {
      let response = new Date() - game.qstarttime;  // in milliseconds
      console.log("response time is: "+response);
      let maxt = game.timelimit * 1000;   // convert to milliseconds
      if(response > maxt)   // shouldnt happen
        return -1;
      let points = ((maxt - response) * 100)/maxt; // max points is 100
      return(Math.floor(points));
    }
  return(0);
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
