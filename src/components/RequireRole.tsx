import { Navigate } from "react-router-dom";

import { UserProfile } from "@/model/user-profile";
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

	const userRole = userProfile?.getUserRole?.toLowerCase();
	if (!userRole || !allowedRoles.map(role => role.toLowerCase()).includes(userRole)) {
		return <Navigate to="/" replace />;
	}

	return children;
}