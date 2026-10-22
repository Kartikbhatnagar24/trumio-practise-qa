export const paths = {
  login: "/login",
  myClaims: "/claims",
  newClaim: "/claims/new",
  editClaim: { path: "/claims/:id/edit", generate: (id: number) => `/claims/${id}/edit` },
  claim: { path: "/claims/:id", generate: (id: number) => `/claims/${id}` },
  approvals: "/approvals",
  allClaims: "/all-claims",
  policy: "/policy",
  help: "/help",
};
