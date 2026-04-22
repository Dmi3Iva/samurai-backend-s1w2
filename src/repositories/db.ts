import { MongoClient } from "mongodb";
import { IBlogType } from "../features/blogs/repository/blogs.repository";
import { IPostType } from "../features/posts/models/post.model";

const mongoURI: string = process.env.MONGO_URI || "mongodb://0.0.0.0:27017";

export const client = new MongoClient(mongoURI);

export const db = client.db("bloggersPlatform");

export const blogsDatabase = db.collection<IBlogType>("blogs");
export const postsDatabase = db.collection<IPostType>("posts");

export const runDB = async () => {
  try {
    await client.connect();

    await client.db("products").command({ ping: 1 });
    console.log("Connected successfully to mongo server 💽");
  } catch (e) {
    console.log("Failed to connect to mongo server ⛓️‍💥");
    client.close();
  }
};
