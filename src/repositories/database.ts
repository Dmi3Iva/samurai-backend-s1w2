import { IBlogType } from "../features/blogs/blog.model";
import { IPostType } from "../features/posts/models/post.model";
import "dotenv/config";
// import { IUserType } from "../features/users/models/user-types";
import { ICommentType } from "../features/comments/comments.types";
// import { IRateLimitType } from "../features/rate-limit/rate-limit.model";
import mongoose, { ConnectionStates } from "mongoose";

const dbName = "bloggersPlatform";
const mongoURI: string = process.env.MONGO_URI || "mongodb://0.0.0.0:27017";

// export const blogsDatabase = mongoose.connection.collection<IBlogType>("blogs");
// export const postsDatabase = mongoose.connection.collection<IPostType>("posts");
// export const usersDatabase = mongoose.connection.collection<IUserType>("users");
export const commentsDatabase =
  mongoose.connection.collection<ICommentType>("comments");
// export const authDatabase = mongoose.connection.collection<IAuthType>("auth");
// export const rateLimitDatabase =
// mongoose.connection.collection<IRateLimitType>("rate_limit");

export const runDB = async () => {
  try {
    await mongoose.connect(mongoURI + "/" + dbName);

    if (mongoose.connection.readyState !== ConnectionStates.connected) {
      throw new Error("Mongoose readyState is not connected");
    }
  } catch (e) {
    console.log("Failed to connect to mongo server ⛓️‍💥");
    mongoose.connection.close();
  }
};
