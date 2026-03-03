import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ITEMS_PER_PAGE = 10;

export default function TransactionHistory({ data, isLoading, isError }) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 414;
  const isTablet = width > 768;
  const screenHeight = Dimensions.get("window").height;
  const isShortScreen = screenHeight < 700;

  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const transactionsArray = data?.data || data?.results || [];

  // FILTER LOGIC
  const filteredTransactions = useMemo(() => {
    if (!transactionsArray || transactionsArray.length === 0) return [];
    if (filter === "all") return transactionsArray;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return transactionsArray.filter((t) => {
      const dateStr = t.date || t.created_at;
      if (!dateStr) return false;
      const tDate = new Date(dateStr);
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

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));

  // Cycle filter and reset to page 1
  const handleFilterChange = () => {
    const filters = ["all", "today", "week", "month"];
    const nextIndex = (filters.indexOf(filter) + 1) % filters.length;
    setFilter(filters[nextIndex]);
    setCurrentPage(1);
  };

  // PAGINATION SLICE
  const pagedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // GROUP BY MONTH
  const groupedTransactions = useMemo(() => {
    return pagedTransactions.reduce((acc, transaction) => {
      const dateStr = transaction.date || transaction.created_at || new Date().toISOString();
      const date = new Date(dateStr);
      const monthKey = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(transaction);
      return acc;
    }, {});
  }, [pagedTransactions]);

  // TRANSACTION ITEM
  const TransactionItem = ({ transaction, isLastItem }) => {
    const channel =
      (transaction.channel || "Unknown").charAt(0).toUpperCase() +
      (transaction.channel || "unknown").slice(1);
    const direction = transaction.direction
      ? transaction.direction.charAt(0).toUpperCase() + transaction.direction.slice(1)
      : "";
    const status = transaction.status || "completed";
    const title =
      transaction.description ||
      transaction.title ||
      (status === "pending"
        ? `Pending ${channel} Transaction`
        : `${channel} ${direction}`.trim()) ||
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
    const amountColor =
      effectiveType === "credit" || effectiveType === "deposit" ? "#4CAF50" : "#f44336";
    const amountPrefix =
      effectiveType === "credit" || effectiveType === "deposit" ? "+" : "-";

    return (
      <View
        style={[
          styles.transactionItem,
          isSmallScreen && styles.transactionItemSmall,
          isLargeScreen && styles.transactionItemLarge,
          isShortScreen && styles.transactionItemShort,
          !isLastItem && styles.borderBottom,
        ]}
      >
        <View style={styles.transactionContent}>
          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                isSmallScreen && styles.titleSmall,
                isLargeScreen && styles.titleLarge,
                isShortScreen && styles.titleShort,
              ]}
            >
              {title}
            </Text>
            {status && status !== "completed" && status !== "success" && (
              <View style={styles.statusContainer}>
                <Text
                  style={[
                    styles.statusBadge,
                    status === "pending" && styles.statusPending,
                    status === "failed" && styles.statusFailed,
                    isSmallScreen && styles.statusBadgeSmall,
                    isShortScreen && styles.statusBadgeShort,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.dateContainer}>
            <Ionicons
              name="calendar-outline"
              size={isSmallScreen ? 12 : isShortScreen ? 10 : 14}
              color="#FEB914"
            />
            <Text
              style={[
                styles.dateText,
                isSmallScreen && styles.dateTextSmall,
                isLargeScreen && styles.dateTextLarge,
                isShortScreen && styles.dateTextShort,
              ]}
            >
              {displayDate}
            </Text>
          </View>
        </View>

        {amount !== null ? (
          <Text
            style={[
              styles.amount,
              { color: amountColor },
              isSmallScreen && styles.amountSmall,
              isLargeScreen && styles.amountLarge,
              isShortScreen && styles.amountShort,
            ]}
          >
            {amountPrefix}₦{Math.abs(amount).toLocaleString()}
          </Text>
        ) : (
          <Text style={[styles.amount, { color: "#aaa" }, isSmallScreen && styles.amountSmall, isShortScreen && styles.amountShort]}>
            Pending
          </Text>
        )}
      </View>
    );
  };

  // LOADING STATE
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.header, isSmallScreen && styles.headerSmall, isShortScreen && styles.headerShort]}>
          Transaction History
        </Text>
        <View style={[styles.stateCard, { borderColor: "#FEB914" }]}>
          <ActivityIndicator size={isSmallScreen ? "small" : "large"} color="#FEB914" />
          <Text style={styles.stateText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  // ERROR STATE
  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={[styles.header, isSmallScreen && styles.headerSmall, isShortScreen && styles.headerShort]}>
          Transaction History
        </Text>
        <View style={[styles.stateCard, { borderColor: "#f44336" }]}>
          <Ionicons name="alert-circle-outline" size={isSmallScreen ? 28 : 40} color="#f44336" />
          <Text style={[styles.stateText, { color: "#f44336", fontWeight: "600" }]}>
            Failed to load transactions
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text
        style={[
          styles.header,
          isSmallScreen && styles.headerSmall,
          isLargeScreen && styles.headerLarge,
          isTablet && styles.headerTablet,
          isShortScreen && styles.headerShort,
        ]}
      >
        Transaction History
      </Text>

      {/* Filter + Count row */}
      <View style={[styles.filterRow, isShortScreen && styles.filterRowShort]}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            isSmallScreen && styles.filterButtonSmall,
            isShortScreen && styles.filterButtonShort,
          ]}
          onPress={handleFilterChange}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, isSmallScreen && styles.filterTextSmall, isShortScreen && styles.filterTextShort]}>
            📅 {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Text>
        </TouchableOpacity>

        {filteredTransactions.length > 0 && (
          <Text style={[styles.countText, isSmallScreen && styles.countTextSmall, isShortScreen && styles.countTextShort]}>
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length}
          </Text>
        )}
      </View>

      {/* Empty state */}
      {filteredTransactions.length === 0 ? (
        <View style={[styles.stateCard, { borderColor: "#FEB914" }]}>
          <Ionicons name="wallet-outline" size={isSmallScreen ? 28 : 40} color="#666" />
          <Text style={styles.stateText}>No transactions found</Text>
          <Text style={styles.stateSubtext}>
            {filter === "all"
              ? "Your transactions will appear here"
              : `No transactions for "${filter}"`}
          </Text>
        </View>
      ) : (
        // No ScrollView here — the parent Wallet ScrollView handles all scrolling
        <View
          style={[
            styles.card,
            isSmallScreen && styles.cardSmall,
            isLargeScreen && styles.cardLarge,
            isTablet && styles.cardTablet,
            isShortScreen && styles.cardShort,
          ]}
        >
          {Object.entries(groupedTransactions).map(([month, monthTransactions]) => (
            <View key={month}>
              <View style={[styles.monthContainer, isShortScreen && styles.monthContainerShort]}>
                <Text style={[styles.monthText, isSmallScreen && styles.monthTextSmall, isShortScreen && styles.monthTextShort]}>
                  {month}
                </Text>
              </View>
              {monthTransactions.map((transaction, index) => (
                <TransactionItem
                  key={transaction.id || index}
                  transaction={transaction}
                  isLastItem={index === monthTransactions.length - 1}
                />
              ))}
            </View>
          ))}

          {/* Pagination sits inside the card, flush at the bottom */}
          {totalPages > 1 && (
            <View style={[styles.paginationRow, isShortScreen && styles.paginationRowShort]}>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-back"
                  size={isSmallScreen ? 14 : 18}
                  color={currentPage === 1 ? "#444" : "#FEB914"}
                />
                <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>
                  Prev
                </Text>
              </TouchableOpacity>

              <Text style={styles.pageIndicator}>
                {currentPage} / {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                activeOpacity={0.7}
              >
                <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonTextDisabled]}>
                  Next
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={isSmallScreen ? 14 : 18}
                  color={currentPage === totalPages ? "#444" : "#FEB914"}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    marginTop: Math.min(height * 0.02, 16),
    width: "100%",
  },
  header: {
    color: "#fff",
    fontSize: Math.min(width * 0.045, 18),
    fontWeight: "bold",
    paddingHorizontal: Math.min(width * 0.05, 20),
    marginBottom: Math.min(height * 0.008, 6),
  },
  headerSmall: { fontSize: Math.min(width * 0.042, 16) },
  headerLarge: { fontSize: Math.min(width * 0.048, 20) },
  headerTablet: { fontSize: Math.min(width * 0.05, 22) },
  headerShort: { fontSize: Math.min(width * 0.04, 15) },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Math.min(width * 0.05, 20),
    marginBottom: Math.min(height * 0.015, 12),
  },
  filterRowShort: { marginBottom: Math.min(height * 0.008, 6) },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: Math.min(width * 0.03, 12),
    paddingVertical: Math.min(height * 0.008, 6),
    borderRadius: Math.min(width * 0.04, 20),
    borderWidth: 1,
    borderColor: "#FEB914",
  },
  filterButtonSmall: { paddingHorizontal: Math.min(width * 0.025, 10) },
  filterButtonShort: { paddingVertical: Math.min(height * 0.005, 4) },
  filterText: {
    color: "#FEB914",
    fontSize: Math.min(width * 0.036, 15),
    fontWeight: "600",
  },
  filterTextSmall: { fontSize: Math.min(width * 0.034, 14) },
  filterTextShort: { fontSize: Math.min(width * 0.032, 13) },
  countText: {
    color: "#aaa",
    fontSize: Math.min(width * 0.034, 14),
    fontWeight: "500",
  },
  countTextSmall: { fontSize: Math.min(width * 0.032, 12) },
  countTextShort: { fontSize: Math.min(width * 0.03, 11) },
  card: {
    backgroundColor: "#111",
    marginHorizontal: Math.min(width * 0.05, 20),
    borderRadius: Math.min(width * 0.03, 12),
    padding: Math.min(width * 0.04, 16),
    borderWidth: 1,
    borderColor: "#FEB914",
    maxWidth: 500,
    alignSelf: "center",
    width: width * 0.9,
  },
  cardSmall: { marginHorizontal: Math.min(width * 0.04, 16), padding: Math.min(width * 0.035, 14) },
  cardLarge: { marginHorizontal: Math.min(width * 0.06, 24), padding: Math.min(width * 0.045, 18) },
  cardTablet: { maxWidth: 500, alignSelf: "center" },
  cardShort: { padding: Math.min(width * 0.03, 12) },
  stateCard: {
    backgroundColor: "#111",
    marginHorizontal: Math.min(width * 0.05, 20),
    borderRadius: Math.min(width * 0.03, 12),
    padding: Math.min(height * 0.05, 30),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: Math.min(height * 0.15, 120),
    maxWidth: 500,
    alignSelf: "center",
    width: width * 0.9,
  },
  stateText: {
    color: "#aaa",
    marginTop: Math.min(height * 0.01, 8),
    fontSize: Math.min(width * 0.036, 15),
    textAlign: "center",
  },
  stateSubtext: {
    color: "#666",
    marginTop: Math.min(height * 0.005, 4),
    fontSize: Math.min(width * 0.035, 14),
    textAlign: "center",
  },
  monthContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#000",
    paddingHorizontal: Math.min(width * 0.025, 10),
    paddingVertical: Math.min(height * 0.005, 4),
    borderRadius: 8,
    marginBottom: Math.min(height * 0.01, 8),
  },
  monthContainerShort: { paddingVertical: Math.min(height * 0.003, 2), marginBottom: Math.min(height * 0.006, 4) },
  monthText: { color: "#FEB914", fontWeight: "600", fontSize: Math.min(width * 0.032, 13) },
  monthTextSmall: { fontSize: Math.min(width * 0.03, 12) },
  monthTextShort: { fontSize: Math.min(width * 0.028, 11) },
  transactionItem: {
    paddingVertical: Math.min(height * 0.014, 12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: Math.min(height * 0.05, 40),
  },
  transactionItemSmall: { paddingVertical: Math.min(height * 0.012, 10), minHeight: Math.min(height * 0.045, 36) },
  transactionItemLarge: { paddingVertical: Math.min(height * 0.016, 14), minHeight: Math.min(height * 0.055, 44) },
  transactionItemShort: { paddingVertical: Math.min(height * 0.01, 8), minHeight: Math.min(height * 0.04, 32) },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: "#FEB91433" },
  transactionContent: { flex: 1, marginRight: Math.min(width * 0.02, 8) },
  titleContainer: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: Math.min(height * 0.005, 4) },
  title: { color: "#fff", fontSize: Math.min(width * 0.038, 15), fontWeight: "500", flexShrink: 1, marginRight: Math.min(width * 0.02, 8) },
  titleSmall: { fontSize: Math.min(width * 0.036, 14) },
  titleLarge: { fontSize: Math.min(width * 0.04, 16) },
  titleShort: { fontSize: Math.min(width * 0.034, 13) },
  statusContainer: { marginTop: 0 },
  statusBadge: { fontSize: Math.min(width * 0.03, 12), fontWeight: "600", paddingHorizontal: Math.min(width * 0.02, 8), paddingVertical: Math.min(height * 0.003, 2), borderRadius: 4 },
  statusBadgeSmall: { fontSize: Math.min(width * 0.028, 11) },
  statusBadgeShort: { fontSize: Math.min(width * 0.026, 10) },
  statusPending: { color: "#FEB914", backgroundColor: "#FEB91422" },
  statusFailed: { color: "#f44336", backgroundColor: "#f4433622" },
  dateContainer: { flexDirection: "row", alignItems: "center", marginTop: Math.min(height * 0.002, 2) },
  dateText: { color: "#aaa", marginLeft: Math.min(width * 0.015, 6), fontSize: Math.min(width * 0.034, 13) },
  dateTextSmall: { fontSize: Math.min(width * 0.032, 12) },
  dateTextLarge: { fontSize: Math.min(width * 0.036, 14) },
  dateTextShort: { fontSize: Math.min(width * 0.03, 11) },
  amount: { fontSize: Math.min(width * 0.038, 15), fontWeight: "bold", textAlign: "right", flexShrink: 0 },
  amountSmall: { fontSize: Math.min(width * 0.036, 14) },
  amountLarge: { fontSize: Math.min(width * 0.04, 16) },
  amountShort: { fontSize: Math.min(width * 0.034, 13) },
  // Pagination sits inside the card with a top divider
  paginationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Math.min(height * 0.015, 12),
    paddingTop: Math.min(height * 0.015, 12),
    borderTopWidth: 1,
    borderTopColor: "#FEB91433",
  },
  paginationRowShort: {
    marginTop: Math.min(height * 0.01, 8),
    paddingTop: Math.min(height * 0.01, 8),
  },
  pageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Math.min(width * 0.03, 12),
    paddingVertical: Math.min(height * 0.006, 5),
    borderRadius: Math.min(width * 0.02, 8),
    borderWidth: 1,
    borderColor: "#FEB914",
    backgroundColor: "rgba(254,185,20,0.08)",
  },
  pageButtonDisabled: { borderColor: "#333", backgroundColor: "transparent" },
  pageButtonText: { color: "#FEB914", fontSize: Math.min(width * 0.035, 14), fontWeight: "600" },
  pageButtonTextDisabled: { color: "#444" },
  pageIndicator: { color: "#aaa", fontSize: Math.min(width * 0.035, 14), fontWeight: "500" },
});