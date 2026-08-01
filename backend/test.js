require("dotenv").config();
const{MongoClient}=require("mongodb");

async function main(){
    try{
        console.log("Connecting....");
        const client=new MongoClient(process.env.MONGO_URI);

        await client.connect();

        console.log("Connected successfully!");

        await client.db("admin").command({ping: 1});
        console.log("Ping successful");

        await client.close();
    }
    catch(err){
        console.error(err);
    }
}
main();