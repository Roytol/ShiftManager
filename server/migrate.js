const db = require('./db');

db.serialize(() => {
    db.run("ALTER TABLE users ADD COLUMN employee_code TEXT", (err) => {
        if (err) {
            console.log("Column employee_code might already exist or error:", err.message);
        } else {
            console.log("Added column employee_code");
        }
    });

    db.run("ALTER TABLE users ADD COLUMN birthdate TEXT", (err) => {
        if (err) {
            console.log("Column birthdate might already exist or error:", err.message);
        } else {
            console.log("Added column birthdate");
        }
    });
});
