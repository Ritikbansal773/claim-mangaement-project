import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectioninstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`
    );
    console.log(
      `\n mongodb is connected !! db host: ${connectioninstance.connection.host}`
    ); // this is to see which database server we are connectd to
  } catch (error) {
    console.log("MONGODB connection error", error);
    process.exit(1);
  }
};

export default connectDB;
