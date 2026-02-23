export enum ListBookStatus {
  PENDING = 'pending',
  CLAIMED = 'claimed',
  IN_PROGRESS = 'in_progress',
  SOURCED = 'sourced',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  NOT_FOUND = 'not_found',
  CANCELLED = 'cancelled',
}

export const VALID_STATUS_TRANSITIONS: Record<ListBookStatus, ListBookStatus[]> = {
  [ListBookStatus.PENDING]: [ListBookStatus.CLAIMED, ListBookStatus.CANCELLED],
  [ListBookStatus.CLAIMED]: [ListBookStatus.IN_PROGRESS, ListBookStatus.NOT_FOUND, ListBookStatus.CANCELLED],
  [ListBookStatus.IN_PROGRESS]: [ListBookStatus.SOURCED, ListBookStatus.NOT_FOUND, ListBookStatus.CANCELLED],
  [ListBookStatus.SOURCED]: [ListBookStatus.SHIPPED, ListBookStatus.CANCELLED],
  [ListBookStatus.SHIPPED]: [ListBookStatus.DELIVERED, ListBookStatus.CANCELLED],
  [ListBookStatus.DELIVERED]: [],
  [ListBookStatus.NOT_FOUND]: [ListBookStatus.PENDING],
  [ListBookStatus.CANCELLED]: [],
};

export function isValidStatusTransition(from: ListBookStatus, to: ListBookStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
