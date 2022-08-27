const mysql = require('mysql');
const { MYSQL_CONFIG } = require('../config/db');

connection = mysql.createConnection(MYSQL_CONFIG);

connection.connect();

function excSQL(sql) {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(result);
    })
  });
}

module.exports =  { excSQL };
  