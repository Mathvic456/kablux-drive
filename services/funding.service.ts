import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "./api";

// ---------- Payload & Response Types ----------
export type FundWalletPayload = {
  amount: number;
  channel: "bank";
};

export type WalletBalanceResponse = {
  balance: number;
};

export type WithdrawPayload = {
  amount: number;
  recipient_code: string;
};

export type WithdrawResponse = {
  status: number;
  message: string;
};

export type Transaction = {
  id: string;
  amount: string | null;
  channel: string;
  direction: "credit" | "debit" | "";
  reference: string;
  status: "success" | "pending" | "failed";
  type: string;
};

export type TransactionsResponse = {
  data: Transaction[];
  errors: Record<string, unknown>;
  message: string;
  status: "success" | "error";
};

export type CreateRecipientPayload = {
  account_number: string;
  bank_code: string;
  account_name: string;
};

export type CreateRecipientResponse = {
  status: number;
  message: string;
  account_number: string; // Direct properties, not nested in data
  recipient_code: string;
  bank_name?: string;
};

// ---------- React Query Hooks ----------

// Fund Wallet
export const useFundWalletEndPoint = () => {
  return useMutation({
    mutationFn: async (data: FundWalletPayload) => api.post("/wallets/fund_initiate/", data),
    onSuccess: (res) => {
      const paystackUrl = res.data?.authorization_url;
      console.log("Paystack checkout URL:", paystackUrl);
    },
    onError: (err: any) => console.error("Wallet funding error:", err),
  });
};

// Get Wallet Balance
export const useGetMyBalance = () => {
  return useQuery<WalletBalanceResponse>({
    queryKey: ["balance"],
    queryFn: async () => {
      const res = await api.get("/wallets/my_balance/");
      return res.data ?? { balance: 0 };
    },
  });
};

// Get Wallet Transactions
export const useGetMyTransactions = (options?: { enabled?: boolean; refetchInterval?: number }) => {
  return useQuery<TransactionsResponse>({
    queryKey: ["myTransactions"],
    queryFn: async () => {
      const res = await api.get("/wallets/my_transactions/");
      return res.data;
    },
    ...options,
  });
};




export type ResolveAccountPayload = {
  account_number: string;
  bank_code: string;
};

export type ResolveAccountResponse = {
  data: {
    account_name: string;
    account_number: string;
    bank_id: number;
  };
  status: string;
};


export const useResolveAccount = () => {
  return useMutation({
    mutationFn: async ({ account_number, bank_code }: ResolveAccountPayload) => {
      const response = await api.post<ResolveAccountResponse>('/wallets/resolve-account/', {
        account_number,
        bank_code,
      });

      console.log('🔍 Full resolve response:', response.data);

      // Return the entire response data (which includes data and status)
      return response.data;
    },
  });
};


// Create Transfer Recipient
export const useCreateTransferRecipient = () => {
  return useMutation({
    mutationFn: async (data: CreateRecipientPayload) =>
      api.post<CreateRecipientResponse>("/wallets/create_transfer_recipient/", data),
    onSuccess: (res) => console.log("Transfer recipient created:", res.data),
    onError: (err: any) => console.error("Transfer recipient creation failed:", err),
  });
};

// Get Saved Recipient(s) from Backend
export const useGetTransferRecipient = () => {
  return useQuery<CreateRecipientResponse[]>({
    queryKey: ["transferRecipient"],
    queryFn: async () => {
      const res = await api.get("/wallets/transfer_recipient/");
      return res.data?.data ?? [];
    },
    staleTime: 1000 * 60 * 5, // cache 5 min
    refetchOnWindowFocus: false,
  });
};

// Withdraw Funds// Withdraw Funds
export const useWithdrawFunds = () => {
  return useMutation({
    mutationFn: async (data: WithdrawPayload) => {
      console.log("💰 Withdraw payload being sent:", data);
      
      const response = await api.post<WithdrawResponse>("/wallets/withdraw/", data);
      
      console.log("💰 Withdraw response received:", response.data);
      return response.data;
    },
    onSuccess: (res) => console.log("✅ Withdrawal successful:", res.message),
    onError: (err: any) => {
      console.error("❌ Withdrawal failed:", err);
      console.error("Error details:", err?.response?.data);
      console.error("Request payload:", err?.config?.data);
    },
  });
};