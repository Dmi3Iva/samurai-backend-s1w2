import { MongoClient, OptionalId } from "mongodb";
import { IBlogType } from "../features/blogs/models/blog.model";
import { IPostType } from "../features/posts/models/post.model";
import "dotenv/config";
import { IUserType } from "../features/users/models/users.model";
import { ICommentType } from "../features/comments/comments.models";
import { IAuthType } from "../features/auth/models/auth.model";

const mongoURI: string = process.env.MONGO_URI || "mongodb://0.0.0.0:27017";

export const client = new MongoClient(mongoURI);

export const db = client.db("bloggersPlatform");

export const blogsDatabase = db.collection<IBlogType>("blogs");
export const postsDatabase = db.collection<IPostType>("posts");
export const usersDatabase = db.collection<IUserType>("users");
export const commentsDatabase = db.collection<ICommentType>("comments");
export const authDatabase = db.collection<IAuthType>("auth");

export const runDB = async () => {
  try {
    await client.connect();

    await client.db("bloggersPlatform").command({ ping: 1 });
  } catch (e) {
    console.log("Failed to connect to mongo server ⛓️‍💥");
    client.close();
  }
};
