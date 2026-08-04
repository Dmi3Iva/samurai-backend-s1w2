import { WithId } from "mongodb";
import { authDatabase } from "../../repositories/database";
import { IAuthType, ISecurityDevice } from "./models/auth.model";
import { injectable } from "inversify";

@injectable()
export class AuthRepository {
  mapToAuthType = (type: WithId<IAuthType>): ISecurityDevice => {
    return {
      ip: type.ip,
      title: type.deviceName,
      lastActiveDate: type.iat.toISOString(),
      deviceId: type.deviceId,
    };
  };

  async getSessions(userId: string) {
    const cursor = authDatabase.find({ userId });

    return (await cursor.toArray()).map(this.mapToAuthType);
  }
  async createSession(session: IAuthType) {
    const { insertedId } = await authDatabase.insertOne(session);

    return insertedId.toString();
  }
  async removeSession(payload: {
    userId: string;
    deviceId: string;
    iat: Date;
  }) {
    const { deletedCount } = await authDatabase.deleteOne(payload);

    return deletedCount === 1;
  }
  async getSession(payload: { userId?: string; deviceId: string; iat?: Date }) {
    return await authDatabase.findOne(payload);
  }
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
      iat,
    };
    const updateDocument = {
      $set: {
        iat: newIat,
        deviceName,
      },
    };

    return await authDatabase.updateOne(payloadToFind, updateDocument);
  }
  async removeAll() {
    return await authDatabase.deleteMany({});
  }

  async removeUserSessions(userId: string, deviceId: string): Promise<boolean> {
    const { deletedCount } = await authDatabase.deleteMany({
      userId,
      deviceId: { $ne: deviceId },
    });
    return deletedCount > 0;
  }

  async removeSingleUserSession(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const { deletedCount } = await authDatabase.deleteOne({ userId, deviceId });
    return deletedCount > 0;
  }
}
