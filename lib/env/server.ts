import "server-only";

import { z } from "zod";


const schema = z.object({
  SUPABASE_URL:
    z.string().url(),

  SUPABASE_SECRET_KEY:
    z.string().min(20),

  APP_BASE_URL:
    z.string().url(),
});


const result =
  schema.safeParse({
    SUPABASE_URL:
      process.env.SUPABASE_URL,

    SUPABASE_SECRET_KEY:
      process.env.SUPABASE_SECRET_KEY,

    APP_BASE_URL:
      process.env.APP_BASE_URL,
  });


if (!result.success) {
  throw new Error(
    "Missing or invalid server environment configuration."
  );
}


export const serverEnv =
  result.data;