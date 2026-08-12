import { model, Schema } from "mongoose";

const CommentSchema = new Schema(
  {
    content: { type: String, required: true },
    postId: { type: String, required: true },
    commentatorInfo: {
      type: {
        userId: { type: String, required: true },
        userLogin: { type: String, required: true },
      },
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const CommentModel = model("comment", CommentSchema);
