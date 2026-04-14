export interface IPostType {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export type IPostCreateModel = Omit<IPostType, "id">;
export type IPostUpadteModel = IPostCreateModel;
export interface IPostView extends IPostType {
  blogName: string;
}
