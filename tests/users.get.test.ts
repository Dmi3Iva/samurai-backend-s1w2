import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { ROUTES } from "../src/consants/routes.conts";

describe("GET /users", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should return empty array when no users exist", async () => {
    const response = await usersTestManager.getEntities();

    expect(response).toEqual({
      items: [],
      page: 1,
      pageSize: 10,
      pagesCount: 0,
      totalCount: 0,
    });
  });

  it("should return all users", async () => {
    await usersTestManager.createEntity({
      login: "user1",
      password: "password123",
      email: "user1@example.com",
    });

    await usersTestManager.createEntity({
      login: "user2",
      password: "password123",
      email: "user2@example.com",
    });

    const response = await usersTestManager.getEntities();

    expect(response.items).toHaveLength(2);
    expect(response.items[0]).toEqual({
      id: expect.any(String),
      login: "user2",
      email: "user2@example.com",
      createdAt: expect.any(String),
    });
    expect(response.items[1]).toEqual({
      id: expect.any(String),
      login: "user1",
      email: "user1@example.com",
      createdAt: expect.any(String),
    });
  });

  it("should require authorization", async () => {
    const response = await request(app).get(`${ROUTES.users}`);
    expect(response.status).toBe(401);
  });
});

describe("GET /users - Pagination", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should return default page size (10)", async () => {
    for (let i = 1; i <= 15; i++) {
      await usersTestManager.createEntity({
        login: `user${i}`,
        password: "password123",
        email: `user${i}@example.com`,
      });
    }

    const response = await usersTestManager.getEntities();

    expect(response.page).toBe(1);
    expect(response.pageSize).toBe(10);
    expect(response.totalCount).toBe(15);
    expect(response.pagesCount).toBe(2);
    expect(response.items).toHaveLength(10);
  });

  it("should return empty array for page beyond available", async () => {
    await usersTestManager.createEntity({
      login: "user1",
      password: "password123",
      email: "user1@example.com",
    });

    const response = await usersTestManager.getEntitiesWithQuery({
      pageNumber: "10",
      pageSize: "10",
    });

    expect(response.items).toHaveLength(0);
    expect(response.totalCount).toBe(1);
  });

  it("should respect custom pageSize", async () => {
    for (let i = 1; i <= 5; i++) {
      await usersTestManager.createEntity({
        login: `user${i}`,
        password: "password123",
        email: `user${i}@example.com`,
      });
    }

    const response = await usersTestManager.getEntitiesWithQuery({
      pageSize: "3",
    });

    expect(response.items).toHaveLength(3);
    expect(response.pageSize).toBe(3);
    expect(response.totalCount).toBe(5);
  });

  it("should return correct page with pageNumber", async () => {
    for (let i = 1; i <= 15; i++) {
      await usersTestManager.createEntity({
        login: `user${i}`,
        password: "password123",
        email: `user${i}@example.com`,
      });
    }

    const response = await usersTestManager.getEntitiesWithQuery({
      pageNumber: "2",
      pageSize: "10",
    });

    expect(response.page).toBe(2);
    expect(response.items).toHaveLength(5);
  });
});

describe("GET /users - Sorting", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should sort by createdAt ascending (oldest first)", async () => {
    await usersTestManager.createEntity({
      login: "first",
      password: "password123",
      email: "first@example.com",
    });

    await usersTestManager.createEntity({
      login: "second",
      password: "password123",
      email: "second@example.com",
    });

    await usersTestManager.createEntity({
      login: "third",
      password: "password123",
      email: "third@example.com",
    });

    const response = await usersTestManager.getEntitiesWithQuery({
      sortBy: "createdAt",
      sortDirection: "asc",
    });

    expect(response.items[0].login).toBe("first");
    expect(response.items[2].login).toBe("third");
  });

  it("should sort by createdAt descending (newest first) - default", async () => {
    await usersTestManager.createEntity({
      login: "first",
      password: "password123",
      email: "first@example.com",
    });

    await usersTestManager.createEntity({
      login: "second",
      password: "password123",
      email: "second@example.com",
    });

    const response = await usersTestManager.getEntities();

    expect(response.items[0].login).toBe("second");
    expect(response.items[1].login).toBe("first");
  });
});

describe("GET /users - Search", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  describe("Search by login term", () => {
    beforeEach(async () => {
      await usersTestManager.createEntity({
        login: "ivan",
        password: "password123",
        email: "ivan@example.com",
      });

      await usersTestManager.createEntity({
        login: "divan",
        password: "password123",
        email: "divan@example.com",
      });

      await usersTestManager.createEntity({
        login: "peter",
        password: "password123",
        email: "peter@example.com",
      });
    });

    it("should filter by searchLoginTerm", async () => {
      const response = await usersTestManager.getEntitiesWithQuery({
        searchLoginTerm: "ivan",
      });

      expect(response.items).toHaveLength(1);
      expect(response.items[0].login).toBe("ivan");
    });

    it("should return all users when searchLoginTerm is not provided", async () => {
      const response = await usersTestManager.getEntities();

      expect(response.items).toHaveLength(3);
    });
  });

  describe("Search by email term", () => {
    beforeEach(async () => {
      await usersTestManager.createEntity({
        login: "user1",
        password: "password123",
        email: "ivan@example.com",
      });

      await usersTestManager.createEntity({
        login: "user2",
        password: "password123",
        email: "test@example.com",
      });

      await usersTestManager.createEntity({
        login: "user3",
        password: "password123",
        email: "ivan@test.com",
      });
    });

    it("should filter by searchEmailTerm", async () => {
      const response = await usersTestManager.getEntitiesWithQuery({
        searchEmailTerm: "ivan",
      });

      expect(response.items).toHaveLength(2);
      const emails = response.items.map((u) => u.email);
      expect(emails).toContain("ivan@example.com");
      expect(emails).toContain("ivan@test.com");
    });
  });

  describe("Combined search with pagination", () => {
    beforeEach(async () => {
      await usersTestManager.createEntity({
        login: "ivan1",
        password: "password123",
        email: "ivan1@example.com",
      });

      await usersTestManager.createEntity({
        login: "ivan2",
        password: "password123",
        email: "ivan2@example.com",
      });

      await usersTestManager.createEntity({
        login: "ivan3",
        password: "password123",
        email: "ivan3@example.com",
      });

      await usersTestManager.createEntity({
        login: "peter",
        password: "password123",
        email: "peter@example.com",
      });
    });

    it("should filter by searchLoginTerm and return correct totalCount", async () => {
      const response = await usersTestManager.getEntitiesWithQuery({
        searchLoginTerm: "ivan",
        pageSize: "2",
        pageNumber: "1",
      });

      expect(response.totalCount).toBe(3);
      expect(response.pagesCount).toBe(2);
      expect(response.items).toHaveLength(2);
    });
  });
});
