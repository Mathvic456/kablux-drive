import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGetMyTransactions } from "../../services/funding.service";

export default function TransactionHistory() {
  
  const transactionsFetch = useGetMyTransactions();

  // Extract transactions array - handle both nested and flat structures
  const transactionsArray = transactionsFetch.data?.data || transactionsFetch.data?.results || [];
  
  console.log("Full transaction response:", transactionsFetch.data);
  console.log("Extracted transactions array:", transactionsArray);
  console.log("Array length:", transactionsArray.length);

  // Loading state
  if (transactionsFetch.isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Transaction History</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FEB914" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (transactionsFetch.isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Transaction History</Text>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#f44336" />
          <Text style={styles.errorText}>Failed to load transactions</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (!transactionsArray || transactionsArray.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Transaction History</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={40} color="#666" />
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>Your transactions will appear here</Text>
        </View>
      </View>
    );
  }

  const groupedTransactions = transactionsArray.reduce((acc, transaction) => {
    const dateStr = transaction.date || transaction.created_at || new Date().toISOString();
    const date = new Date(dateStr);
    const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(transaction);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>
        Transaction History
      </Text>

      {/* Transactions Card */}
      <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedTransactions).map(([month, monthTransactions]) => (
          <View key={month}>
            {/* Month Label */}
            <View style={styles.monthContainer}>
              <Text style={styles.monthText}>{month}</Text>
            </View>

            {/* Transactions List */}
            {monthTransactions.map((transaction, index) => {
              // Flexibly handle different response formats
              const channel = (transaction.channel || 'Unknown').charAt(0).toUpperCase() + (transaction.channel || 'unknown').slice(1);
              const direction = transaction.direction ? transaction.direction.charAt(0).toUpperCase() + transaction.direction.slice(1) : '';
              const status = transaction.status || 'completed';
              const title = transaction.description || transaction.title || 
                (status === 'pending' ? `Pending ${channel} Transaction` : `${channel} ${direction}`.trim()) || 
                'Transaction';
              const rawAmount = transaction.amount;
              const amount = rawAmount ? parseFloat(rawAmount) : null;
              const dateStr = transaction.date || transaction.created_at || new Date().toISOString();
              const displayDate = new Date(dateStr).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              });

              // Determine amount color and prefix based on direction (fallback to type if direction missing)
              const effectiveType = transaction.direction || transaction.type || 'debit'; // Default to debit for safety
              const amountColor = (effectiveType === 'credit' || effectiveType === 'deposit') ? '#4CAF50' : '#f44336';
              const amountPrefix = (effectiveType === 'credit' || effectiveType === 'deposit') ? '+' : '-';

              return (
                <View
                  key={transaction.id || index}
                  style={[
                    styles.transactionItem,
                    index !== monthTransactions.length - 1 && styles.borderBottom
                  ]}
                >
                  {/* Transaction Title */}
                  <Text style={styles.title}>
                    {title}
                  </Text>

                  {/* Status Badge (if applicable) */}
                  {status && status !== 'completed' && status !== 'success' && (
                    <Text style={[
                      styles.statusBadge,
                      status === 'pending' && styles.statusPending,
                      status === 'failed' && styles.statusFailed,
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  )}

                  {/* Date */}
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color="#FEB914" />
                    <Text style={styles.dateText}>{displayDate}</Text>
                  </View>

                  {/* Amount */}
                  {amount !== null ? (
                    <Text style={[styles.amount, { color: amountColor }]}>
                      {amountPrefix}₦{Math.abs(amount).toLocaleString()}
                    </Text>
                  ) : (
                    <Text style={[styles.amount, { color: '#aaa' }]}>
                      Pending
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#111",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#FEB914",
    maxHeight: 400,
  },
  loadingContainer: {
    backgroundColor: "#111",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 40,
    borderWidth: 1,
    borderColor: "#FEB914",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#aaa",
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: "#111",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 40,
    borderWidth: 1,
    borderColor: "#f44336",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#f44336",
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    backgroundColor: "#111",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 40,
    borderWidth: 1,
    borderColor: "#FEB914",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#aaa",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#666",
    marginTop: 5,
    fontSize: 14,
  },
  monthContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#000",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  monthText: {
    color: "#FEB914",
    fontWeight: "600",
    fontSize: 12,
  },
  transactionItem: {
    paddingVertical: 12,
    position: "relative",
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#FEB91433",
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPending: {
    color: "#FEB914",
    backgroundColor: "#FEB91422",
  },
  statusFailed: {
    color: "#f44336",
    backgroundColor: "#f4433622",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  dateText: {
    color: "#aaa",
    marginLeft: 6,
    fontSize: 14,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
    textAlign: "right",
    position: "absolute",
    right: 0,
    top: 12,
  },
});