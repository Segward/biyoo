const sqlite3 = require('sqlite3').verbose();
const source = "db.sqlite";

const db = new sqlite3.Database(source, (err) => {
  if (err)
    return console.error(err.message);
  console.log('Connected to the SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  channel_id TEXT,
  user_id INTEGER,
  reason TEXT,
  status TEXT DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

const dbCreateTicket = (id, channelId, userId, reason) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO tickets (id, channel_id, user_id, reason) VALUES (?, ?, ?, ?)';
    db.run(sql, [id, channelId, userId, reason], function(err) {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      resolve(this.lastID);
    });
  });
};

const dbGetTicket = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM tickets WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      resolve(row);
    });
  });
};

module.exports = { dbCreateTicket, dbGetTicket };

