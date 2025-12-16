import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "./api"; 

export type FundWalletPayload = {
  amount: number;
  channel: "card";
};

export type WalletBalanceResponse = {
  balance: number;
};


// --- New Types for Withdrawal ---
export type WithdrawPayload = {
  amount: number;
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
  type: string; // Empty in your data
  // Add date?: string; if you update the backend
};

export type TransactionsResponse = {
  data: Transaction[];
  errors: Record<string, unknown>;
  message: string;
  status: "success" | "error";
};

export type CreateRecipientResponse = {
  status: number;
  message: string;
  data: {
    recipient_code: string;
  };
};

const useFundWalletEndPoint = () => {
  return useMutation({
    mutationFn: async (data: FundWalletPayload) => {
      return api.post("/wallets/fund_initiate/", data);
    },
    onSuccess: (res) => {
      const paystackUrl = res.data?.authorization_url;
      console.log("Paystack checkout URL:", paystackUrl);
    },
    onError: (error: any) => {
      console.error("Wallet funding error:", error);
    },
  });
};

const useGetMyBalance = () => {
  return useQuery({
    queryKey: ["balance"],
    queryFn: async () => {
      const res = await api.get("/wallets/my_balance/");

      console.log("💰 Wallet balance raw response:", res.data);

      // Handle common backend shapes
      if (!res.data) {
        throw new Error("No wallet balance data returned");
      }

      // If backend returns { data: {...} }
      if (res.data.data) {
        return res.data.data;
      }

      // If backend returns {...} directly
      return res.data;
    },
  });
};


const useGetMyTransactions = (
  options?: { enabled?: boolean; refetchInterval?: number }
) => {
  return useQuery({
    queryKey: ["myTransactions"],
    queryFn: async () => {
      const res = await api.get<TransactionsResponse>(
        "/wallets/my_transactions/"
      );
      console.log("Transactions data:", res.data);
      return res.data;
    },
    ...options,
  });
};


const useWithdrawFunds = () => {
  return useMutation({
    mutationFn: async (data: WithdrawPayload) => {
      return api.post<WithdrawResponse>("/wallets/withdraw/", data);
    },
    onSuccess: (res) => {
      console.log("Withdrawal successful:", res.data.message);
    },
    onError: (error: any) => {
      console.error("Withdrawal error:", error);
    },
  });
};


export type CreateRecipientPayload = {
    account_number: string;
    bank_code: string;
};

const useCreateTransferRecipient = () => {
  return useMutation({
    mutationFn: async (data: CreateRecipientPayload) => {
      return api.post<CreateRecipientResponse>(
        "/wallets/create_transfer_recipient/",
        data
      );
    },
    onSuccess: (res) => {
      console.log("Transfer recipient creation successful:", res.data);
    },
    onError: (error: any) => {
      console.error("Transfer recipient creation error:", error);
    },
  });
};


export {
  useFundWalletEndPoint,
  useGetMyBalance,
  useGetMyTransactions,
  useWithdrawFunds,
  useCreateTransferRecipient,
};