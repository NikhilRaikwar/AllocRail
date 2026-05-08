import { getSupabaseAdmin } from "./supabase";
import { getSupabaseServerClient } from "@/app/lib/supabase/server";
import type { FounderProfile } from "./types";

function fallbackFullName(email: string) {
  return email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Founder";
}

export async function requireCurrentFounder(): Promise<FounderProfile> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    throw new Error("Unauthorized");
  }

  const admin = getSupabaseAdmin();
  const { data: existingProfile, error: existingError } = await admin
    .from("founder_profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const metadataFullName =
    typeof user.user_metadata?.full_name === "string" &&
    user.user_metadata.full_name.trim().length > 0
      ? user.user_metadata.full_name.trim()
      : undefined;

  const fullName =
    metadataFullName ||
    (typeof existingProfile?.full_name === "string" &&
    existingProfile.full_name.trim().length > 0
      ? existingProfile.full_name.trim()
      : undefined) ||
    fallbackFullName(user.email);

  const { data, error } = await admin
    .from("founder_profiles")
    .upsert(
      {
        user_id: user.id,
        email: user.email,
        full_name: fullName,
      },
      { onConflict: "user_id" }
    )
    .select("user_id, email, full_name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    userId: data.user_id,
    email: data.email,
    fullName: data.full_name,
  };
}

export async function updateCurrentFounderProfile(
  fullNameInput: string
): Promise<FounderProfile> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    throw new Error("Unauthorized");
  }

  const fullName = fullNameInput.trim().replace(/\s+/g, " ");
  if (fullName.length < 2) {
    throw new Error("Full name must be at least 2 characters.");
  }

  const admin = getSupabaseAdmin();
  const existingMetadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? user.user_metadata
      : {};

  const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...existingMetadata,
      full_name: fullName,
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const { data, error } = await admin
    .from("founder_profiles")
    .upsert(
      {
        user_id: user.id,
        email: user.email,
        full_name: fullName,
      },
      { onConflict: "user_id" }
    )
    .select("user_id, email, full_name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    userId: data.user_id,
    email: data.email,
    fullName: data.full_name,
  };
}
