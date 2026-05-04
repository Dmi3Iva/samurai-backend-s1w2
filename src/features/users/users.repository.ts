import { ObjectId } from "mongodb";
import { usersDatabase } from "../../repositories/db";
import { ICreatedDBUserParam, IUsersGetQueries } from "./models/users.model";

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
    const _id = new ObjectId(id);
    const { deletedCount } = await usersDatabase.deleteOne({ _id });

    return deletedCount === 1;
  },
  // TODO:: continue
  async getUsersWithQuery({
    searchEmailTerm,
    searchLoginTerm,
    sortBy,
    sortDirection,
    pageNumber,
    pageSize,
  }: IUsersGetQueries) {
    const skip =
      pageSize && pageNumber
        ? (Number(pageSize) - 1) * Number(pageNumber)
        : undefined;
    const limit = Number(pageSize);

    const result = await usersDatabase
      .find({
        ...(searchLoginTerm ? { login: searchLoginTerm } : {}),
        ...(searchEmailTerm ? { email: searchEmailTerm } : {}),
      })
      .skip(skip)
      .limit(limit);
  },
};
