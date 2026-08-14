import "dotenv/config";
import { ConnectionStates, connect, connection } from "mongoose";

const dbName = "bloggersPlatform";
const mongoURI: string = process.env.MONGO_URI || "mongodb://0.0.0.0:27017";

export const runDB = async () => {
  try {
    await connect(mongoURI, { dbName, serverSelectionTimeoutMS: 10000 });

    if (connection.readyState !== ConnectionStates.connected) {
      throw new Error("Mongoose readyState is not connected");
    }
  } catch (e) {
    console.log("Failed to connect to mongo server ⛓️‍💥 ", e);
    connection.close();
  }
};
