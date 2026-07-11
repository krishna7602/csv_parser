import morgan from "morgan";
import { env } from "../config/env.js";

/** HTTP request logger — dev format for development, tiny for production */
export const requestLoggerMiddleware = morgan(
  env.NODE_ENV === "development" ? "dev" : "tiny"
);
