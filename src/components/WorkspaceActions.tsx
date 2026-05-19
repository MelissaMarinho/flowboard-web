"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import InviteMemberModal from "./InviteMemberModal";

export default function WorkspaceActions({
  workspaceId,
  workspaceName,
  isOwner,
}: {
  workspaceId: string;
  workspaceName: string;
  isOwner: boolean;
}) {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowInvite(true)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition-colors"
        title={isOwner ? "Manage members" : "View members"}
      >
        <Users className="h-3.5 w-3.5" />
        {isOwner ? "Manage members" : "View members"}
      </button>

      {showInvite && (
        <InviteMemberModal
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          onClose={() => setShowInvite(false)}
        />
      )}
    </>
  );
}
