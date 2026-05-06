export interface ErrorResponseBody {
  errorsMessages: {
    message: string;
    field: string;
  }[];
}
