// This file contains all Mongo DB Functions
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
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
const client = new MongoClient(URI,{
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const initialiseMongoDB = function() {
  async function run() {
    try {
      await client.connect();
      await client.db(DBNAME).command({ ping: 1 });
      console.log("Successfully connected to MDB");
      CollApps = await client.db(DBNAME).collection(Apps);
      CollQuestions = await client.db(DBNAME).collection(Questions);
      CollQmasters = await client.db(DBNAME).collection(Qmasters);
      CollGames = await client.db(DBNAME).collection(CollQMGame);
      // listDatabases(client);
    } finally { // This will close the client when you finish/error
      // console.log("Closing MDB");
      // await client.close();
    }
  }
  run().catch(console.dir);
}

async function listDatabases(client) {
  const collections = client.db(DBNAME).listCollections();
  // const names = await collections.toArray();
  // console.log(names);
  for await (const doc of collections) {
    console.log("Collections: "+doc.name);
  }
}

const createApp = async function(appobj,socket) {
  const res = await CollApps.insertOne(appobj);
  console.log("Inserted into collection Apps:" +res);
  socket.emit('infoResponse',"App created: "+appobj.appname);
}

const newQMaster = async function(qmobj,callback) {
  try {
    const res = await CollQmasters.insertOne(qmobj);
    console.log("Inserted into collection Qmaster:" +res);
    callback(true);
  } catch(err) {
    console.log(err);
  }
}

// check if the QMaster exist based on his id when trying to login.
const checkQMaster = async function(uid,callback) {
  // console.log("Check QMaster: "+uid);
  const result = CollQmasters.find({qmid:uid});
  const allValues = await result.toArray();
  if(typeof allValues != "undefined" && allValues.length > 0)
    callback(true);
  else
    callback(false);
}

// Insert a new question (document) in the questions collection
const insertQuestion = async function(qobj) {
  try {
    const res = await CollQuestions.insertOne(qobj);
//    console.log("1 question inserted:" +res.insertedId);
  } catch(err) {
    console.log(err);
  }
}

// update a question (document) with same qid
const updateQuestion = async function(qobj,callback) {
  const res = await CollQuestions.updateOne(
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
  });
//      console.log("Update question response: " +JSON.stringify(res));
  if(res.modifiedCount == 1) {
    callback(true);
  }
  else
    callback(false);
}

// Gets total number of questions
const getNumQuestions = async function(callback) {
  const res = await CollQuestions.countDocuments({});
  callback(res);
}

// Gets number of question per category
// Not sure why it is needed
const getNumQuestionsByCat = async function(cat,socket) {
  const res = await CollQuestions.countDocuments({category: cat});
  socket.emit('infoResponse',res);
}

// Clear the questions collection
// Used to load fresh questions - at start only
const clearAllQuestions = async function() {
  await CollQuestions.deleteMany({});
  console.log("Collection QMQuestion Deleted OK");
}

// Gets quizmaster object based on his name
const getQMByName = async function(qname,callback) {
  const names = CollQmasters.find({"qmname": qname});
  const result = await names.toArray();
  if(typeof result != "undefined" && result.length > 0) {
    console.log("QMaster found OK: "+result[0].qmname);
    callback(result[0]);
  }
}

const getQuestionsByCat = async function(cat,callback) {
//  console.log("Getting question for "+cat);
  const questions = CollQuestions.find({category:cat});
  const result = await questions.toArray();
  callback(result);
}
  
const getQuestionsByCatandSubcat = async function(cat,subcat,callback) {
//  console.log("Getting question for "+cat+":"+subcat);
  const questions = CollQuestions.find({category:cat,subcategory:subcat});
  const result = await questions.toArray();
  callback(result);
}

const getQuestionById = async function(id,callback) {
  // console.log("Getting question id "+id);
  const questions = CollQuestions.findOne({qid:Number(id)});
  const result = await questions.toArray();
  // console.log("q "+id+" details: "+result);
  callback(result);
}

const getGames = async function(id,callback) {
//  console.log("Getting Games for: "+id);
  const games = CollGames.find({qmid:id});
  const result = await games.toArray();
  callback(result);
}

// Check if game exists in games collection
const gameExists = async function(game,callback) {
  const games = await CollGames.findOne({qmid:game.qmid,gamename:game.gamename});
//    console.log("Games: "+ JSON.stringify(games));
    if(games)
      callback(true);
    else
      callback(false);
}

// Insert a new game in the games collection
const createNewGame = async function(game,callback) {
  game.accesscode = generateAccesscode();
  try {
    const res = await CollGames.insertOne(game);
    if(res)
      callback(true);
    else
      callback(false);
  } catch(err) {
    console.error(err);
  }
}

// Update a game in the games collection
const updateGame = async function(game,callback) {
  let obj = new Object();
  obj.$set = game;
  // object should end up like {$set: {qmid: 123xxx, gamename: xxxx, etc}}
  try {
    const res = await CollGames.updateOne({qmid:game.qmid,gamename:game.gamename}, obj);
    if(res)
      callback(true);
    else
      callback(false);
  } catch(err) {
    console.error(err);
  }
}

// Delete a game in the games collection
const deleteGame = async function(game,callback) {
  const res = await CollGames.deleteOne({qmid:game.qmid,gamename:game.gamename});
//    console.log("Res: "+ JSON.stringify(res));
  callback(true);
}

// get game details from DB to start or edit the game
const getGameByName = async function(id,name,callback) {
  const game = CollGames.find({qmid:id,gamename:name});
  const result = await game.toArray();
  // console.log(JSON.stringify(result));
  callback(result[0]);
}

// get game details from DB to start or edit the game
const getQuestionsByID = async function(qlist,callback) {
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
  const questions =  CollQuestions.find(qobj,{_id:false});
  const results = await questions.toArray();
  callback(results);
}

// get game from access code. used for selfplay
const getGameFromAccesscode = async function(qmid,ac,callback) {
  const res = await CollGames.findOne({qmid:qmid,accesscode:ac});
//    console.log("Game: "+ JSON.stringify(res));
  callback(res);
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
