// This file contains all Mongo DB Functions
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const Questions = "QMQuestion";
const Apps = "QMApp";
const Qmasters = "QMaster";
const CollQMGame = "QMGame";
const DBNAME = process.env.MONGODBNAME;
const URI = process.env.MONGOURI;
var CollApps = 0;
var CollQuestions = 0;
var CollQmasters = 0;
var CollGames = 0;

function DB() {
  const client = new MongoClient(URI,{useNewUrlParser: true,useUnifiedTopology: true});
  client.connect(err => {
    CollApps = client.db(DBNAME).collection(Apps);
    CollQuestions = client.db(DBNAME).collection(Questions);
    CollQmasters = client.db(DBNAME).collection(Qmasters);
    CollGames = client.db(DBNAME).collection(CollQMGame);
  });
  console.log("DB Class initialised");
}

DB.prototype.createApp = function(appobj,socket) {
  CollApps.insertOne(appobj, function(err, res) {
    if (err) throw err;
    console.log("Inserted into collection Apps:" +res);
    socket.emit('infoResponse',"App created: "+appobj.appname);
  });
}

DB.prototype.newQMaster = function(qmobj,callback) {
  CollQmasters.insertOne(qmobj, function(err, res) {
    if (err) throw err;
    console.log("Inserted into collection Qmaster:" +res);
    callback(true);
  });
}

// check if the QMaster exist based on his id.
DB.prototype.checkQMaster = function(uid,callback) {
  CollQmasters.find({qmid: uid}).toArray(function(err,result) {
    if (err) throw err;
//    console.log("Check QMaster: "+result);
    if(typeof result != "undefined" && result.length > 0)
      callback(true);
    else
      callback(false);
  });
}

// Insert a new question (document) in the questions collection
DB.prototype.insertQuestion = function(qobj) {
  CollQuestions.insertOne(qobj, function(err, res) {
    if (err) throw err;
//    console.log("1 question inserted:" +res.insertedId);
  });
}

// update a question (document) with same qid
DB.prototype.updateQuestion = function(qobj,callback) {
  CollQuestions.updateOne(
    {qid: Number(qobj.qid)}, 
    {$set: {
        "category" : qobj.category,
        "subcategory" : qobj.subcategory,
        "type" : qobj.type,
        "imageurl" : qobj.image,
        "question" : qobj.question,
        "difficulty" : qobj.difficulty,
        "answer" : qobj.answer
/*         "used" : qobj.used,    // these shouldn't be reset
        "correct" : qobj.correct */
      }
    },
    function(err, res) {
      if (err) throw err;
//      console.log("Update question response: " +JSON.stringify(res));
      if(res.modifiedCount == 1) {
        callback(true);
      }
      else
        callback(false);
    });
}

// Gets total number of questions
DB.prototype.getNumQuestions = function(callback) {
  CollQuestions.countDocuments({},function(err,result) {
		if (err) throw err;
    callback(result);
  });
}

// Gets number of question per category
// Not sure why it is needed
DB.prototype.getNumQuestionsByCat = function(cat,socket) {
  CollQuestions.countDocuments({category: cat},function(err,result) {
		if (err) throw err;
    socket.emit('infoResponse',result);
  });
}

// Clear the questions collection
// Used to load fresh questions - at start only
DB.prototype.clearAllQuestions = function() {
  CollQuestions.deleteMany({},function(err,result) {
		if (err) throw err;
    console.log("Collection QMQuestion Deleted OK");
    });
}

// Gets quizmaster object based on his name
DB.prototype.getQMByName = function(qname,callback) {
  CollQmasters.find({"qmname": qname}).toArray(function(err,result) {
    if(err) console.log("QM not found: "+qname);
    if(typeof result != "undefined" && result.length > 0) {
      console.log("QMaster found OK: "+result[0].qmname);
      callback(result[0]);
    }
  });
}

// This should not be called with PROD data as it is too long
/* DB.prototype.getQuestions = function(callback) {
//  console.log("Getting question");
  CollQuestions.find({}).toArray(function(err,result) {
    if (err) console.log("No questions"); 
    callback(result);
  });
} */

