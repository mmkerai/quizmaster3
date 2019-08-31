module.exports = function (pool) {
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
  if (err) {
    str = "DB error: "+err.message;
  }
  if (results) {
    str = "DB Table OK: QMQuestion";
  }
  console.log(str);
});

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
  if (err) {
    str = "DB error: "+err.message;
  }
  if (results) {
    str = "DB Table OK: QMApp";
  }
  console.log(str);
});

let createGameTable = "create table if not exists QMGame(\
                gameid int primary key auto_increment,\
                qmasterid int not null default 0,\
                numquestions int not null default 0,\
                timelimit int not null default 0,\
                gamename varchar(32) not null,\
                questionmethod varchar(64) not null,\
                questions text) ENGINE = InnoDB AUTO_INCREMENT = 3171000";

pool.query(createGameTable, function(err, results, fields) {
  if (err) {
    str = "DB error: "+err.message;
  }
  if (results) {
    str = "DB Table OK: QMGame";
  }
  console.log(str);
});

let createQuizmasterTable = "create table if not exists QMaster(\
                qmasterid int primary key auto_increment,\
                appid int not null default 0,\
                qmname varchar(32) not null,\
                qmemail varchar(32) not null,\
                password varchar(64) not null,\
                lastipaddress varchar(16) not null,\
                lastlogin date not null) ENGINE = InnoDB AUTO_INCREMENT = 4171000";

pool.query(createQuizmasterTable, function(err, results, fields) {
  if (err) {
    str = "DB error: "+err.message;
  }
  if (results) {
    str = "DB Table OK: QMaster";
  }
  console.log(str);
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
  if (err) {
    str = "DB error: "+err.message;
  }
  if (results) {
    str = "DB Table OK: QMContestant";
  }
  console.log(str);
});

};
