import "server-only";

import { z } from "zod";


const schema = z.object({
  SSLCOMMERZ_MODE:
    z.enum([
      "sandbox",
      "production",
    ]),

  SSLCOMMERZ_STORE_ID:
    z.string()
      .trim()
      .min(1)
      .max(100),

  SSLCOMMERZ_STORE_PASSWORD:
    z.string()
      .trim()
      .min(1)
      .max(200),
});


const result =
  schema.safeParse({
    SSLCOMMERZ_MODE:
      process.env.SSLCOMMERZ_MODE,

    SSLCOMMERZ_STORE_ID:
      process.env.SSLCOMMERZ_STORE_ID,

    SSLCOMMERZ_STORE_PASSWORD:
      process.env.SSLCOMMERZ_STORE_PASSWORD,
  });


if (!result.success) {
  throw new Error(
    "Missing or invalid SSLCOMMERZ configuration."
  );
}


export const sslCommerzEnv =
  result.data;