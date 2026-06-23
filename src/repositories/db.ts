import { MongoClient, OptionalId } from "mongodb";
import { IBlogType } from "../features/blogs/models/blog.model";
import { IPostType } from "../features/posts/models/post.model";
import "dotenv/config";
import { IUserType } from "../features/users/models/users.model";
import { ICommentType } from "../features/comments/comments.models";
import { IRefreshTokenBlackList } from "../features/refreshTokenBlacklist/models/refreshTokenBlacklist.model";

const mongoURI: string = process.env.MONGO_URI || "mongodb://0.0.0.0:27017";

export const client = new MongoClient(mongoURI);

export const db = client.db("bloggersPlatform");

export const blogsDatabase = db.collection<IBlogType>("blogs");
export const postsDatabase = db.collection<IPostType>("posts");
export const usersDatabase = db.collection<IUserType>("users");
export const commentsDatabase = db.collection<ICommentType>("comments");
export const refreshTokensBlacklistDatabase =
  db.collection<IRefreshTokenBlackList>("refresh_tokens_black_list");

export const runDB = async () => {
  try {
    await client.connect();

    await refreshTokensBlacklistDatabase.createIndex(
      {
        expiresAt: 1,
      },
      {
        expireAfterSeconds: 0,
      },
    );

    await client.db("bloggersPlatform").command({ ping: 1 });
  } catch (e) {
    console.log("Failed to connect to mongo server ⛓️‍💥");
    client.close();
  }
};
