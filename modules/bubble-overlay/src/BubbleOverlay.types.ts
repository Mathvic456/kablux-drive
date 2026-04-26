export type BubbleStatus =
  | 'incoming'
  | 'accepted'
  | 'arrived'
  | 'on_trip'
  | 'idle';

export interface BubblePayload {
  rideId?: string;
  rider?: string;
  fare?: string;
  status?: BubbleStatus;
}
