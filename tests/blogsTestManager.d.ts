import type { CreateBlogModel } from "../src/features/blogs/models";
declare class BlogsTestManager {
    createEntity(data: CreateBlogModel): Promise<import("superagent/lib/node/response")>;
    deleteEntity(id: string): Promise<import("superagent/lib/node/response")>;
    getEntity(id: string): Promise<import("superagent/lib/node/response")>;
    getEntities(): Promise<import("superagent/lib/node/response")>;
}
export declare const blogsTestManager: BlogsTestManager;
export {};
//# sourceMappingURL=blogsTestManager.d.ts.map