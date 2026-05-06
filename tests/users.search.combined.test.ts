import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { ROUTES } from "../src/consants/routes.conts";

describe("GET /users - Combined search with OR logic", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should return users matching searchLoginTerm OR searchEmailTerm", async () => {
    // Users matching login term "ser"
    await usersTestManager.createEntity({
      login: "user01",
      password: "password123",
      email: "other@test.org",
    });

    await usersTestManager.createEntity({
      login: "user02",
      password: "password123",
      email: "another@example.net",
    });

    // Users matching email term ".com"
    await usersTestManager.createEntity({
      login: "admin",
      password: "password123",
      email: "admin@example.com",
    });

    await usersTestManager.createEntity({
      login: "moderator",
      password: "password123",
      email: "mod@test.com",
    });

    // User matching BOTH (login has "ser" AND email has ".com")
    await usersTestManager.createEntity({
      login: "user03",
      password: "password123",
      email: "user03@example.com",
    });

    // User matching NEITHER
    await usersTestManager.createEntity({
      login: "superadmin",
      password: "password123",
      email: "root@test.org",
    });

    const response = await usersTestManager.getEntitiesWithQuery({
      searchLoginTerm: "ser",
      searchEmailTerm: ".com",
    });

    // Should return 5 users: user01, user02 (login match) + admin, moderator, user03 (email match)
    // user03 matches BOTH conditions but should only appear once
    expect(response.totalCount).toBe(5);
    expect(response.items).toHaveLength(5);

    const logins = response.items.map((u) => u.login);
    expect(logins).toContain("user01");
    expect(logins).toContain("user02");
    expect(logins).toContain("admin");
    expect(logins).toContain("moderator");
    expect(logins).toContain("user03");

    // superadmin should NOT be in results (matches neither)
    expect(logins).not.toContain("superadmin");
  });
});
