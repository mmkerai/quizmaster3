const util = require('util')
const mysql = require('mysql')
require('dotenv').config()
const DBNAME = process.env.SQLDBName;

const pool = mysql.createPool({
    connectionLimit: 10,
    //    socketPath: '/cloudsql/nodejs-mmk1:europe-west1:quizmaster-dev',
    host: process.env.DBHost,
    user: process.env.SQLUserName,
    password: process.env.SQLPassword,
    database: DBNAME
});
/*
// Ping database to check for common exception errors.
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }

    if (connection) connection.release();

    return;
});
*/
// Promisify for Node.js async/await.
pool.query = util.promisify(pool.query);
console.log("DB init");
module.exports = pool;
