import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getVerifiedUser() {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase.auth.getClaims();

  const userId =
    data?.claims?.sub;

  if (
    error ||
    !userId ||
    typeof userId !== "string"
  ) {
    return null;
  }

  return {
    id: userId,
    claims: data.claims,
    supabase,
  };
}