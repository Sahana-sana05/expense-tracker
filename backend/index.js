require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const authMiddleware=require('./authMiddleware')
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const User=require('./User');
const express=require('express');
const cors=require('cors');
const mongoose=require('mongoose');
const Transaction=require('./Transaction');
const Budget=require('./Budget');
const app = express();

app.use(express.json());
app.use(cors());

const PORT=3000;

console.log("URI =",process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
.then(function(){
    console.log('MongoDB Atlas connected!');
})
.catch(function(error){
    console.log('MongoDB connection error:', error);
});



app.get('/',function(req,res){
    res.send('Hello from Expense Tracker Backend!');
});


app.get('/transactions', authMiddleware, function(req,res){
    Transaction.find()
    .then(function(transactions){
        res.json(transactions);
    })
    .catch(function(error){
        res.status(500).json({error: error.message});
    });
    
});


app.post('/transactions',authMiddleware, function(req, res) {
  const newTransaction = new Transaction({
    title: req.body.title,
    amount: req.body.amount,
    type: req.body.type,
    category:req.body.category
  });
  newTransaction.save()
  .then(function(savedTransaction){
    res.json(savedTransaction);
  })
  .catch(function(error){
    res.status(500).json({error: error.message})
  });

});


app.delete('/transactions/:id',authMiddleware,function(req,res){
    Transaction.findByIdAndDelete(req.params.id)
    .then(function(){
        res.json({message:'Transaction deleted'});

    })
    .catch(function(error){
        res.status(500).json({error:error.message});
    });
});

app.get('/budgets',function(req,res){
    Budget.find()
    .then(function(budgets){
        res.json(budgets);
    })
    .catch(function(error){
        res.status(500).json({error:error.message});
    });
});

app.post('/budgets',function(req,res){
    Budget.findOneAndUpdate(
        {category:req.body.category},
        {limit:req.body.limit},
        {upsert:true,new:true}
    )
    .then(function(budget){
        res.json(budget);
    })
    .catch(function(error){
        res.status(500).json({error:error.message});
    });
});

app.post('/signup', function(req,res){
    bcrypt.hash(req.body.password,10)
    .then(function(hashedPassword){
        const newUser=new User({
            email:req.body.email,
            password:hashedPassword
        });
        return newUser.save();
    })
    .then(function(savedUser){
        res.json({message:'User created successfully'});
    })
    .catch(function(error){
        res.status(500).json({error:error.message});
    });
});

app.post('/login',function(req,res){
    let foundUser;

    User.findOne({email:req.body.email})
    .then(function(user){
        if(!user){
            res.status(400).json({error:'User not found'});
            return null;
        }
        foundUser=user;
        return bcrypt.compare(req.body.password,user.password);
    })
    .then(function(isMatch){
        if(isMatch===null){
            return;
        }
        if(!isMatch){
            res.status(400).json({error:'Incorrect password'});
            return;
        }
        const token=jwt.sign({userId:foundUser._id},process.env.JWT_SECRET,{expiresIn: '1h'});
        res.json({token:token});
    })
    .catch(function(error){
        res.status(500).json({error:error.message});
    });
});

app.listen(PORT,function(){
    console.log('Server is running on http://localhost:'+ PORT);
});
