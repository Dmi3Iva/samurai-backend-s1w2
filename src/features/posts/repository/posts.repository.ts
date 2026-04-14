import {
  IPostCreateModel,
  IPostType,
  IPostUpadteModel,
} from "../models/post.model";

const posts: IPostType[] = [];

export const postsRepository = {
  getPost: (id: string): IPostType | undefined => {
    return posts.find((p) => p.id === id);
  },
  getPosts: () => {
    return posts;
  },
  createPost: (postBody: IPostCreateModel): IPostType => {
    const id = String(new Date());
    const newPost = { ...postBody, id };
    posts.push(newPost);
    return newPost;
  },
  updatePost: ({
    id,
    updatedPost,
  }: {
    id: string;
    updatedPost: IPostUpadteModel;
  }): boolean => {
    const idToUpdate = posts.findIndex((p) => p.id === id);
    if (idToUpdate === -1) {
      return false;
    }

    posts[idToUpdate] = { ...updatedPost, id };
    return true;
  },
  deletePost: (id: string): boolean => {
    const idToUpdate = posts.findIndex((p) => p.id === id);
    if (idToUpdate === -1) {
      return false;
    } else {
      posts.splice(idToUpdate, 1);
      return true;
    }
  },
  removeAll: () => {
    posts.splice(0, posts.length);
  },
};
