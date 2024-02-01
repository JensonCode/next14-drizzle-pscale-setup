import { Config } from "drizzle-kit";

import * as dotenv from "dotenv";
dotenv.config();

export default {
  schema: "./src/db/schema/*.ts",
  out: "./src/db/migrations",
  driver: "mysql2",
  dbCredentials: {
    uri: process.env.DATABASE_URL as string,
  },
} satisfies Config;
