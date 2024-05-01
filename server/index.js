import app from "./app.js";
import connectToDb from "./config/dbConnection.js";


const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  await connectToDb();
  console.log(`🔴 server is running at port::${process.env.PORT}`);
});
