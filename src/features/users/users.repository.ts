import { ObjectId, WithId } from "mongodb";
import { db, usersDatabase } from "../../repositories/database";
import {
  ICreatedDBUserParam,
  ICreateRegistrationDataBaseBody,
  ICreateRegistrationPostBody,
  IDBUserType,
  IUsersGetQueries,
  IUserType,
  IUserView,
} from "./models/users.model";
import { add } from "date-fns";

const mapDBUserToView = (
  dbUser: IDBUserType,
  options?: { fullMapping?: boolean },
): IUserView => {
  return {
    id: dbUser._id.toString(),
    createdAt: dbUser.createdAt,
    email: dbUser.email,
    login: dbUser.login,
    ...(options?.fullMapping && dbUser.emailConfirmation
      ? {
          emailConfirmation: {
            expirationDate: dbUser.emailConfirmation.expirationDate,
            isConfirmed: dbUser.emailConfirmation.isConfirmed,
            confirmationCode: dbUser.emailConfirmation.confirmationCode,
          },
        }
      : {}),
  };
};

export const usersRepository = {
  async findUserByLogin(
    login: string,
    options?: { fullMapping?: boolean },
  ): Promise<{ user: IUserView; password: string } | null> {
    const result = await usersDatabase.findOne({ login });

    return result
      ? {
          user: mapDBUserToView(result, options),
          password: result.password,
        }
      : null;
  },

  async findUserByEmail(
    email: string,
    options?: { fullMapping?: boolean },
  ): Promise<{ user: IUserView; password: string } | null> {
    const result = await usersDatabase.findOne({ email });

    return result
      ? {
          user: mapDBUserToView(result, options),
          password: result.password,
        }
      : null;
  },

  async findUserById(userId: string): Promise<IUserView | null> {
    const _id = new ObjectId(userId);
    const result = await usersDatabase.findOne({ _id });

    return result ? mapDBUserToView(result) : null;
  },

  async createUser(dbUserData: ICreatedDBUserParam): Promise<string> {
    const { insertedId } = await usersDatabase.insertOne(dbUserData);

    return insertedId.toString();
  },

  async createRegistrationUser(
    dbUserData: ICreateRegistrationDataBaseBody,
  ): Promise<string | null> {
    try {
      const { insertedId } = await usersDatabase.insertOne(dbUserData);

      return insertedId.toString();
    } catch (e) {
      return null;
    }
  },

  async removeUserById(id: string) {
    try {
      const _id = new ObjectId(id);
      const { deletedCount } = await usersDatabase.deleteOne({ _id });

      return deletedCount === 1;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  async getUsersWithQuery(queries: IUsersGetQueries) {
    const {
      searchEmailTerm = null,
      searchLoginTerm = null,
      sortBy = "createdAt",
      sortDirection = "desc",
      pageNumber = 1,
      pageSize = 10,
    } = queries;
    const skip = (Number(pageNumber) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const filter = {
      ...(searchEmailTerm || searchLoginTerm
        ? {
            $or: [
              ...(searchLoginTerm
                ? [{ login: { $regex: searchLoginTerm, $options: "i" } }]
                : []),
              ...(searchEmailTerm
                ? [{ email: { $regex: searchEmailTerm, $options: "i" } }]
                : []),
            ],
          }
        : {}),
    };

    const cursor = usersDatabase.find(filter, {
      sort: { [sortBy]: sortDirection === "asc" ? 1 : -1 },
      skip,
      limit,
    });

    const totalCount = await usersDatabase.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / Number(pageSize));
    const page = Number(pageNumber);
    const items = (await cursor.toArray()).map((item) => mapDBUserToView(item));

    return {
      pagesCount,
      page,
      pageSize: Number(pageSize),
      totalCount,
      items,
    };
  },
  async removeAll() {
    return await usersDatabase.deleteMany({});
  },

  async findUserByConfirmationCode(
    confirmationCode: string,
  ): Promise<WithId<IUserType> | null> {
    const result = await usersDatabase.findOne({
      "emailConfirmation.confirmationCode": confirmationCode,
    });

    return result ?? null;
  },

  async confirmRegistrationByUserId(userId: string): Promise<boolean> {
    const result = await usersDatabase.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          "emailConfirmation.isConfirmed": true,
        },
      },
    );

    return result.modifiedCount === 1;
  },

  async updateConfirmRegistrationByUserId(
    userId: string,
    confirmationCode: string,
  ): Promise<boolean> {
    const result = await usersDatabase.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          "emailConfirmation.confirmationCode": confirmationCode,
          // TODO:: 15 minutes to another function
          "emailConfirmation.expirationDate": add(new Date(), {
            minutes: 15,
            seconds: 0,
          }),
        },
      },
    );

    return result.modifiedCount === 1;
  },
};
