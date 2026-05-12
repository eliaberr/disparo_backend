const User=require('../models/User');
const auth=require('../services/authService');
exports.register=async(req,res)=>{
 const {email,password}=req.body;
 const hash=await auth.hash(password);
 await User.create(email,hash);
 res.json({ok:true});
};
exports.login=async(req,res)=>{
 const {email,password}=req.body;
 const r=await User.findByEmail(email);
 if(!r.rows.length) return res.status(401).json({error:'invalid'});
 const ok=await auth.compare(password,r.rows[0].password);
 if(!ok) return res.status(401).json({error:'invalid'});
 res.json({token:auth.token(r.rows[0])});
};