// Utility to get current organization ID from localStorage
// This matches how the select page stores it

export const getCurrentOrganizationId = (): string => {
  // Get from localStorage where select page saves it
  const orgId = localStorage.getItem("selectedOrganizationId");

  if (!orgId) {
    throw new Error(
      "No organization selected. Please select an organization first.",
    );
  }

  return orgId;
};

// Helper to set organization ID (called from select page)
export const setCurrentOrganizationId = (organizationId: string): void => {
  localStorage.setItem("selectedOrganizationId", organizationId);
};
