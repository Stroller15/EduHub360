import mongoose from "mongoose"

mongoose.set('strictQuery', false);

const connectToDb = async() => {
    try {
        const {connection} = await mongoose.connect((process.env.MONGO_URL), {
            dbName: "eduhub360"
        });

        if(connection) {
        console.log(`\n 🟢Mongodb connected !! DB Host: ${connection.host}`);
        }
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

export default connectToDb;