DB.prototype.getQuestionsByCat = function(cat,callback) {
//  console.log("Getting question for "+cat);
  CollQuestions.find({category:cat}).toArray(function(err,result) {
    if (err) console.log("No questions for: "+cat); 
    callback(result);
  });
}
  
DB.prototype.getQuestionsByCatandSubcat = function(cat,subcat,callback) {
//  console.log("Getting question for "+cat+":"+subcat);
  CollQuestions.find({category:cat,subcategory:subcat}).toArray(function(err,result) {
		if (err) console.log("No questions for: "+cat+" & "+subcat); 
    callback(result);
  });
}

DB.prototype.getQuestionById = function(id,callback) {
  console.log("Getting question id "+id);
  CollQuestions.find({qid:Number(id)}).toArray(function(err,result) {
    if (err) console.log("No question with id: "+id);
    // console.log("q "+id+" details: "+result);
    callback(result);
  });
}

DB.prototype.getGames = function(id,callback) {
//  console.log("Getting Games for: "+id);
  CollGames.find({qmid:id}).toArray(function(err,result) {
    if (err) {
      console.log("No games for QM id: "+id);
      throw(err);
    }
     // console.log("q "+id+" details: "+result);
    callback(result);
  });
}

// Check if game exists in games collection
DB.prototype.gameExists = function(game,callback) {
  CollGames.findOne({qmid:game.qmid,gamename:game.gamename}, function(err, res) {
    if (err) throw err;
//    console.log("Res: "+ JSON.stringify(res));
    if(res)
      callback(true);
    else
      callback(false);
  });
}

// Insert a new game in the games collection
DB.prototype.createNewGame = function(game,callback) {
  game.accesscode = generateAccesscode();
  CollGames.insertOne(game, function(err, res) {
    if (err) throw err;
    if(res)
      callback(true);
    else
      callback(false);
  });
}

// Update a game in the games collection
DB.prototype.updateGame = function(game,callback) {
  let obj = new Object();
  obj.$set = game;
  // object should end up like {$set: {qmid: 123xxx, gamename: xxxx, etc}}
  CollGames.updateOne({qmid:game.qmid,gamename:game.gamename}, obj, function(err, res) {
    if (err) throw err;
    if(res)
      callback(true);
    else
      callback(false);
  });
}

// Delete a game in the games collection
DB.prototype.deleteGame = function(game,callback) {
  CollGames.deleteOne({qmid:game.qmid,gamename:game.gamename}, function(err, res) {
//    console.log("Res: "+ JSON.stringify(res));
    if (err) throw err;
    callback(true);
  });
}

// get game details from DB to start or edit the game
DB.prototype.getGameByName = function(id,name,callback) {
  CollGames.find({qmid:id,gamename:name}).toArray(function(err, results) {
    if (err) throw err;
    callback(results[0]);
  });
}

// get game details from DB to start or edit the game
DB.prototype.getQuestionsByID = function(qlist,callback) {
  var arr = [];
  qlist.forEach(function (id,index) {
    let obj = new Object();
    obj.qid = Number(id);
    arr.push(obj);
  });
  let qobj = new Object();
  qobj.$or = arr;
 // the query should end up like: {$or:[{qid:2179},{qid:2181},]},{_id:false}
// console.log("Query str: "+JSON.stringify(qobj));
  CollQuestions.find(qobj,{_id:false}).toArray(function(err,results) {
    if (err) throw err;
    callback(results);
  });
}

// creates a random game access code for contestants to enter the game
function generateAccesscode() {
  var length = 8,
  charset = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ23456789",
  retVal = "";
  for(var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.random() * n);
  }
  return retVal;
}

