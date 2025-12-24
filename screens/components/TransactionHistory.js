import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TransactionHistory({ data, isLoading, isError }) {
  // 1. STATE for the filter
  const [filter, setFilter] = useState("all");

  // Extract transactions array
  const transactionsArray = data?.data || data?.results || [];

  // 2. FILTER LOGIC (Memoized to prevent lag)
  const filteredTransactions = useMemo(() => {
    if (!transactionsArray || transactionsArray.length === 0) return [];
    
    if (filter === "all") return transactionsArray;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return transactionsArray.filter((t) => {
      const dateStr = t.date || t.created_at;
      if (!dateStr) return false;
      
      const tDate = new Date(dateStr);
      // Safety check for invalid dates
      if (isNaN(tDate.getTime())) return false;

      if (filter === "today") {
        const tDay = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
        return tDay.getTime() === today.getTime();
      }
      
      if (filter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return tDate >= weekAgo;
      }
      
      if (filter === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return tDate >= monthAgo;
      }

      return true;
    });
  }, [transactionsArray, filter]);

  // 3. GROUPING LOGIC (Applied to the FILTERED list)
  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((acc, transaction) => {
      const dateStr = transaction.date || transaction.created_at || new Date().toISOString();
      const date = new Date(dateStr);
      const monthKey = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(transaction);
      return acc;
    }, {});
  }, [filteredTransactions]);

  // LOADING STATE
  if (isLoading) {
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

  // ERROR STATE
  if (isError) {
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Transaction History</Text>

      {/* 4. FILTER BUTTON UI */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            const filters = ["all", "today", "week", "month"];
            const currentIndex = filters.indexOf(filter);
            const nextIndex = (currentIndex + 1) % filters.length;
            setFilter(filters[nextIndex]);
          }}
        >
          <Text style={styles.filterText}>
            📅 {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* EMPTY STATE (Specific to filter) */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={40} color="#666" />
          <Text style={styles.emptyText}>No transactions found</Text>
          <Text style={styles.emptySubtext}>
            {filter === "all" 
              ? "Your transactions will appear here" 
              : `No transactions for "${filter}"`}
          </Text>
        </View>
      ) : (
        /* TRANSACTIONS LIST */
        <View style={styles.card}>
          {Object.entries(groupedTransactions).map(([month, monthTransactions]) => (
            <View key={month}>
              <View style={styles.monthContainer}>
                <Text style={styles.monthText}>{month}</Text>
              </View>

              {monthTransactions.map((transaction, index) => {
                const channel = (transaction.channel || "Unknown").charAt(0).toUpperCase() + (transaction.channel || "unknown").slice(1);
                const direction = transaction.direction ? transaction.direction.charAt(0).toUpperCase() + transaction.direction.slice(1) : "";
                const status = transaction.status || "completed";
                const title = transaction.description || transaction.title || 
                  (status === "pending" ? `Pending ${channel} Transaction` : `${channel} ${direction}`.trim()) || 
                  "Transaction";
                const rawAmount = transaction.amount;
                const amount = rawAmount ? parseFloat(rawAmount) : null;
                const dateStr = transaction.date || transaction.created_at || new Date().toISOString();
                const displayDate = new Date(dateStr).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const effectiveType = transaction.direction || transaction.type || "debit";
                const amountColor = (effectiveType === "credit" || effectiveType === "deposit") ? "#4CAF50" : "#f44336";
                const amountPrefix = (effectiveType === "credit" || effectiveType === "deposit") ? "+" : "-";

                return (
                  <View
                    key={transaction.id || index}
                    style={[
                      styles.transactionItem,
                      index !== monthTransactions.length - 1 && styles.borderBottom,
                    ]}
                  >
                    <Text style={styles.title}>{title}</Text>

                    {status && status !== "completed" && status !== "success" && (
                      <Text
                        style={[
                          styles.statusBadge,
                          status === "pending" && styles.statusPending,
                          status === "failed" && styles.statusFailed,
                        ]}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    )}

                    <View style={styles.dateContainer}>
                      <Ionicons name="calendar-outline" size={14} color="#FEB914" />
                      <Text style={styles.dateText}>{displayDate}</Text>
                    </View>

                    {amount !== null ? (
                      <Text style={[styles.amount, { color: amountColor }]}>
                        {amountPrefix}₦{Math.abs(amount).toLocaleString()}
                      </Text>
                    ) : (
                      <Text style={[styles.amount, { color: "#aaa" }]}>
                        Pending
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
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
    marginBottom: 5, // Reduced bottom margin slightly
  },
  // NEW STYLES FOR FILTER
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEB914",
    alignSelf: "flex-start",
  },
  filterText: {
    color: "#FEB914",
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  // EXISTING STYLES
  card: {
    backgroundColor: "#111",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#FEB914",
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