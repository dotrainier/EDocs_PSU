export type RequestStatus =
  | 'Pending'
  | 'In Process'
  | 'Action Required'
  | 'Ready for Release'
  | 'Released'
  | 'Cancelled';

export type ClearanceStatus = 'Pending' | 'Cleared' | 'Rejected';

export type SLAStatus = 'On Track' | 'At Risk' | 'Breached';
export type ApiSLAStatus = 'OnTrack' | 'AtRisk' | 'Breached';
export type PaymentStatus = 'Paid' | 'Unpaid';
