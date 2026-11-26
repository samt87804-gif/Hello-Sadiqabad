export function countOwnerRequestsAwaitingReview(
  requests: ReadonlyArray<{ status: string }>
): number {
  return requests.filter((request) => request.status === 'new' || request.status === 'in_review').length;
}
