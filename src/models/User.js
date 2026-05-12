const db=require('../config/db');
exports.findByEmail=(email)=>db.query('select * from users where email=$1',[email]);
exports.create=(email,password)=>db.query('insert into users(email,password) values($1,$2)',[email,password]);