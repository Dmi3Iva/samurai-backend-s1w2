import { MongoClient } from "mongodb";
import { IBlogType } from "../features/blogs/models/blog.model";
import { IPostType } from "../features/posts/models/post.model";
import "dotenv/config";

const mongoURI: string = process.env.MONGO_URI || "mongodb://0.0.0.0:27017";
console.log("mongoURI", mongoURI);

export const client = new MongoClient(mongoURI);

export const db = client.db("bloggersPlatform");

export const blogsDatabase = db.collection<IBlogType>("blogs");
export const postsDatabase = db.collection<IPostType>("posts");

export const runDB = async () => {
  try {
    await client.connect();

    await client.db("bloggersPlatform").command({ ping: 1 });
    console.log("Connected successfully to mongo server 💽");
  } catch (e) {
    console.log("Failed to connect to mongo server ⛓️‍💥");
    client.close();
  }
};
