export interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  clientWa: string;
  description: string;
  secretContent: string;
  status: 'pending' | 'paid';
  createdAt: string;
  ngrokUrl?: string; // Where to send the WA payload
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
