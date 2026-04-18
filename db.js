import mongoose from "mongoose";

export const dbConnect = () => {
  try {
    mongoose.connect(process.env.DATABASE_URL);
    console.log("Db ka connection is successfull");
  } catch (error) {
    console.log("Issue in Db connection");
    process.exit(1); //end the process with some failures
  }
};