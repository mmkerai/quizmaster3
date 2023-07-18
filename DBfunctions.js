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
const client = new MongoClient(URI,{useNewUrlParser: true,useUnifiedTopology: true});

const initialiseMongoDB = function() {
  console.log("Connecting to: "+DBNAME+" and URI: "+URI);
  client.connect(err => {
    if(err)
      console.log("MongoDB: "+err);
    else {
      console.log("MongoDB connected");
      CollApps = client.db(DBNAME).collection(Apps);
      CollQuestions = client.db(DBNAME).collection(Questions);
      CollQmasters = client.db(DBNAME).collection(Qmasters);
      CollGames = client.db(DBNAME).collection(CollQMGame);

      // listDatabases(client);
    }
  });
}

function listDatabases(client){
  client.db(DBNAME).listCollections().toArray(function(err, names) {
    if(!err)
    console.log(names);
  });
};

const createApp = function(appobj,socket) {
  CollApps.insertOne(appobj, function(err, res) {
    if (err) throw err;
    console.log("Inserted into collection Apps:" +res);
    socket.emit('infoResponse',"App created: "+appobj.appname);
  });
}

const newQMaster = function(qmobj,callback) {
  CollQmasters.insertOne(qmobj, function(err, res) {
    if (err) throw err;
    console.log("Inserted into collection Qmaster:" +res);
    callback(true);
  });
}

// check if the QMaster exist based on his id.
const checkQMaster = function(uid,callback) {
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
const insertQuestion = function(qobj) {
  CollQuestions.insertOne(qobj, function(err, res) {
    if (err) throw err;
//    console.log("1 question inserted:" +res.insertedId);
  });
}

// update a question (document) with same qid
const updateQuestion = function(qobj,callback) {
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
const getNumQuestions = function(callback) {
  CollQuestions.countDocuments({},function(err,result) {
		if (err) throw err;
    callback(result);
  });
}

// Gets number of question per category
// Not sure why it is needed
const getNumQuestionsByCat = function(cat,socket) {
  CollQuestions.countDocuments({category: cat},function(err,result) {
		if (err) throw err;
    socket.emit('infoResponse',result);
  });
}

// Clear the questions collection
// Used to load fresh questions - at start only
const clearAllQuestions = function() {
  CollQuestions.deleteMany({},function(err,result) {
		if (err) throw err;
    console.log("Collection QMQuestion Deleted OK");
    });
}

// Gets quizmaster object based on his name
const getQMByName = function(qname,callback) {
  CollQmasters.find({"qmname": qname}).toArray(function(err,result) {
    if(err) console.log("QM not found: "+qname);
    if(typeof result != "undefined" && result.length > 0) {
      console.log("QMaster found OK: "+result[0].qmname);
      callback(result[0]);
    }
  });
}

const getQuestionsByCat = function(cat,callback) {
//  console.log("Getting question for "+cat);
  CollQuestions.find({category:cat}).toArray(function(err,result) {
    if (err) console.log("No questions for: "+cat); 
    callback(result);
  });
}
  
const getQuestionsByCatandSubcat = function(cat,subcat,callback) {
//  console.log("Getting question for "+cat+":"+subcat);
  CollQuestions.find({category:cat,subcategory:subcat}).toArray(function(err,result) {
		if (err) console.log("No questions for: "+cat+" & "+subcat); 
    callback(result);
  });
}

const getQuestionById = function(id,callback) {
  console.log("Getting question id "+id);
  CollQuestions.find({qid:Number(id)}).toArray(function(err,result) {
    if (err) console.log("No question with id: "+id);
    // console.log("q "+id+" details: "+result);
    callback(result);
  });
}

const getGames = function(id,callback) {
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
const gameExists = function(game,callback) {
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
const createNewGame = function(game,callback) {
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
const updateGame = function(game,callback) {
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
const deleteGame = function(game,callback) {
  CollGames.deleteOne({qmid:game.qmid,gamename:game.gamename}, function(err, res) {
//    console.log("Res: "+ JSON.stringify(res));
    if (err) throw err;
    callback(true);
  });
}

// get game details from DB to start or edit the game
const getGameByName = function(id,name,callback) {
  CollGames.find({qmid:id,gamename:name}).toArray(function(err, results) {
    if (err) throw err;
    callback(results[0]);
  });
}

// get game details from DB to start or edit the game
const getQuestionsByID = function(qlist,callback) {
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

// get game from access code. used for selfplay
const getGameFromAccesscode = function(qmid,ac,callback) {
  CollGames.findOne({qmid:qmid,accesscode:ac}, function(err, res) {
    if (err) throw err;
//    console.log("Game: "+ JSON.stringify(res));
      callback(res);

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


module.exports = {initialiseMongoDB,
                checkQMaster,
                getGames,
                createApp,
                newQMaster,
                insertQuestion,
                updateQuestion,
                getNumQuestions,
                getNumQuestionsByCat,
                clearAllQuestions,
                getQMByName,
                getQuestionsByCat,
                getQuestionsByCatandSubcat,
                getQuestionById,
                gameExists,
                createNewGame,
                updateGame,
                deleteGame,
                getGameByName,
                getQuestionsByID,
                getGameFromAccesscode
              };
