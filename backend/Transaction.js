const mongoose=require('mongoose');
const transactionSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    amount:{
        type:Number,
        required:true
    },
    type:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
    }
});

const Transaction=mongoose.model('Transaction',transactionSchema);

module.exports=Transaction;