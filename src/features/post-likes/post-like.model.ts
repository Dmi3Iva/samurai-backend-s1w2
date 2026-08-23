import { HydratedDocument, Model, model, Schema } from "mongoose";

export enum EPostLikeStatus {
  None = "None",
  Like = "Like",
  Dislike = "Dislike",
}

export const POST_LIKE_VALUES = [
  EPostLikeStatus.None,
  EPostLikeStatus.Like,
  EPostLikeStatus.Dislike,
];

export interface IPostLikeType {
  userId: string;
  postId: string;
  postLikeStatus: EPostLikeStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface IPostLikeMethods {}

interface IPostLikeStaticMethods {}

type PostLikeModel = Model<IPostLikeType, {}, IPostLikeMethods> &
  IPostLikeStaticMethods;

export type PostLikeType = HydratedDocument<IPostLikeType, IPostLikeMethods>;

const PostLikeSchema = new Schema<IPostLikeType>(
  {
    userId: { type: String, required: true },
    postId: { type: String, required: true },
    postLikeStatus: {
      type: String,
      enum: EPostLikeStatus,
      default: EPostLikeStatus.None,
      required: true,
    },
  },
  {
    timestamps: true,
    methods: {
      setLikeStatus(likeStatus: EPostLikeStatus) {
        this.postLikeStatus = likeStatus;
      },
    },
  },
);

export const PostLike = model<IPostLikeType, PostLikeModel>(
  "postLike",
  PostLikeSchema,
);
