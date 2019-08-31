// This file contains all DB Functions
const mysql = require('mysql');
const util = require('util');
require('dotenv').config();
const QTable = "QMQuestion";
const AppTable = "QMApp";
const QMTable = "QMaster";
const GameTable = "QMGame";
const DBNAME = process.env.SQLDBName;
var pool;

function DB() {
    pool = mysql.createPool({
    connectionLimit: 10,
    //    socketPath: '/cloudsql/nodejs-mmk1:europe-west1:quizmaster-dev',
    host: process.env.DBHost,
    user: process.env.SQLUserName,
    password: process.env.SQLPassword,
    database: DBNAME
  });

pool.query = util.promisify(pool.query);
console.log("DB Class initialised");
}

DB.prototype.query = function(dbq,socket) {
  pool.query(dbq, function(err, results, fields) {
    if(err) {
      console.log("DB error: "+err.message);
      socket.emit('errorMessage',"DB error: "+err.message);
    }
    if(results) {
      console.log("DB Table OK");
      socket.emit('getQuestionsResponse',results);
    }
  });
}

DB.prototype.createQTable = function(socket) {
let createQTable = "create table if not exists QMQuestion(\
                qid int primary key auto_increment,\
                used int not null default 0,\
                correct int not null default 0,\
                category varchar(32) not null,\
                subcategory varchar(32) not null,\
                difficulty varchar(8) not null,\
                type varchar(16) not null,\
                question text not null,\
                imageurl text not null,\
                answer text not null) ENGINE = InnoDB AUTO_INCREMENT = 2171000";

pool.query(createQTable, function(err, results, fields) {
  if(err) {
    console.log("DB error: "+err.message);
  }
  if(results) {
    console.log("Question Table OK");
    socket.emit('infoResponse',results);
  }
});
}

DB.prototype.createDBTables = function(socket) {
let createAppTable = "create table if not exists QMApp(\
                appid int primary key auto_increment,\
                appname varchar(32) not null,\
                appemail varchar(32) not null,\
                appurl varchar(128) not null,\
                appsecret varchar(32) not null,\
                appipaddress varchar(16) not null,\
                password varchar(64) not null,\
                regdate datetime not null,\
                regusers int not null default 0,\
                numrequests int not null default 0) ENGINE = InnoDB AUTO_INCREMENT = 1171000";

  pool.query(createAppTable, function(err, results, fields) {
  if(err) {
    console.log("DB error: "+err.message);
  }
  if(results) {
    console.log("App Table OK");
    socket.emit('infoResponse',results);
  }
});

let createGameTable = "create table if not exists QMGame(\
                gameid int primary key auto_increment,\
                qmid int not null default 0,\
                numquestions int not null default 0,\
                timelimit int not null default 0,\
                gamename varchar(32) not null,\
                gametype varchar(8) not null,\
                accesscode varchar(8) not null,\
                questions text) ENGINE = InnoDB AUTO_INCREMENT = 3171000";

pool.query(createGameTable, function(err, results, fields) {
  if(err) {
    console.log("DB error: "+err.message);
  }
  if(results) {
    console.log("Game Table OK");
    socket.emit('infoResponse',results);
  }
});

let createQuizmasterTable = "create table if not exists QMaster(\
                qmid int primary key auto_increment,\
                appid int not null,\
                qmname varchar(32) not null,\
                qmemail varchar(32) not null,\
                password varchar(64) not null,\
                lastipaddress varchar(16) not null,\
                lastlogin varchar(32) not null) ENGINE = InnoDB AUTO_INCREMENT = 4171000";

pool.query(createQuizmasterTable, function(err, results, fields) {
  if(err) {
    console.log("DB error: "+err.message);
  }
  if(results) {
    console.log("Quizmaster Table OK");
    socket.emit('infoResponse',results);
  }
});

let createContestantTable = "create table if not exists QMContestant(\
                qmcid int primary key auto_increment,\
                gameid int not null default 0,\
                qmcname varchar(32) not null,\
                qmcemail varchar(32) not null,\
                accesscode varchar(32) not null,\
                answers text,\
                scores text) ENGINE = InnoDB AUTO_INCREMENT = 5171000";

pool.query(createContestantTable, function(err, results, fields) {
  if(err) {
    console.log("DB error: "+err.message);
  }
  if(results) {
    console.log("Contestant Table OK");
    socket.emit('infoResponse',results);
  }
});

}

DB.prototype.createTestApp = function(socket) {
let testapp = "INSERT INTO "+DBNAME+"."+AppTable+" VALUES (0,\
                'Quizmaster1',\
                'thecodecentre@gmail.com',\
                'url.com',\
                'secret',\
                '1.1.1.1',\
                'hashedpwd',\
                '2018-10-22 12:00:00',\
                0,0)";

pool.query(testapp, function(err, results, fields) {
  if(err) {
    console.log("DB error: "+err.message);
  }
  if(results) {
    console.log("Test App Quizmaster1 OK");
    socket.emit('infoResponse',results);
  }
});

}

DB.prototype.insertQuestion = function(obj) {
//  let obj = JSON.parse(qstr,'utf8');
  let insq = "INSERT INTO "+DBNAME+"."+QTable+" VALUES (0,0,0,'"+
              obj.Category+"','"+
              obj.Subcategory+"','"+
              obj.Difficulty+"','"+
              obj.Type+"','"+
              obj.Question+"','"+
              obj.Image+"','"+
              obj.Answer+"');";

pool.query(insq, function(err, results, fields) {
  if(err) {
    console.log("DB error: "+err.message);
  }
  if(results) {
//    console.log("Question inserted OK");
  }
});

}

DB.prototype.getNumQuestionsByCat = function(cat,socket) {
  let query = "SELECT COUNT(*) FROM "+QTable+" WHERE category='"+cat+"'";
  pool.query(query, function(err, results, fields) {
    if(err) {
      console.log("DB error: "+err.message);
      socket.emit('errorMessage',"DB error: "+err.message);
    }
    if(results) {
      console.log("DB Query getNumQuestions OK");
      socket.emit('infoResponse',results);
    }
  });
}

DB.prototype.clearAllQuestions = function() {
  let query = "TRUNCATE TABLE "+QTable;
  pool.query(query, function(err, results, fields) {
    if(err) {
      console.log("DB error: "+err.message);
    }
    if(results) {
      console.log("DB QMQuestion Deleted OK");
    }
  });
}

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

DB.prototype.getQMByName = function(qname,callback) {
  let checkqm = "SELECT * FROM "+DBNAME+"."+QMTable+" WHERE qmname='"+qname+"'";
  pool.query(checkqm, function(err,results,fields) {
    if(err) {
      console.log("DB error: "+err.message);
      return;
    }
    if(results.length > 0) {
      console.log("Quizmaster Exists OK "+results[0].qmname);
      callback(results[0]);
    }
    else {
      console.log("QM does not exist: "+qname);
      callback(results[0]);
    }
  });
}

DB.prototype.getGames = function(qmid,callback) {
  let checkqm = "SELECT * FROM "+DBNAME+"."+GameTable+" WHERE qmid='"+qmid+"'";
  pool.query(checkqm, function(err,results,fields) {
    if(err) {
      console.log("DB error: "+err.message);
    }
    else
      callback(results);
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

function generateAccesscode() {
  var length = 8,
  charset = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ23456789",
  retVal = "";
  for(var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.random() * n);
  }
  return retVal;
}

module.exports = DB;
