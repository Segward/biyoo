const sqlite3 = require('sqlite3').verbose();
const source = "db.sqlite";

const db = new sqlite3.Database(source, (err) => {
  if (err)
    return console.error(err.message);
  console.log('Connected to the SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coins INTEGER DEFAULT 0
)`);

const dbAddUser = (id) => {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO users (id, coins) VALUES (?, 0)`, [id], function(err) {
      if (err) {
        return reject(err);
      }
      resolve(this.lastID);
    });
  });
}

const dbGetUser = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row);
    });
  });
}

const dbAddCoins = (id, amount) => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET coins = coins + ? WHERE id = ?`, [amount, id], function(err) {
      if (err) {
        return reject(err);
      }
      resolve(this.changes);
    });
  });
}

const dbSubCoins = (id, amount) => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET coins = coins - ? WHERE id = ?`, [amount, id], function(err) {
      if (err) {
        return reject(err);
      }
      resolve(this.changes);
    });
  });
}

module.exports = {
  dbAddUser,
  dbGetUser,
  dbAddCoins,
  dbSubCoins
};
