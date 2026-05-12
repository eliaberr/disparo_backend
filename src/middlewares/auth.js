const jwt=require('jsonwebtoken');
module.exports=(req,res,next)=>{
 const token=req.headers.authorization?.replace('Bearer ','');
 if(!token) return res.status(401).end();
 req.user=jwt.verify(token,process.env.JWT_SECRET);
 next();
};