import { subSeconds } from "date-fns";
import { RateLimitReadRepository } from "./repository/rate-limit-read.repository";
import { RateLimitUpdateRepository } from "./repository/rate-limit-update.repository";
import { injectable, inject } from "inversify";

const RATE_LIMIT = 5;
const RATE_LIMIT_SECONDS = 10;
const REQUEST_WILL_BE_ADDED = 1;

@injectable()
export class RateLimitService {
  constructor(
    @inject(RateLimitReadRepository)
    private rateLimitReadRepository: RateLimitReadRepository,
    @inject(RateLimitUpdateRepository)
    private rateLimitUpdateRepository: RateLimitUpdateRepository,
  ) {}
  async checkRequestLimit({
    ip: rawIp,
    url,
  }: {
    ip: string | undefined;
    url: string;
  }): Promise<boolean> {
    const ip = rawIp || "";
    const finishDate = new Date();
    const startDate = subSeconds(finishDate, RATE_LIMIT_SECONDS);
    const currentRateLimitsCount =
      (await this.rateLimitReadRepository.rateLimitsCount({
        ip,
        url,
        startDate,
        finishDate,
      })) + REQUEST_WILL_BE_ADDED;
    if (currentRateLimitsCount > RATE_LIMIT) {
      return false;
    }
    await this.rateLimitUpdateRepository.addRateLimit({
      ip,
      url,
      date: finishDate,
    });
    return true;
  }
}
