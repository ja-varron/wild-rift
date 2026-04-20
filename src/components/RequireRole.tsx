import { Navigate } from "react-router-dom";

import type { UserProfile } from "@/model/user-profile";
import type { ReactNode } from "react";

export default function RequireRole({
	children,
	allowedRoles,
  userProfile,
  isLoading
}: {
	children: ReactNode;
  userProfile: UserProfile | null | undefined,
  isLoading: boolean,
	allowedRoles: string[];
}) {
  
	if (isLoading) return null;

	const userRole = userProfile?.role?.toLowerCase() ?? '';
	const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

	if (!userRole || !normalizedAllowedRoles.includes(userRole)) {
		return <Navigate to="/" replace />;
	}

	return children;
}