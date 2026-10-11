import "server-only";

import {
  z,
} from "zod";


const schema = z.object({
  tran_id:
    z.string()
      .trim()
      .min(1)
      .max(50),

  val_id:
    z.string()
      .trim()
      .max(100)
      .optional(),

  status:
    z.string()
      .trim()
      .max(30)
      .optional(),
});


export async function readSSLCommerzCallback(
  request: Request
) {
  const contentLength =
    Number(
      request.headers.get(
        "content-length"
      ) ?? "0"
    );


  if (
    Number.isFinite(
      contentLength
    ) &&
    contentLength >
      50_000
  ) {
    throw new Error(
      "Callback payload too large."
    );
  }


  const form =
    await request.formData();


  const raw = {
    tran_id:
      form.get("tran_id"),

    val_id:
      form.get("val_id") ??
      undefined,

    status:
      form.get("status") ??
      undefined,
  };


  const parsed =
    schema.safeParse(raw);


  if (!parsed.success) {
    throw new Error(
      "Invalid payment callback."
    );
  }


  return {
    transactionId:
      parsed.data.tran_id,

    validationId:
      parsed.data.val_id,

    status:
      parsed.data.status,
  };
}