/*
DB.prototype.getQMByEmail = function(obj,socket) {
  let checkqm = "SELECT * FROM "+DBNAME+"."+QMTable+" WHERE qmemail='"+obj.email+"'";
  pool.query(checkqm, function(err, results, fields) {
    if(err) {
      console.log("DB error: "+err.message);
    }
    if(results.length > 0) {
      console.log("Quizmaster Exists OK ");
//      AUTHUSERS[socket.id] = obj.email;
      socket.emit('loginResponse',obj.name);
    }
    else {
      console.log("QM does not exist");
      socket.emit('errorResponse',obj.name);
    }
  });
}

DB.prototype.createNewQM = function(obj,socket) {
  let qmaster = "INSERT INTO "+DBNAME+"."+QMTable+" VALUES (0,'"+
                  obj.sub+"','"+
                  obj.name+"','"+
                  obj.email+"','"+
                  '1234567'+"','"+
                  '1234567'+"','"+
                  new Date().toISOString()+"');";
  pool.query(qmaster, function(err, results, fields) {
    if(err) {
      console.log("DB error: "+err.message);
    }
    if(results) {
      console.log("New Quizmaster Registered OK");
      socket.emit('registerQMResponse',results);
    }
  });
}

DB.prototype.createNewGame = function(obj,socket) {
  let acode = generateAccesscode();
  let query = "INSERT INTO "+DBNAME+"."+GameTable+" VALUES (0,'"+
                  obj.qmid+"','"+
                  obj.numquestions+"','"+
                  obj.timelimit+"','"+
                  obj.gamename+"','"+
                  obj.gametype+"','"+
                  acode+"','"+
                  obj.questions+"');";
  pool.query(query, function(err, results, fields) {
    if(err) {
      console.log("DB error: "+err.message);
    }
    if(results) {
      console.log("New Game Created OK");
      socket.emit('newGameResponse',results);
    }
  });
}

DB.prototype.getGameByID = function(qmid,gameid,callback) {
  let query = "SELECT * FROM "+DBNAME+"."+GameTable+" WHERE qmid='"+qmid+"' AND gameid='"+gameid+"'";
  pool.query(query,function(err,results,fields) {
    if(err) {
      console.log("DB error: "+err.message);
    }
    if(results.length > 0) {
//      console.log("Getting game ID "+JSON.stringify(results));
      callback(results[0]);
    }
    else {
      console.log("No game ID: "+gameid);
    }
  });
}

DB.prototype.getQuestionByID = function(qid,callback) {
  let query = "SELECT * FROM "+DBNAME+"."+QTable+" WHERE qid='"+qid+"'";
    pool.query(query,function(err,results,fields) {
    if(err) {
      console.log("DB error: "+err.message);
      return;
    }
    if(results.length > 0) {
      callback(results[0]);   // should only be one question returned for each id
    }
    else {
      console.log("No question ID: "+qid);
    }
  });
}

// This function gets the list of questions from the question table in an array all in one query
// unlike above function which only returns one question at a time
DB.prototype.getQuestionsByID = function(qlist,callback) {
  let array = JSON.parse("[" + qlist + "]");
  let qstr = " WHERE qid="+array[0];
  for(var i=1;i < array.length;i++) {
    qstr = qstr + " OR qid="+array[i];
  }
//  console.log("Q query = "+qstr);
  let query = "SELECT * FROM "+DBNAME+"."+QTable+qstr;
    pool.query(query,function(err,results,fields) {
    if(err) {
      console.log("DB error: "+err.message);
      return;
    }
    if(results.length > 0) {
      callback(results);   // list of questions
    }
    else {
      console.log("No question ID: "+qlist);
    }
  });
}

DB.prototype.getQuestionsByCatandSubcat = function(cat,subcat,socket) {
  console.log("Getting question for "+cat+":"+subcat);
  let query = "SELECT * FROM "+DBNAME+"."+QTable+" WHERE category='"+cat+"' AND subcategory='"+subcat+"'";
  pool.query(query, function(err,results,fields) {
    if(err) {
      console.log("DB error: "+err.message);
    }
    if(results.length > 0) {
      socket.emit("getQuestionsResponse",results);
    }
    else {
      console.log("No questions");
      socket.emit('errorResponse',"No questions");
    }
  });
}
*/

module.exports = DB;
