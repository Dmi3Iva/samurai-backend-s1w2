import { WithId } from "mongodb";
import { authDatabase } from "../../../repositories/db";
import { IAuthType, ISecurityDevice } from "../models/auth.model";

const mapToAuthType = (type: WithId<IAuthType>): ISecurityDevice => {
  return {
    ip: type.ip,
    title: type.deviceName,
    lastActiveDate: type.iat.toString(),
    deviceId: type.deviceId,
  };
};

export const authRepository = {
  async getSessions(userId: string) {
    const cursor = authDatabase.find({ userId });

    return (await cursor.toArray()).map(mapToAuthType);
  },
  async createSession(session: IAuthType) {
    const { insertedId } = await authDatabase.insertOne(session);

    return insertedId.toString();
  },
  async removeSession(payload: {
    userId: string;
    deviceId: string;
    iat: Date;
  }) {
    const { deletedCount } = await authDatabase.deleteOne(payload);

    return deletedCount === 1;
  },
  async getSession(payload: { userId: string; deviceId: string; iat: Date }) {
    return await authDatabase.findOne(payload);
  },
  async updateSession(
    {
      userId,
      deviceId,
      deviceName,
      iat,
    }: {
      userId: string;
      deviceId: string;
      ip: string;
      deviceName: string;
      iat: Date;
    },
    newIat: Date,
  ) {
    const payloadToFind = {
      userId,
      deviceId,
      deviceName,
      iat,
    };
    return await authDatabase.updateOne(payloadToFind, { iat: newIat });
  },
  async removeAll() {
    return await authDatabase.deleteMany({});
  },
};
