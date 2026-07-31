declare global {
  namespace Express {
    export interface Request {
      userId: string | null;
      deviceId: string | null;
      deviceName?: string;
      iat: Date | null;
      ip?: string;
    }
  }
}
export {};
