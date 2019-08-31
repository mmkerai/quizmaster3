// This file contains all Questions Functions
require('dotenv').config();
//const dl = require('damerau-levenshtein-js');

const db = require('./DBfunctions.js');
var Dbt = new db();

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

var AllQuestions = new Object();    //list of all questions by question id
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

QMQ.prototype.clearAllQuestions = function() {
  AllQuestions = new Object();
}

QMQ.prototype.insertQuestion = function(qstr,id) {
  let obj = JSON.parse(qstr,'utf8');
  let qm = new QMQuestion(id,
                obj.Category.toUpperCase(),
                obj.Subcategory.toUpperCase(),
                obj.Difficulty.toUpperCase(),
                obj.Type.toUpperCase(),
                obj.Question,
                obj.Image,
                obj.Answer);

  AllQuestions[id] = qm;
  return qm;
}

QMQ.prototype.updateQuestion = function(obj) {
  let qm = AllQuestions[obj.qid];
  qm.category = obj.category;
  qm.subcategory = obj.subcategory;
  qm.type = obj.type;
  qm.imageurl = obj.imageurl;
  qm.question = obj.question;
  qm.difficulty = obj.difficulty;
  qm.answer = obj.answer;

  AllQuestions[obj.qid] = qm;
  return qm;
}

QMQ.prototype.getNumQuestions = function() {
  return Object.keys(AllQuestions).length;
}

QMQ.prototype.getQuestionsByCat = function(cat) {
  var catlist = new Array();
  Object.keys(AllQuestions).forEach(key => {
    if(AllQuestions[key].category == cat) {
      catlist.push(AllQuestions[key]);
    }
  });
  return catlist;
}

QMQ.prototype.getQuestionById = function(id) {
  if(AllQuestions[id] != 'undefined')
    return(AllQuestions[id]);

  console.log(id+" question does not exist");
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

QMQ.prototype.getQTypes = function() {
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

// check all values are valid and sanitise for inserting into database
QMQ.prototype.validatequestion = function(jstr) {
  let qobj = JSON.parse(jstr,'utf8');
  let newq = new Object();
  let subcats = new Array();
  let scexists = 0;
  newq["Difficulty"] = qobj.Difficulty.toUpperCase();
  newq["Type"] = qobj.Type.toUpperCase();
  newq["Category"] = qobj.Category.toUpperCase();
  newq["Subcategory"] = qobj.Subcategory.toUpperCase();
  newq["Question"] = mysql_real_escape_string(qobj.Question);
  newq["Image"] = qobj.Image;
  newq["Answer"] = mysql_real_escape_string(qobj.Answer);

    if(QDIFF[newq.Difficulty] == null) {
      console.log("Difficulty invalid: "+jstr);
      return null;
    }
    if(QTYPE[newq.Type] == null) {
      console.log("Question Type invalid: "+jstr);
      return null;
    }
    if(QCAT[newq.Category] == null) {
      console.log("Question Category invalid: "+jstr);
      return null;
    }
    subcats = QCAT[newq.Category];
    for(var i in subcats) {
      if(subcats[i] == newq.Subcategory)
        scexists = 1;
    }
    if(!scexists) {
      console.log("Question SubCategory invalid: "+jstr);
      return null;
    }
    return newq;
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

function mysql_real_escape_string(str) {
    if (typeof str != 'string')
        return str;

    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
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
