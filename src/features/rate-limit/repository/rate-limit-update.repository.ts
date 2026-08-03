import { rateLimitDatabase } from "../../../repositories/database";

export class RateLimitUpdateRepository {
  async addRateLimit({
    ip,
    url,
    date,
  }: {
    ip: string;
    url: string;
    date: Date;
  }) {
    const result = await rateLimitDatabase.insertOne({
      ip,
      url,
      date,
    });

    if (result?.insertedId) {
      return true;
    }

    return false;
  }
  async removeAll() {
    return await rateLimitDatabase.deleteMany({});
  }
}
