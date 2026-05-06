import { ObjectId } from "mongodb";
import { db, usersDatabase } from "../../repositories/db";
import {
  ICreatedDBUserParam,
  IDBUserType,
  IUsersGetQueries,
  IUserView,
} from "./models/users.model";

const mapDBUserToView = (dbUser: IDBUserType): IUserView => {
  return {
    id: dbUser._id.toString(),
    createdAt: dbUser.createdAt,
    email: dbUser.email,
    login: dbUser.login,
  };
};

export const usersRepository = {
  async findUserByLogin(login: string) {
    const result = await usersDatabase.findOne({ login });

    return result;
  },

  async findUserByEmail(email: string) {
    const result = await usersDatabase.findOne({ email });

    return result;
  },

  async createUser(dbUserData: ICreatedDBUserParam): Promise<string> {
    const { insertedId } = await usersDatabase.insertOne(dbUserData);

    return insertedId.toString();
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
      ...(searchLoginTerm
        ? { login: { $regex: searchLoginTerm, $options: "i" } }
        : {}),
      ...(searchEmailTerm
        ? { email: { $regex: searchEmailTerm, $options: "i" } }
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
    const items = (await cursor.toArray()).map(mapDBUserToView);

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
};
