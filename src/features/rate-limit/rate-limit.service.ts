import { subSeconds } from "date-fns";
import { rateLimitDatabase } from "../../repositories/database";
import { rateLimitReadRepository } from "./repository/rate-limit-read.repository";
import { rateLimitUpdateRepository } from "./repository/rate-limit-update.repository";

const RATE_LIMIT = 5;
const RATE_LIMIT_SECONDS = 10;
const REQUEST_WILL_BE_ADDED = 1;

export const rateLimitService = {
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
      (await rateLimitReadRepository.rateLimitsCount({
        ip,
        url,
        startDate,
        finishDate,
      })) + REQUEST_WILL_BE_ADDED;
    if (currentRateLimitsCount > RATE_LIMIT) {
      return false;
    }
    await rateLimitUpdateRepository.addRateLimit({
      ip,
      url,
      date: finishDate,
    });
    return true;
  },
};
