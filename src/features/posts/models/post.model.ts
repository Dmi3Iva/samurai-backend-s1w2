import { model, Schema } from "mongoose";
import { ESortDirection } from "../../../types/common.type";
import { WithId } from "mongodb";

export interface IPostType {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
}

export interface IViewPostType extends IPostType {
  id: string;
}

export type IDBPostType = WithId<IPostType>;

export type IPostCreateModel = Pick<
  IPostType,
  "title" | "shortDescription" | "content" | "blogId"
>;
export type IPostUpadteModel = IPostCreateModel;
export interface IPostView extends IPostType {
  blogName: string;
}

export interface GetPostsResponse {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: IPostView[];
}

export interface IFindPostsSearchTerm {
  pageNumber?: string;
  pageSize?: string;
  sortBy?: string;
  sortDirection?: ESortDirection;
  blogId?: string;
}

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    shortDescription: { type: String, required: true },
    content: { type: String, required: true },
    blogId: { type: String, required: true },
    blogName: { type: String, required: true },
  },
  { timestamps: true },
);

export const PostModel = model("post", PostSchema);
