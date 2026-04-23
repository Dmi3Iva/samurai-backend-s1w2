export interface IPostType {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  createdAt: Date;
}

export type IPostCreateModel = Omit<IPostType, "id", "createdAt">;
export type IPostUpadteModel = IPostCreateModel;
export interface IPostView extends IPostType {
  blogName: string;
}
