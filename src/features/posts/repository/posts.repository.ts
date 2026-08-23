import { ObjectId, WithId } from "mongodb";
import {
  GetPostsResponse,
  IDBPostType,
  IFindPostsSearchTerm,
  IPostCreateModel,
  IPostUpadteModel,
  IPostView,
  IViewPostType,
  PostModel,
} from "../models/post.model";
import { BlogsRepository } from "../../blogs/blogs.repository";
import { injectable, inject } from "inversify";
import { PostLikeRepository } from "../../post-likes/post-like.repository";

@injectable()
export class PostsRepository {
  constructor(
    @inject(BlogsRepository) private blogsRepository: BlogsRepository,
    @inject(PostLikeRepository) private postLikeRepository: PostLikeRepository,
  ) {}

  mapToPostType = async (
    p: IDBPostType,
    userId?: string,
  ): Promise<IPostView> => {
    const extendedLikesInfo = await this.postLikeRepository.getLikesInfo({
      userId,
      postId: p._id.toString(),
    });

    return {
      id: p._id?.toString() || "not-existing-id",
      title: p.title,
      shortDescription: p.shortDescription,
      content: p.content,
      blogId: p.blogId,
      createdAt: p.createdAt,
      blogName: p.blogName,
      extendedLikesInfo,
    };
  };

  async getPost(id: string): Promise<IViewPostType | null> {
    try {
      const findResult = await PostModel.findById(id);
      return findResult ? this.mapToPostType(findResult) : null;
    } catch (e) {
      console.log(`error while try to get post with id=${id}`);
      return null;
    }
  }

  async getPosts(
    findPostsSearchTerm: IFindPostsSearchTerm,
    userId: string | undefined,
  ): Promise<GetPostsResponse> {
    const {
      pageNumber = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortDirection = "desc",
      blogId,
    } = findPostsSearchTerm;
    const skip = (Number(pageNumber) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const filter = blogId ? { blogId } : {};

    const findResult = await PostModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({
        [sortBy]: sortDirection === "asc" ? 1 : -1,
      })
      .lean();

    const rawItems = findResult;
    const items = await Promise.all(
      rawItems.map((i) => this.mapToPostType(i, userId)),
    );
    const page = Number(pageNumber);
    const totalCount = await PostModel.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / Number(pageSize));

    return {
      items,
      page,
      pageSize: Number(pageSize),
      pagesCount,
      totalCount,
    };
  }

  async createPost(postBody: IPostCreateModel): Promise<IPostView | null> {
    try {
      const blog = await this.blogsRepository.findBlog(postBody.blogId);

      const model = new PostModel(postBody);
      model.blogName = blog?.name ?? "";
      await model.save();

      return this.mapToPostType(model);
    } catch (e) {
      console.error("failed to create post", e);
      return null;
    }
  }

  async updatePost({
    id,
    data: updatedPost,
  }: {
    id: string;
    data: IPostUpadteModel;
  }): Promise<boolean> {
    try {
      const post = await PostModel.findById(id);
      if (post === null) return false;

      post.title = updatedPost.title;
      post.shortDescription = updatedPost.shortDescription;
      post.content = updatedPost.content;
      post.blogId = updatedPost.blogId;

      await post.save();

      return true;
    } catch (e) {
      console.error(`failed to update posts with id=${id}`);
      return false;
    }
  }

  async deletePost(id: string): Promise<boolean> {
    try {
      const deleteResult = await PostModel.deleteOne({
        _id: new ObjectId(id),
      });

      return deleteResult.deletedCount === 1;
    } catch (e) {
      console.error(`failed to delete post with id=${id}`);
      return false;
    }
  }

  async removeAllByBlogs(blogId: string) {
    return await PostModel.deleteMany({ blogId });
  }

  async removeAll() {
    return await PostModel.deleteMany({});
  }
}
