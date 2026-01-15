import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
  Dimensions,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TransactionHistory({ data, isLoading, isError }) {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 414;
  const isTablet = width > 768;

  // 1. STATE for the filter
  const [filter, setFilter] = useState("all");
  const [showFullHistory, setShowFullHistory] = useState(false);

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

  // 3. LIMIT TO FIRST 10 TRANSACTIONS FOR MAIN VIEW
  const limitedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, 10);
  }, [filteredTransactions]);

  // 4. GROUPING LOGIC FOR LIMITED TRANSACTIONS
  const groupedLimitedTransactions = useMemo(() => {
    return limitedTransactions.reduce((acc, transaction) => {
      const dateStr = transaction.date || transaction.created_at || new Date().toISOString();
      const date = new Date(dateStr);
      const monthKey = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(transaction);
      return acc;
    }, {});
  }, [limitedTransactions]);

  // 5. GROUPING LOGIC FOR FULL TRANSACTIONS (for modal)
  const groupedFullTransactions = useMemo(() => {
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

  // 6. TRANSACTION ITEM COMPONENT (reusable)
  const TransactionItem = ({ transaction, isLastItem }) => {
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
        style={[
          styles.transactionItem,
          isSmallScreen && styles.transactionItemSmall,
          isLargeScreen && styles.transactionItemLarge,
          !isLastItem && styles.borderBottom,
        ]}
      >
        <View style={styles.transactionContent}>
          <View style={styles.titleContainer}>
            <Text style={[
              styles.title,
              isSmallScreen && styles.titleSmall,
              isLargeScreen && styles.titleLarge
            ]}>
              {title}
            </Text>

            {status && status !== "completed" && status !== "success" && (
              <View style={[
                styles.statusContainer,
                isSmallScreen && styles.statusContainerSmall
              ]}>
                <Text
                  style={[
                    styles.statusBadge,
                    status === "pending" && styles.statusPending,
                    status === "failed" && styles.statusFailed,
                    isSmallScreen && styles.statusBadgeSmall,
                    isLargeScreen && styles.statusBadgeLarge
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </View>
            )}
          </View>

          <View style={[
            styles.dateContainer,
            isSmallScreen && styles.dateContainerSmall
          ]}>
            <Ionicons 
              name="calendar-outline" 
              size={isSmallScreen ? 12 : 14} 
              color="#FEB914" 
            />
            <Text style={[
              styles.dateText,
              isSmallScreen && styles.dateTextSmall,
              isLargeScreen && styles.dateTextLarge
            ]}>
              {displayDate}
            </Text>
          </View>
        </View>

        {amount !== null ? (
          <Text style={[
            styles.amount,
            { color: amountColor },
            isSmallScreen && styles.amountSmall,
            isLargeScreen && styles.amountLarge
          ]}>
            {amountPrefix}₦{Math.abs(amount).toLocaleString()}
          </Text>
        ) : (
          <Text style={[
            styles.amount,
            { color: "#aaa" },
            isSmallScreen && styles.amountSmall,
            isLargeScreen && styles.amountLarge
          ]}>
            Pending
          </Text>
        )}
      </View>
    );
  };

  // LOADING STATE - Optimized to prevent white space
  if (isLoading) {
    return (
      <View style={[
        styles.container,
        { minHeight: isSmallScreen ? height * 0.2 : height * 0.25 }
      ]}>
        <Text style={[
          styles.header,
          isSmallScreen && styles.headerSmall,
          isLargeScreen && styles.headerLarge
        ]}>
          Transaction History
        </Text>
        <View style={[
          styles.loadingContainer,
          isSmallScreen && styles.loadingContainerSmall,
          isLargeScreen && styles.loadingContainerLarge
        ]}>
          <ActivityIndicator 
            size={isSmallScreen ? "small" : "large"} 
            color="#FEB914" 
          />
          <Text style={[
            styles.loadingText,
            isSmallScreen && styles.loadingTextSmall,
            isLargeScreen && styles.loadingTextLarge
          ]}>
            Loading transactions...
          </Text>
        </View>
      </View>
    );
  }

  // ERROR STATE
  if (isError) {
    return (
      <View style={[
        styles.container,
        { minHeight: isSmallScreen ? height * 0.2 : height * 0.25 }
      ]}>
        <Text style={[
          styles.header,
          isSmallScreen && styles.headerSmall,
          isLargeScreen && styles.headerLarge
        ]}>
          Transaction History
        </Text>
        <View style={[
          styles.errorContainer,
          isSmallScreen && styles.errorContainerSmall,
          isLargeScreen && styles.errorContainerLarge
        ]}>
          <Ionicons 
            name="alert-circle-outline" 
            size={isSmallScreen ? 32 : 40} 
            color="#f44336" 
          />
          <Text style={[
            styles.errorText,
            isSmallScreen && styles.errorTextSmall,
            isLargeScreen && styles.errorTextLarge
          ]}>
            Failed to load transactions
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { minHeight: filteredTransactions.length === 0 ? 
        (isSmallScreen ? height * 0.2 : height * 0.25) : undefined 
      }
    ]}>
      <View style={styles.headerRow}>
        <Text style={[
          styles.header,
          isSmallScreen && styles.headerSmall,
          isLargeScreen && styles.headerLarge,
          isTablet && styles.headerTablet
        ]}>
          Transaction History
        </Text>

        {filteredTransactions.length > 10 && (
          <TouchableOpacity
            style={[
              styles.seeMoreButton,
              isSmallScreen && styles.seeMoreButtonSmall,
              isLargeScreen && styles.seeMoreButtonLarge
            ]}
            onPress={() => setShowFullHistory(true)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.seeMoreText,
              isSmallScreen && styles.seeMoreTextSmall,
              isLargeScreen && styles.seeMoreTextLarge
            ]}>
              See More
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={isSmallScreen ? 14 : 16} 
              color="#FEB914" 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER ROW WITH SEE MORE */}
      <View style={[
        styles.filterRow,
        isSmallScreen && styles.filterRowSmall,
        isLargeScreen && styles.filterRowLarge
      ]}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            isSmallScreen && styles.filterButtonSmall,
            isLargeScreen && styles.filterButtonLarge,
            isTablet && styles.filterButtonTablet
          ]}
          onPress={() => {
            const filters = ["all", "today", "week", "month"];
            const currentIndex = filters.indexOf(filter);
            const nextIndex = (currentIndex + 1) % filters.length;
            setFilter(filters[nextIndex]);
          }}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.filterText,
            isSmallScreen && styles.filterTextSmall,
            isLargeScreen && styles.filterTextLarge
          ]}>
            📅 {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Text>
        </TouchableOpacity>

        {filteredTransactions.length > 0 && (
          <Text style={[
            styles.countText,
            isSmallScreen && styles.countTextSmall,
            isLargeScreen && styles.countTextLarge
          ]}>
            {limitedTransactions.length} of {filteredTransactions.length}
          </Text>
        )}
      </View>

      {/* EMPTY STATE (Specific to filter) */}
      {filteredTransactions.length === 0 ? (
        <View style={[
          styles.emptyContainer,
          isSmallScreen && styles.emptyContainerSmall,
          isLargeScreen && styles.emptyContainerLarge,
          isTablet && styles.emptyContainerTablet
        ]}>
          <Ionicons 
            name="wallet-outline" 
            size={isSmallScreen ? 32 : 40} 
            color="#666" 
          />
          <Text style={[
            styles.emptyText,
            isSmallScreen && styles.emptyTextSmall,
            isLargeScreen && styles.emptyTextLarge
          ]}>
            No transactions found
          </Text>
          <Text style={[
            styles.emptySubtext,
            isSmallScreen && styles.emptySubtextSmall,
            isLargeScreen && styles.emptySubtextLarge
          ]}>
            {filter === "all" 
              ? "Your transactions will appear here" 
              : `No transactions for "${filter}"`}
          </Text>
        </View>
      ) : (
        /* LIMITED TRANSACTIONS LIST */
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[
            styles.card,
            isSmallScreen && styles.cardSmall,
            isLargeScreen && styles.cardLarge,
            isTablet && styles.cardTablet
          ]}>
            {Object.entries(groupedLimitedTransactions).map(([month, monthTransactions]) => (
              <View key={month}>
                <View style={[
                  styles.monthContainer,
                  isSmallScreen && styles.monthContainerSmall,
                  isLargeScreen && styles.monthContainerLarge
                ]}>
                  <Text style={[
                    styles.monthText,
                    isSmallScreen && styles.monthTextSmall,
                    isLargeScreen && styles.monthTextLarge
                  ]}>
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
          </View>
        </ScrollView>
      )}

      {/* FULL HISTORY MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFullHistory}
        onRequestClose={() => setShowFullHistory(false)}
      >
        <View style={[
          styles.modalOverlay,
          isTablet && styles.modalOverlayTablet
        ]}>
          <View style={[
            styles.modalContent,
            isSmallScreen && styles.modalContentSmall,
            isLargeScreen && styles.modalContentLarge,
            isTablet && styles.modalContentTablet
          ]}>
            {/* MODAL HEADER */}
            <View style={[
              styles.modalHeader,
              isSmallScreen && styles.modalHeaderSmall,
              isLargeScreen && styles.modalHeaderLarge
            ]}>
              <Text style={[
                styles.modalTitle,
                isSmallScreen && styles.modalTitleSmall,
                isLargeScreen && styles.modalTitleLarge
              ]}>
                Full Transaction History
              </Text>
              <TouchableOpacity 
                onPress={() => setShowFullHistory(false)}
                style={styles.closeButton}
              >
                <Ionicons 
                  name="close" 
                  size={isSmallScreen ? 22 : 24} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>

            {/* FILTER IN MODAL */}
            <View style={styles.modalFilterRow}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  isSmallScreen && styles.filterButtonSmall,
                  isLargeScreen && styles.filterButtonLarge
                ]}
                onPress={() => {
                  const filters = ["all", "today", "week", "month"];
                  const currentIndex = filters.indexOf(filter);
                  const nextIndex = (currentIndex + 1) % filters.length;
                  setFilter(filters[nextIndex]);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterText,
                  isSmallScreen && styles.filterTextSmall,
                  isLargeScreen && styles.filterTextLarge
                ]}>
                  📅 {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
              
              <Text style={[
                styles.modalCountText,
                isSmallScreen && styles.modalCountTextSmall,
                isLargeScreen && styles.modalCountTextLarge
              ]}>
                {filteredTransactions.length} transactions
              </Text>
            </View>

            {/* FULL TRANSACTIONS LIST */}
            {filteredTransactions.length === 0 ? (
              <View style={[
                styles.modalEmptyContainer,
                isSmallScreen && styles.modalEmptyContainerSmall,
                isLargeScreen && styles.modalEmptyContainerLarge
              ]}>
                <Ionicons 
                  name="wallet-outline" 
                  size={isSmallScreen ? 40 : 48} 
                  color="#666" 
                />
                <Text style={[
                  styles.modalEmptyText,
                  isSmallScreen && styles.modalEmptyTextSmall,
                  isLargeScreen && styles.modalEmptyTextLarge
                ]}>
                  No transactions found
                </Text>
                <Text style={[
                  styles.modalEmptySubtext,
                  isSmallScreen && styles.modalEmptySubtextSmall,
                  isLargeScreen && styles.modalEmptySubtextLarge
                ]}>
                  {filter === "all" 
                    ? "Your transactions will appear here" 
                    : `No transactions for "${filter}"`}
                </Text>
              </View>
            ) : (
              <FlatList
                data={Object.entries(groupedFullTransactions)}
                keyExtractor={([month]) => month}
                renderItem={({ item: [month, monthTransactions] }) => (
                  <View style={styles.modalMonthSection}>
                    <View style={[
                      styles.monthContainer,
                      isSmallScreen && styles.monthContainerSmall,
                      isLargeScreen && styles.monthContainerLarge
                    ]}>
                      <Text style={[
                        styles.monthText,
                        isSmallScreen && styles.monthTextSmall,
                        isLargeScreen && styles.monthTextLarge
                      ]}>
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
                )}
                contentContainerStyle={[
                  styles.modalListContent,
                  isSmallScreen && styles.modalListContentSmall,
                  isLargeScreen && styles.modalListContentLarge
                ]}
                showsVerticalScrollIndicator={true}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginTop: height * 0.02,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.008,
  },
  header: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  headerSmall: {
    fontSize: width * 0.042,
  },
  headerLarge: {
    fontSize: width * 0.048,
  },
  headerTablet: {
    fontSize: width * 0.05,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 185, 20, 0.1)',
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.006,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FEB914',
  },
  seeMoreButtonSmall: {
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.005,
    borderRadius: 12,
  },
  seeMoreButtonLarge: {
    paddingHorizontal: width * 0.035,
    paddingVertical: height * 0.007,
    borderRadius: 18,
  },
  seeMoreText: {
    color: "#FEB914",
    fontSize: width * 0.034,
    fontWeight: "600",
    marginRight: width * 0.01,
  },
  seeMoreTextSmall: {
    fontSize: width * 0.032,
  },
  seeMoreTextLarge: {
    fontSize: width * 0.036,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.015,
  },
  filterRowSmall: {
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.012,
  },
  filterRowLarge: {
    paddingHorizontal: width * 0.06,
    marginBottom: height * 0.018,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.008,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEB914",
    minHeight: height * 0.04,
  },
  filterButtonSmall: {
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.006,
    minHeight: height * 0.035,
  },
  filterButtonLarge: {
    paddingHorizontal: width * 0.035,
    paddingVertical: height * 0.01,
    minHeight: height * 0.045,
  },
  filterButtonTablet: {
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.012,
    minHeight: height * 0.05,
  },
  filterText: {
    color: "#FEB914",
    fontSize: width * 0.036,
    fontWeight: "600",
  },
  filterTextSmall: {
    fontSize: width * 0.034,
  },
  filterTextLarge: {
    fontSize: width * 0.038,
  },
  countText: {
    color: "#aaa",
    fontSize: width * 0.034,
    fontWeight: "500",
  },
  countTextSmall: {
    fontSize: width * 0.032,
  },
  countTextLarge: {
    fontSize: width * 0.036,
  },
  // ScrollView styles
  scrollContainer: {
    width: '100%',
    maxHeight: height * 0.5,
  },
  scrollContent: {
    paddingBottom: height * 0.02,
  },
  // Card styles
  card: {
    backgroundColor: "#111",
    marginHorizontal: width * 0.05,
    borderRadius: width * 0.03,
    padding: width * 0.04,
    borderWidth: 1,
    borderColor: "#FEB914",
    width: width * 0.9,
    alignSelf: 'center',
  },
  cardSmall: {
    marginHorizontal: width * 0.04,
    borderRadius: width * 0.025,
    padding: width * 0.035,
    width: width * 0.92,
  },
  cardLarge: {
    marginHorizontal: width * 0.06,
    borderRadius: width * 0.035,
    padding: width * 0.045,
    width: width * 0.88,
  },
  cardTablet: {
    maxWidth: 500,
    alignSelf: 'center',
  },
  // Loading styles
  loadingContainer: {
    backgroundColor: "#111",
    marginHorizontal: width * 0.05,
    borderRadius: width * 0.03,
    padding: height * 0.05,
    borderWidth: 1,
    borderColor: "#FEB914",
    alignItems: "center",
    justifyContent: "center",
    minHeight: height * 0.15,
    width: width * 0.9,
    alignSelf: 'center',
  },
  loadingContainerSmall: {
    marginHorizontal: width * 0.04,
    borderRadius: width * 0.025,
    padding: height * 0.04,
    minHeight: height * 0.12,
    width: width * 0.92,
  },
  loadingContainerLarge: {
    marginHorizontal: width * 0.06,
    borderRadius: width * 0.035,
    padding: height * 0.06,
    minHeight: height * 0.18,
    width: width * 0.88,
  },
  loadingText: {
    color: "#aaa",
    marginTop: height * 0.01,
    fontSize: width * 0.036,
    textAlign: 'center',
  },
  loadingTextSmall: {
    fontSize: width * 0.034,
    marginTop: height * 0.008,
  },
  loadingTextLarge: {
    fontSize: width * 0.038,
    marginTop: height * 0.012,
  },
  // Error styles
  errorContainer: {
    backgroundColor: "#111",
    marginHorizontal: width * 0.05,
    borderRadius: width * 0.03,
    padding: height * 0.05,
    borderWidth: 1,
    borderColor: "#f44336",
    alignItems: "center",
    justifyContent: "center",
    minHeight: height * 0.15,
    width: width * 0.9,
    alignSelf: 'center',
  },
  errorContainerSmall: {
    marginHorizontal: width * 0.04,
    borderRadius: width * 0.025,
    padding: height * 0.04,
    minHeight: height * 0.12,
    width: width * 0.92,
  },
  errorContainerLarge: {
    marginHorizontal: width * 0.06,
    borderRadius: width * 0.035,
    padding: height * 0.06,
    minHeight: height * 0.18,
    width: width * 0.88,
  },
  errorText: {
    color: "#f44336",
    marginTop: height * 0.01,
    fontSize: width * 0.036,
    fontWeight: "600",
    textAlign: 'center',
  },
  errorTextSmall: {
    fontSize: width * 0.034,
    marginTop: height * 0.008,
  },
  errorTextLarge: {
    fontSize: width * 0.038,
    marginTop: height * 0.012,
  },
  // Empty state styles
  emptyContainer: {
    backgroundColor: "#111",
    marginHorizontal: width * 0.05,
    borderRadius: width * 0.03,
    padding: height * 0.05,
    borderWidth: 1,
    borderColor: "#FEB914",
    alignItems: "center",
    justifyContent: "center",
    minHeight: height * 0.15,
    width: width * 0.9,
    alignSelf: 'center',
  },
  emptyContainerSmall: {
    marginHorizontal: width * 0.04,
    borderRadius: width * 0.025,
    padding: height * 0.04,
    minHeight: height * 0.12,
    width: width * 0.92,
  },
  emptyContainerLarge: {
    marginHorizontal: width * 0.06,
    borderRadius: width * 0.035,
    padding: height * 0.06,
    minHeight: height * 0.18,
    width: width * 0.88,
  },
  emptyContainerTablet: {
    maxWidth: 500,
  },
  emptyText: {
    color: "#aaa",
    marginTop: height * 0.01,
    fontSize: width * 0.04,
    fontWeight: "600",
    textAlign: 'center',
  },
  emptyTextSmall: {
    fontSize: width * 0.038,
    marginTop: height * 0.008,
  },
  emptyTextLarge: {
    fontSize: width * 0.042,
    marginTop: height * 0.012,
  },
  emptySubtext: {
    color: "#666",
    marginTop: height * 0.005,
    fontSize: width * 0.035,
    textAlign: 'center',
  },
  emptySubtextSmall: {
    fontSize: width * 0.033,
  },
  emptySubtextLarge: {
    fontSize: width * 0.037,
  },
  // Transaction item styles
  monthContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#000",
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.005,
    borderRadius: 8,
    marginBottom: height * 0.01,
  },
  monthContainerSmall: {
    paddingHorizontal: width * 0.02,
    paddingVertical: height * 0.004,
    marginBottom: height * 0.008,
  },
  monthContainerLarge: {
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.006,
    marginBottom: height * 0.012,
  },
  monthText: {
    color: "#FEB914",
    fontWeight: "600",
    fontSize: width * 0.032,
  },
  monthTextSmall: {
    fontSize: width * 0.03,
  },
  monthTextLarge: {
    fontSize: width * 0.034,
  },
  transactionItem: {
    paddingVertical: height * 0.014,
    position: "relative",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionItemSmall: {
    paddingVertical: height * 0.012,
  },
  transactionItemLarge: {
    paddingVertical: height * 0.016,
  },
  transactionContent: {
    flex: 1,
    marginRight: width * 0.02,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: height * 0.005,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#FEB91433",
  },
  title: {
    color: "#fff",
    fontSize: width * 0.038,
    fontWeight: "500",
    flexShrink: 1,
    marginRight: width * 0.02,
  },
  titleSmall: {
    fontSize: width * 0.036,
  },
  titleLarge: {
    fontSize: width * 0.04,
  },
  statusContainer: {
    marginTop: 0,
  },
  statusContainerSmall: {
    marginTop: -2,
  },
  statusBadge: {
    fontSize: width * 0.03,
    fontWeight: "600",
    paddingHorizontal: width * 0.02,
    paddingVertical: height * 0.003,
    borderRadius: 4,
  },
  statusBadgeSmall: {
    fontSize: width * 0.028,
    paddingHorizontal: width * 0.018,
  },
  statusBadgeLarge: {
    fontSize: width * 0.032,
    paddingHorizontal: width * 0.022,
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
    marginTop: height * 0.002,
  },
  dateContainerSmall: {
    marginTop: 0,
  },
  dateText: {
    color: "#aaa",
    marginLeft: width * 0.015,
    fontSize: width * 0.034,
  },
  dateTextSmall: {
    fontSize: width * 0.032,
    marginLeft: width * 0.01,
  },
  dateTextLarge: {
    fontSize: width * 0.036,
  },
  amount: {
    fontSize: width * 0.038,
    fontWeight: "bold",
    textAlign: "right",
    flexShrink: 0,
  },
  amountSmall: {
    fontSize: width * 0.036,
  },
  amountLarge: {
    fontSize: width * 0.04,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  modalOverlayTablet: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#000",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: "85%",
    padding: width * 0.05,
  },
  modalContentSmall: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%",
    padding: width * 0.04,
  },
  modalContentLarge: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "80%",
    padding: width * 0.06,
  },
  modalContentTablet: {
    width: "90%",
    maxWidth: 600,
    height: "85%",
    borderRadius: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  modalHeaderSmall: {
    marginBottom: height * 0.015,
  },
  modalHeaderLarge: {
    marginBottom: height * 0.025,
  },
  modalTitle: {
    color: "#fff",
    fontSize: width * 0.05,
    fontWeight: "bold",
  },
  modalTitleSmall: {
    fontSize: width * 0.045,
  },
  modalTitleLarge: {
    fontSize: width * 0.055,
  },
  closeButton: {
    padding: 5,
  },
  modalFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
    backgroundColor: "#111",
    padding: width * 0.03,
    borderRadius: width * 0.02,
    borderWidth: 1,
    borderColor: "#FEB914",
  },
  modalCountText: {
    color: "#FEB914",
    fontSize: width * 0.036,
    fontWeight: "600",
  },
  modalCountTextSmall: {
    fontSize: width * 0.034,
  },
  modalCountTextLarge: {
    fontSize: width * 0.038,
  },
  modalEmptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: height * 0.05,
  },
  modalEmptyContainerSmall: {
    padding: height * 0.04,
  },
  modalEmptyContainerLarge: {
    padding: height * 0.06,
  },
  modalEmptyText: {
    color: "#aaa",
    marginTop: height * 0.015,
    fontSize: width * 0.045,
    fontWeight: "600",
    textAlign: 'center',
  },
  modalEmptyTextSmall: {
    fontSize: width * 0.042,
    marginTop: height * 0.012,
  },
  modalEmptyTextLarge: {
    fontSize: width * 0.048,
    marginTop: height * 0.018,
  },
  modalEmptySubtext: {
    color: "#666",
    marginTop: height * 0.008,
    fontSize: width * 0.038,
    textAlign: 'center',
  },
  modalEmptySubtextSmall: {
    fontSize: width * 0.036,
  },
  modalEmptySubtextLarge: {
    fontSize: width * 0.04,
  },
  modalMonthSection: {
    marginBottom: height * 0.02,
  },
  modalListContent: {
    paddingBottom: height * 0.05,
  },
  modalListContentSmall: {
    paddingBottom: height * 0.04,
  },
  modalListContentLarge: {
    paddingBottom: height * 0.06,
  },
});