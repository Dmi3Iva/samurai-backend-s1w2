import { rateLimitDatabase } from "../../../repositories/database";

export const rateLimitReadRepository = {
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
    const cursor = rateLimitDatabase.find({
      ip,
      url,
      date: {
        $gte: startDate,
        $lt: finishDate,
      },
    });
    return (await cursor.toArray()).length;
  },
};
