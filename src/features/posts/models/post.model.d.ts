export interface IPostTypeWithoutId {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  createdAt: Date;
}

export type IPostType = OptionalId<IPostTypeWithoutId>;

export type IPostCreateModel = Omit<IPostType, "_id", "createdAt">;
export type IPostUpadteModel = IPostCreateModel;
export interface IPostView extends IPostType {
  blogName: string;
}
