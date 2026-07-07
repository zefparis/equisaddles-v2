declare module "express-session" {
  interface SessionData {
    admin?: {
      authenticated: boolean;
      username: string;
    };
  }
}

export {};
