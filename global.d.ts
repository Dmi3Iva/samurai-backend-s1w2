declare global {
  namespace Express {
    export interface Request {
      userId: string | null;
      deviceId: string | null;
      deviceName?: string;
      iat: string | null;
      ip?: string;
    }
  }
}
export {};
