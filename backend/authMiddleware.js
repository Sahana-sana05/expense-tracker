const jwt=require('jsonwebtoken');
function authMiddleware(req,res,next){
    const authHeader=req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({error:'No token provided'});

    }

    const token=authHeader.split(' ')[1];

    jwt.verify(token,process.env.JWT_SECRET,function(error,decoded){
        if(error){
            return res.status(401).json({error:'Invalid token'});
        }
        
        req.userId=decoded.userId;
        next();
    });
}
module.exports=authMiddleware;