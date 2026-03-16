export const SystemEvent = {
  SALES_CREATED: "sales.created",
  SALES_SUBMITTED: "sales.submitted",
  SALES_CANCELLED: "sales.cancelled",

  PURCHASE_CREATED: "purchase.created",
  PURCHASE_SUBMITTED: "purchase.submitted",
  PURCHASE_CANCELLED: "purchase.cancelled",

  GRN_SUBMITTED: "grn.submitted",
  GDN_SUBMITTED: "gdn.submitted",
  TRANSFER_SUBMITTED: "transfer.submitted",
  ADJUSTMENT_CREATED: "adjustment.created",
  CREDIT_NOTE_SUBMITTED: "credit_note.submitted",
  CONSUMABLE_ISSUE_SUBMITTED: "consumable_issue.submitted",

  INVENTORY_MOVEMENT: "inventory.movement",

  PAYMENT_RECORDED: "payment.recorded",
} as const;

export type SystemEventType = (typeof SystemEvent)[keyof typeof SystemEvent];

export type EventPayload = Record<string, unknown>;

export type DocumentTransitionPayload = {
  entity: string;
  id: string;
  from: string;
  to: string;
};
