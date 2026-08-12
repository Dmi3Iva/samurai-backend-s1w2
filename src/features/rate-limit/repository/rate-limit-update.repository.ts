import { injectable } from "inversify";
import { RateLimitModel } from "../rate-limit.model";

@injectable()
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
    try {
      const model = new RateLimitModel({ ip, url, date });
      await model.save();
      return true;
    } catch (e: unknown) {
      return false;
    }
  }
  async removeAll() {
    return await RateLimitModel.deleteMany({});
  }
}
