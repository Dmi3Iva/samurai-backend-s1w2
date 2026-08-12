import { WithId } from "mongodb";
import { IAuthType, ISecurityDevice } from "./models/auth.model";
import { injectable } from "inversify";
import { AuthModel } from "./auth.model";

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
    const result = await AuthModel.find({ userId }).lean();

    return result.map(this.mapToAuthType);
  }
  async createSession(session: IAuthType) {
    const model = new AuthModel(session);
    await model.save();

    return model.id;
  }
  async removeSession(payload: {
    userId: string;
    deviceId: string;
    iat: Date;
  }) {
    const { deletedCount } = await AuthModel.deleteOne(payload);

    return deletedCount === 1;
  }
  async getSession(payload: { userId?: string; deviceId: string; iat?: Date }) {
    return await AuthModel.findOne(payload);
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
      iat: newIat,
      deviceName,
    };

    return await AuthModel.updateOne(payloadToFind, updateDocument);
  }
  async removeAll() {
    return await AuthModel.deleteMany({});
  }

  async removeUserSessions(userId: string, deviceId: string): Promise<boolean> {
    const { deletedCount } = await AuthModel.deleteMany({
      userId,
      deviceId: { $ne: deviceId },
    });
    return deletedCount > 0;
  }

  async removeSingleUserSession(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const { deletedCount } = await AuthModel.deleteOne({ userId, deviceId });
    return deletedCount > 0;
  }
}
