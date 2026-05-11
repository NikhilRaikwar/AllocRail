import {
  findRevenueEventByReference,
  listRecentReceipts,
} from "@/app/lib/allocrail/event-store";
import { requireCurrentFounder } from "@/app/lib/allocrail/founder";
import { getSupabaseAdmin } from "@/app/lib/allocrail/supabase";
import type { FounderProfile, RevenueEvent } from "@/app/lib/allocrail/types";

type ClaimInput = {
  paymentId?: string;
  checkoutSessionId?: string;
  subscriptionId?: string;
};

type WorkspaceRow = {
  id: string;
  name: string;
  owner_user_id: string | null;
};

function buildWorkspaceName(event: RevenueEvent) {
  const productTag = event.metadata.product_tag.replace(/[-_]+/g, " ").trim();
  return productTag.length > 0
    ? `AllocRail ${productTag} workspace`
    : "AllocRail claimed workspace";
}

async function ensureFounderWorkspaceAccess(args: {
  founder: FounderProfile;
  workspaceId: string;
  workspaceName: string;
}) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("workspaces")
    .select("id, name, owner_user_id")
    .eq("id", args.workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const existingWorkspace = (data as WorkspaceRow | null) ?? null;

  if (!existingWorkspace) {
    const { error: createError } = await admin.from("workspaces").insert({
      id: args.workspaceId,
      name: args.workspaceName,
      owner_user_id: args.founder.userId,
    });

    if (createError) {
      throw new Error(createError.message);
    }
  }

  if (existingWorkspace && !existingWorkspace.owner_user_id) {
    const { error: claimOwnerError } = await admin
      .from("workspaces")
      .update({
        owner_user_id: args.founder.userId,
        name: existingWorkspace.name || args.workspaceName,
      })
      .eq("id", args.workspaceId);

    if (claimOwnerError) {
      throw new Error(claimOwnerError.message);
    }
  }

  const role =
    !existingWorkspace ||
    !existingWorkspace.owner_user_id ||
    existingWorkspace.owner_user_id === args.founder.userId
      ? "owner"
      : "member";

  const { error: membershipError } = await admin
    .from("workspace_memberships")
    .upsert(
      {
        workspace_id: args.workspaceId,
        user_id: args.founder.userId,
        role,
      },
      { onConflict: "workspace_id,user_id" }
    );

  if (membershipError) {
    throw new Error(membershipError.message);
  }
}

export async function claimRevenueRouteByReference(input: ClaimInput) {
  const founder = await requireCurrentFounder();
  const revenueEvent = await findRevenueEventByReference(input);

  if (!revenueEvent) {
    return {
      founder,
      revenueEvent: undefined,
      receiptId: undefined,
    };
  }

  await ensureFounderWorkspaceAccess({
    founder,
    workspaceId: revenueEvent.metadata.workspace_id,
    workspaceName: buildWorkspaceName(revenueEvent),
  });

  const receipts = await listRecentReceipts();
  const receipt = receipts.find(
    (candidate) => candidate.revenueEvent.id === revenueEvent.id
  );

  return {
    founder,
    revenueEvent,
    receiptId: receipt?.id,
  };
}
