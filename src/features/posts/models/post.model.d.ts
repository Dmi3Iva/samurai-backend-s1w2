export interface IPostType {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
}

export type IPostCreateModel = Omit<IPostType, "id">;
export type IPostUpadteModel = IPostCreateModel;
export type IViewPost = IPostType;
