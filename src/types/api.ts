export interface AuthContext {
  user?: { id: number; email: string };
  isAuthenticated: boolean;
}

export type TErrorResponse = {
  ok: false;
  statusCode: number;
  message: string;
  error: string;
};

export interface ISuccessResponse<T> {
  ok: true;
  statusCode: number;
  message: string;
  data: T;
}

export type TResponse<T> = ISuccessResponse<T> | TErrorResponse;
