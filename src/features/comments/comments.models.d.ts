import { WithId } from "mongodb";

export interface ICommentType {
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: Date;
}

export type IDBCommentType = WithId<ICommentType>;

export interface IViewCommentType extends ICommentType {
  id: string;
}

export type IPostCreateModel = Omit<
  ICommentType,
  "createdAt",
  "commentatorInfo"
>;

// export interface IDBCommentType extends ICommentType {
//   _id: string;
// }
