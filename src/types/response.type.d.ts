export interface ErrorResponseBody {
  errorMessages: {
    message: string;
    field: string;
  }[];
}
