import { HydratedDocument, Model, Schema, model } from "mongoose";
import {
  ICreatedDBUserParam,
  IUsersPostBody,
  IUserType,
  IUserView,
} from "./user-types";
import { encryptPassword } from "../utils/encrpypt-password";

export interface IUserMethods {
  isUserConfirmedRegistration: () => boolean;
  toView: (options?: { emailMapping?: boolean }) => IUserView;
}

export interface IUserStaticMethods {
  createUser: (data: IUsersPostBody) => Promise<UserType>;
}

type UserModel = Model<IUserType, {}, IUserMethods> & IUserStaticMethods;

export type UserType = HydratedDocument<IUserType, IUserMethods>;

export const userSchema = new Schema<IUserType, UserModel, IUserMethods>(
  {
    login: { type: String, required: true },
    email: { type: String, required: true },
    createdAt: Date,
    password: { type: String, required: true },
    emailConfirmation: {
      confirmationCode: String,
      expirationDate: Date,
      isConfirmed: Boolean,
    },
    passwordRecovery: {
      code: String,
      expirationDate: Date,
    },
  },
  {
    statics: {
      async createUser(data: IUsersPostBody): Promise<UserType> {
        let password: string;
        password = await encryptPassword(data.password);
        const createdAt = new Date();

        const user = this.create({
          login: data.login,
          email: data.email,
          password,
          createdAt,
        });

        return user;
      },
    },
    methods: {
      isUserConfirmedRegistration() {
        // TODO:: check after tests, maybe it was critical
        // return this?.emailConfirmation?.isConfirmed !== false;
        return this?.emailConfirmation?.isConfirmed !== false;
      },
      toView(options?: { emailMapping?: boolean }): IUserView {
        return {
          id: this._id.toString(),
          createdAt: this.createdAt,
          email: this.email,
          login: this.login,
          ...(options?.emailMapping && this.emailConfirmation
            ? {
                emailConfirmation: {
                  expirationDate: this.emailConfirmation.expirationDate,
                  isConfirmed: this.emailConfirmation.isConfirmed,
                  confirmationCode: this.emailConfirmation.confirmationCode,
                },
              }
            : {}),
        };
      },
    },
  },
);

export const User = model<IUserType, UserModel>("user", userSchema);
