import { injectable } from "inversify";
import { RateLimitModel } from "../rate-limit.model";

@injectable()
export class RateLimitReadRepository {
  async rateLimitsCount({
    ip,
    url,
    startDate,
    finishDate,
  }: {
    ip: string;
    url: string;
    startDate: Date;
    finishDate: Date;
  }) {
    return (
      await RateLimitModel.find({
        ip,
        url,
        date: {
          $gte: startDate,
          $lt: finishDate,
        },
      })
    ).length;
  }
}
