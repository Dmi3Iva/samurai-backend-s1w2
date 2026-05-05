import { OptionalId, WithId, WithoutId } from "mongodb";

export interface IUserType {
  login: string;
  email: string;
  createdAt: Date;
}

export interface IUserView extends IUserType {
  id: string;
}

export type IDBUserType = WithId<IUserType>;

export interface ICreatedDBUserParam extends IUsersPostBody {
  createdAt: Date;
}

export interface IUsersPostBody {
  // maxLength: 10
  // minLength: 3
  // pattern: ^[a-zA-Z0-9_-]*$
  // must be unique
  // login*	string
  login: string;
  // password*	string
  // maxLength: 20
  // minLength: 6
  password: string;
  // email*	string
  // pattern: ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$
  // example: example@example.dev
  // must be unique
  email: string;
}

export interface IUsersGetQueries {
  sortBy?: string | undefined;
  sortDirection?: string | undefined;
  pageNumber?: string | undefined;
  pageSize?: string | undefined;
  searchLoginTerm?: string | undefined;
  searchEmailTerm?: string | undefined;
}
