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
  SafeAreaView,
  StatusBar,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TransactionHistory({ data, isLoading, isError }) {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 414;
  const isTablet = width > 768;
  const screenHeight = Dimensions.get('window').height;
  const isShortScreen = screenHeight < 700;

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
          isShortScreen && styles.transactionItemShort,
          !isLastItem && styles.borderBottom,
        ]}
      >
        <View style={styles.transactionContent}>
          <View style={styles.titleContainer}>
            <Text style={[
              styles.title,
              isSmallScreen && styles.titleSmall,
              isLargeScreen && styles.titleLarge,
              isShortScreen && styles.titleShort
            ]}>
              {title}
            </Text>

            {status && status !== "completed" && status !== "success" && (
              <View style={[
                styles.statusContainer,
                isSmallScreen && styles.statusContainerSmall,
                isShortScreen && styles.statusContainerShort
              ]}>
                <Text
                  style={[
                    styles.statusBadge,
                    status === "pending" && styles.statusPending,
                    status === "failed" && styles.statusFailed,
                    isSmallScreen && styles.statusBadgeSmall,
                    isLargeScreen && styles.statusBadgeLarge,
                    isShortScreen && styles.statusBadgeShort
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </View>
            )}
          </View>

          <View style={[
            styles.dateContainer,
            isSmallScreen && styles.dateContainerSmall,
            isShortScreen && styles.dateContainerShort
          ]}>
            <Ionicons 
              name="calendar-outline" 
              size={isSmallScreen ? 12 : isShortScreen ? 10 : 14} 
              color="#FEB914" 
            />
            <Text style={[
              styles.dateText,
              isSmallScreen && styles.dateTextSmall,
              isLargeScreen && styles.dateTextLarge,
              isShortScreen && styles.dateTextShort
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
            isLargeScreen && styles.amountLarge,
            isShortScreen && styles.amountShort
          ]}>
            {amountPrefix}₦{Math.abs(amount).toLocaleString()}
          </Text>
        ) : (
          <Text style={[
            styles.amount,
            { color: "#aaa" },
            isSmallScreen && styles.amountSmall,
            isLargeScreen && styles.amountLarge,
            isShortScreen && styles.amountShort
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
        { minHeight: isSmallScreen ? height * 0.2 : isShortScreen ? height * 0.18 : height * 0.25 }
      ]}>
        <Text style={[
          styles.header,
          isSmallScreen && styles.headerSmall,
          isLargeScreen && styles.headerLarge,
          isShortScreen && styles.headerShort
        ]}>
          Transaction History
        </Text>
        <View style={[
          styles.loadingContainer,
          isSmallScreen && styles.loadingContainerSmall,
          isLargeScreen && styles.loadingContainerLarge,
          isShortScreen && styles.loadingContainerShort
        ]}>
          <ActivityIndicator 
            size={isSmallScreen ? "small" : isShortScreen ? "small" : "large"} 
            color="#FEB914" 
          />
          <Text style={[
            styles.loadingText,
            isSmallScreen && styles.loadingTextSmall,
            isLargeScreen && styles.loadingTextLarge,
            isShortScreen && styles.loadingTextShort
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
        { minHeight: isSmallScreen ? height * 0.2 : isShortScreen ? height * 0.18 : height * 0.25 }
      ]}>
        <Text style={[
          styles.header,
          isSmallScreen && styles.headerSmall,
          isLargeScreen && styles.headerLarge,
          isShortScreen && styles.headerShort
        ]}>
          Transaction History
        </Text>
        <View style={[
          styles.errorContainer,
          isSmallScreen && styles.errorContainerSmall,
          isLargeScreen && styles.errorContainerLarge,
          isShortScreen && styles.errorContainerShort
        ]}>
          <Ionicons 
            name="alert-circle-outline" 
            size={isSmallScreen ? 28 : isShortScreen ? 24 : 40} 
            color="#f44336" 
          />
          <Text style={[
            styles.errorText,
            isSmallScreen && styles.errorTextSmall,
            isLargeScreen && styles.errorTextLarge,
            isShortScreen && styles.errorTextShort
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
        (isSmallScreen ? height * 0.2 : isShortScreen ? height * 0.18 : height * 0.25) : undefined 
      }
    ]}>
      <View style={[
        styles.headerRow,
        isShortScreen && styles.headerRowShort
      ]}>
        <Text style={[
          styles.header,
          isSmallScreen && styles.headerSmall,
          isLargeScreen && styles.headerLarge,
          isTablet && styles.headerTablet,
          isShortScreen && styles.headerShort
        ]}>
          Transaction History
        </Text>

        {filteredTransactions.length > 10 && (
          <TouchableOpacity
            style={[
              styles.seeMoreButton,
              isSmallScreen && styles.seeMoreButtonSmall,
              isLargeScreen && styles.seeMoreButtonLarge,
              isShortScreen && styles.seeMoreButtonShort
            ]}
            onPress={() => setShowFullHistory(true)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.seeMoreText,
              isSmallScreen && styles.seeMoreTextSmall,
              isLargeScreen && styles.seeMoreTextLarge,
              isShortScreen && styles.seeMoreTextShort
            ]}>
              See More
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={isSmallScreen ? 12 : isShortScreen ? 10 : 16} 
              color="#FEB914" 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER ROW WITH SEE MORE */}
      <View style={[
        styles.filterRow,
        isSmallScreen && styles.filterRowSmall,
        isLargeScreen && styles.filterRowLarge,
        isShortScreen && styles.filterRowShort
      ]}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            isSmallScreen && styles.filterButtonSmall,
            isLargeScreen && styles.filterButtonLarge,
            isTablet && styles.filterButtonTablet,
            isShortScreen && styles.filterButtonShort
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
            isLargeScreen && styles.filterTextLarge,
            isShortScreen && styles.filterTextShort
          ]}>
            📅 {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Text>
        </TouchableOpacity>

        {filteredTransactions.length > 0 && (
          <Text style={[
            styles.countText,
            isSmallScreen && styles.countTextSmall,
            isLargeScreen && styles.countTextLarge,
            isShortScreen && styles.countTextShort
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
          isTablet && styles.emptyContainerTablet,
          isShortScreen && styles.emptyContainerShort
        ]}>
          <Ionicons 
            name="wallet-outline" 
            size={isSmallScreen ? 28 : isShortScreen ? 24 : 40} 
            color="#666" 
          />
          <Text style={[
            styles.emptyText,
            isSmallScreen && styles.emptyTextSmall,
            isLargeScreen && styles.emptyTextLarge,
            isShortScreen && styles.emptyTextShort
          ]}>
            No transactions found
          </Text>
          <Text style={[
            styles.emptySubtext,
            isSmallScreen && styles.emptySubtextSmall,
            isLargeScreen && styles.emptySubtextLarge,
            isShortScreen && styles.emptySubtextShort
          ]}>
            {filter === "all" 
              ? "Your transactions will appear here" 
              : `No transactions for "${filter}"`}
          </Text>
        </View>
      ) : (
        /* LIMITED TRANSACTIONS LIST */
        <ScrollView 
          style={[
            styles.scrollContainer,
            isShortScreen && styles.scrollContainerShort
          ]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isShortScreen && styles.scrollContentShort
          ]}
        >
          <View style={[
            styles.card,
            isSmallScreen && styles.cardSmall,
            isLargeScreen && styles.cardLarge,
            isTablet && styles.cardTablet,
            isShortScreen && styles.cardShort
          ]}>
            {Object.entries(groupedLimitedTransactions).map(([month, monthTransactions]) => (
              <View key={month}>
                <View style={[
                  styles.monthContainer,
                  isSmallScreen && styles.monthContainerSmall,
                  isLargeScreen && styles.monthContainerLarge,
                  isShortScreen && styles.monthContainerShort
                ]}>
                  <Text style={[
                    styles.monthText,
                    isSmallScreen && styles.monthTextSmall,
                    isLargeScreen && styles.monthTextLarge,
                    isShortScreen && styles.monthTextShort
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
        statusBarTranslucent={true}
      >
        <SafeAreaView style={[
          styles.modalOverlay,
          isTablet && styles.modalOverlayTablet
        ]}>
          <StatusBar 
            backgroundColor="rgba(0, 0, 0, 0.9)" 
            barStyle="light-content" 
            translucent={true}
          />
          <View style={[
            styles.modalContent,
            isSmallScreen && styles.modalContentSmall,
            isLargeScreen && styles.modalContentLarge,
            isTablet && styles.modalContentTablet,
            isShortScreen && styles.modalContentShort
          ]}>
            {/* MODAL HEADER */}
            <View style={[
              styles.modalHeader,
              isSmallScreen && styles.modalHeaderSmall,
              isLargeScreen && styles.modalHeaderLarge,
              isShortScreen && styles.modalHeaderShort
            ]}>
              <Text style={[
                styles.modalTitle,
                isSmallScreen && styles.modalTitleSmall,
                isLargeScreen && styles.modalTitleLarge,
                isShortScreen && styles.modalTitleShort
              ]}>
                Full Transaction History
              </Text>
              <TouchableOpacity 
                onPress={() => setShowFullHistory(false)}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name="close" 
                  size={isSmallScreen ? 20 : isShortScreen ? 18 : 24} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>

            {/* FILTER IN MODAL */}
            <View style={[
              styles.modalFilterRow,
              isShortScreen && styles.modalFilterRowShort
            ]}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  isSmallScreen && styles.filterButtonSmall,
                  isLargeScreen && styles.filterButtonLarge,
                  isShortScreen && styles.filterButtonShort
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
                  isLargeScreen && styles.filterTextLarge,
                  isShortScreen && styles.filterTextShort
                ]}>
                  📅 {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
              
              <Text style={[
                styles.modalCountText,
                isSmallScreen && styles.modalCountTextSmall,
                isLargeScreen && styles.modalCountTextLarge,
                isShortScreen && styles.modalCountTextShort
              ]}>
                {filteredTransactions.length} transactions
              </Text>
            </View>

            {/* FULL TRANSACTIONS LIST */}
            {filteredTransactions.length === 0 ? (
              <View style={[
                styles.modalEmptyContainer,
                isSmallScreen && styles.modalEmptyContainerSmall,
                isLargeScreen && styles.modalEmptyContainerLarge,
                isShortScreen && styles.modalEmptyContainerShort
              ]}>
                <Ionicons 
                  name="wallet-outline" 
                  size={isSmallScreen ? 32 : isShortScreen ? 28 : 48} 
                  color="#666" 
                />
                <Text style={[
                  styles.modalEmptyText,
                  isSmallScreen && styles.modalEmptyTextSmall,
                  isLargeScreen && styles.modalEmptyTextLarge,
                  isShortScreen && styles.modalEmptyTextShort
                ]}>
                  No transactions found
                </Text>
                <Text style={[
                  styles.modalEmptySubtext,
                  isSmallScreen && styles.modalEmptySubtextSmall,
                  isLargeScreen && styles.modalEmptySubtextLarge,
                  isShortScreen && styles.modalEmptySubtextShort
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
                      isLargeScreen && styles.monthContainerLarge,
                      isShortScreen && styles.monthContainerShort
                    ]}>
                      <Text style={[
                        styles.monthText,
                        isSmallScreen && styles.monthTextSmall,
                        isLargeScreen && styles.monthTextLarge,
                        isShortScreen && styles.monthTextShort
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
                  isLargeScreen && styles.modalListContentLarge,
                  isShortScreen && styles.modalListContentShort
                ]}
                showsVerticalScrollIndicator={true}
                initialNumToRender={isShortScreen ? 5 : 8}
                maxToRenderPerBatch={isShortScreen ? 5 : 10}
                windowSize={isShortScreen ? 5 : 10}
                removeClippedSubviews={true}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginTop: Math.min(height * 0.02, 16),
    width: '100%',
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.min(width * 0.05, 20),
    marginBottom: Math.min(height * 0.008, 6),
  },
  headerRowShort: {
    marginBottom: Math.min(height * 0.005, 4),
  },
  header: {
    color: "#fff",
    fontSize: Math.min(width * 0.045, 18),
    fontWeight: "bold",
  },
  headerSmall: {
    fontSize: Math.min(width * 0.042, 16),
  },
  headerLarge: {
    fontSize: Math.min(width * 0.048, 20),
  },
  headerTablet: {
    fontSize: Math.min(width * 0.05, 22),
  },
  headerShort: {
    fontSize: Math.min(width * 0.04, 15),
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 185, 20, 0.1)',
    paddingHorizontal: Math.min(width * 0.03, 12),
    paddingVertical: Math.min(height * 0.006, 5),
    borderRadius: Math.min(width * 0.03, 15),
    borderWidth: 1,
    borderColor: '#FEB914',
  },
  seeMoreButtonSmall: {
    paddingHorizontal: Math.min(width * 0.025, 10),
    paddingVertical: Math.min(height * 0.005, 4),
    borderRadius: Math.min(width * 0.025, 12),
  },
  seeMoreButtonLarge: {
    paddingHorizontal: Math.min(width * 0.035, 14),
    paddingVertical: Math.min(height * 0.007, 6),
    borderRadius: Math.min(width * 0.035, 18),
  },
  seeMoreButtonShort: {
    paddingHorizontal: Math.min(width * 0.02, 8),
    paddingVertical: Math.min(height * 0.004, 3),
    borderRadius: Math.min(width * 0.02, 10),
  },
  seeMoreText: {
    color: "#FEB914",
    fontSize: Math.min(width * 0.034, 14),
    fontWeight: "600",
    marginRight: Math.min(width * 0.01, 4),
  },
  seeMoreTextSmall: {
    fontSize: Math.min(width * 0.032, 12),
  },
  seeMoreTextLarge: {
    fontSize: Math.min(width * 0.036, 16),
  },
  seeMoreTextShort: {
    fontSize: Math.min(width * 0.03, 11),
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.min(width * 0.05, 20),
    marginBottom: Math.min(height * 0.015, 12),
  },
  filterRowSmall: {
    paddingHorizontal: Math.min(width * 0.04, 16),
    marginBottom: Math.min(height * 0.012, 10),
  },
  filterRowLarge: {
    paddingHorizontal: Math.min(width * 0.06, 24),
    marginBottom: Math.min(height * 0.018, 14),
  },
  filterRowShort: {
    paddingHorizontal: Math.min(width * 0.04, 16),
    marginBottom: Math.min(height * 0.008, 6),
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: Math.min(width * 0.03, 12),
    paddingVertical: Math.min(height * 0.008, 6),
    borderRadius: Math.min(width * 0.04, 20),
    borderWidth: 1,
    borderColor: "#FEB914",
    minHeight: Math.min(height * 0.04, 32),
  },
  filterButtonSmall: {
    paddingHorizontal: Math.min(width * 0.025, 10),
    paddingVertical: Math.min(height * 0.006, 5),
    minHeight: Math.min(height * 0.035, 28),
  },
  filterButtonLarge: {
    paddingHorizontal: Math.min(width * 0.035, 14),
    paddingVertical: Math.min(height * 0.01, 8),
    minHeight: Math.min(height * 0.045, 36),
  },
  filterButtonTablet: {
    paddingHorizontal: Math.min(width * 0.04, 16),
    paddingVertical: Math.min(height * 0.012, 10),
    minHeight: Math.min(height * 0.05, 40),
  },
  filterButtonShort: {
    paddingHorizontal: Math.min(width * 0.02, 8),
    paddingVertical: Math.min(height * 0.005, 4),
    minHeight: Math.min(height * 0.03, 24),
  },
  filterText: {
    color: "#FEB914",
    fontSize: Math.min(width * 0.036, 15),
    fontWeight: "600",
  },
  filterTextSmall: {
    fontSize: Math.min(width * 0.034, 14),
  },
  filterTextLarge: {
    fontSize: Math.min(width * 0.038, 16),
  },
  filterTextShort: {
    fontSize: Math.min(width * 0.032, 13),
  },
  countText: {
    color: "#aaa",
    fontSize: Math.min(width * 0.034, 14),
    fontWeight: "500",
  },
  countTextSmall: {
    fontSize: Math.min(width * 0.032, 12),
  },
  countTextLarge: {
    fontSize: Math.min(width * 0.036, 16),
  },
  countTextShort: {
    fontSize: Math.min(width * 0.03, 11),
  },
  // ScrollView styles
  scrollContainer: {
    width: '100%',
    maxHeight: Math.min(height * 0.5, 300),
  },
  scrollContainerShort: {
    maxHeight: Math.min(height * 0.45, 250),
  },
  scrollContent: {
    paddingBottom: Math.min(height * 0.02, 16),
  },
  scrollContentShort: {
    paddingBottom: Math.min(height * 0.015, 12),
  },
  // Card styles
  card: {
    backgroundColor: "#111",
    marginHorizontal: Math.min(width * 0.05, 20),
    borderRadius: Math.min(width * 0.03, 12),
    padding: Math.min(width * 0.04, 16),
    borderWidth: 1,
    borderColor: "#FEB914",
    width: width * 0.9,
    maxWidth: 500,
    alignSelf: 'center',
  },
  cardSmall: {
    marginHorizontal: Math.min(width * 0.04, 16),
    borderRadius: Math.min(width * 0.025, 10),
    padding: Math.min(width * 0.035, 14),
  },
  cardLarge: {
    marginHorizontal: Math.min(width * 0.06, 24),
    borderRadius: Math.min(width * 0.035, 14),
    padding: Math.min(width * 0.045, 18),
  },
  cardTablet: {
    maxWidth: 500,
    alignSelf: 'center',
  },
  cardShort: {
    marginHorizontal: Math.min(width * 0.04, 16),
    borderRadius: Math.min(width * 0.02, 8),
    padding: Math.min(width * 0.03, 12),
  },
  // Loading styles
  loadingContainer: {
    backgroundColor: "#111",
    marginHorizontal: Math.min(width * 0.05, 20),
    borderRadius: Math.min(width * 0.03, 12),
    padding: Math.min(height * 0.05, 30),
    borderWidth: 1,
    borderColor: "#FEB914",
    alignItems: "center",
    justifyContent: "center",
    minHeight: Math.min(height * 0.15, 120),
    width: width * 0.9,
    maxWidth: 500,
    alignSelf: 'center',
  },
  loadingContainerSmall: {
    marginHorizontal: Math.min(width * 0.04, 16),
    borderRadius: Math.min(width * 0.025, 10),
    padding: Math.min(height * 0.04, 24),
    minHeight: Math.min(height * 0.12, 100),
  },
  loadingContainerLarge: {
    marginHorizontal: Math.min(width * 0.06, 24),
    borderRadius: Math.min(width * 0.035, 14),
    padding: Math.min(height * 0.06, 36),
    minHeight: Math.min(height * 0.18, 140),
  },
  loadingContainerShort: {
    marginHorizontal: Math.min(width * 0.04, 16),
    borderRadius: Math.min(width * 0.02, 8),
    padding: Math.min(height * 0.03, 20),
    minHeight: Math.min(height * 0.1, 80),
  },
  loadingText: {
    color: "#aaa",
    marginTop: Math.min(height * 0.01, 8),
    fontSize: Math.min(width * 0.036, 15),
    textAlign: 'center',
  },
  loadingTextSmall: {
    fontSize: Math.min(width * 0.034, 14),
    marginTop: Math.min(height * 0.008, 6),
  },
  loadingTextLarge: {
    fontSize: Math.min(width * 0.038, 16),
    marginTop: Math.min(height * 0.012, 10),
  },
  loadingTextShort: {
    fontSize: Math.min(width * 0.032, 13),
    marginTop: Math.min(height * 0.006, 4),
  },
  // Error styles
  errorContainer: {
    backgroundColor: "#111",
    marginHorizontal: Math.min(width * 0.05, 20),
    borderRadius: Math.min(width * 0.03, 12),
    padding: Math.min(height * 0.05, 30),
    borderWidth: 1,
    borderColor: "#f44336",
    alignItems: "center",
    justifyContent: "center",
    minHeight: Math.min(height * 0.15, 120),
    width: width * 0.9,
    maxWidth: 500,
    alignSelf: 'center',
  },
  errorContainerSmall: {
    marginHorizontal: Math.min(width * 0.04, 16),
    borderRadius: Math.min(width * 0.025, 10),
    padding: Math.min(height * 0.04, 24),
    minHeight: Math.min(height * 0.12, 100),
  },
  errorContainerLarge: {
    marginHorizontal: Math.min(width * 0.06, 24),
    borderRadius: Math.min(width * 0.035, 14),
    padding: Math.min(height * 0.06, 36),
    minHeight: Math.min(height * 0.18, 140),
  },
  errorContainerShort: {
    marginHorizontal: Math.min(width * 0.04, 16),
    borderRadius: Math.min(width * 0.02, 8),
    padding: Math.min(height * 0.03, 20),
    minHeight: Math.min(height * 0.1, 80),
  },
  errorText: {
    color: "#f44336",
    marginTop: Math.min(height * 0.01, 8),
    fontSize: Math.min(width * 0.036, 15),
    fontWeight: "600",
    textAlign: 'center',
  },
  errorTextSmall: {
    fontSize: Math.min(width * 0.034, 14),
    marginTop: Math.min(height * 0.008, 6),
  },
  errorTextLarge: {
    fontSize: Math.min(width * 0.038, 16),
    marginTop: Math.min(height * 0.012, 10),
  },
  errorTextShort: {
    fontSize: Math.min(width * 0.032, 13),
    marginTop: Math.min(height * 0.006, 4),
  },
  // Empty state styles
  emptyContainer: {
    backgroundColor: "#111",
    marginHorizontal: Math.min(width * 0.05, 20),
    borderRadius: Math.min(width * 0.03, 12),
    padding: Math.min(height * 0.05, 30),
    borderWidth: 1,
    borderColor: "#FEB914",
    alignItems: "center",
    justifyContent: "center",
    minHeight: Math.min(height * 0.15, 120),
    width: width * 0.9,
    maxWidth: 500,
    alignSelf: 'center',
  },
  emptyContainerSmall: {
    marginHorizontal: Math.min(width * 0.04, 16),
    borderRadius: Math.min(width * 0.025, 10),
    padding: Math.min(height * 0.04, 24),
    minHeight: Math.min(height * 0.12, 100),
  },
  emptyContainerLarge: {
    marginHorizontal: Math.min(width * 0.06, 24),
    borderRadius: Math.min(width * 0.035, 14),
    padding: Math.min(height * 0.06, 36),
    minHeight: Math.min(height * 0.18, 140),
  },
  emptyContainerTablet: {
    maxWidth: 500,
  },
  emptyContainerShort: {
    marginHorizontal: Math.min(width * 0.04, 16),
    borderRadius: Math.min(width * 0.02, 8),
    padding: Math.min(height * 0.03, 20),
    minHeight: Math.min(height * 0.1, 80),
  },
  emptyText: {
    color: "#aaa",
    marginTop: Math.min(height * 0.01, 8),
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: "600",
    textAlign: 'center',
  },
  emptyTextSmall: {
    fontSize: Math.min(width * 0.038, 14),
    marginTop: Math.min(height * 0.008, 6),
  },
  emptyTextLarge: {
    fontSize: Math.min(width * 0.042, 18),
    marginTop: Math.min(height * 0.012, 10),
  },
  emptyTextShort: {
    fontSize: Math.min(width * 0.036, 13),
    marginTop: Math.min(height * 0.006, 4),
  },
  emptySubtext: {
    color: "#666",
    marginTop: Math.min(height * 0.005, 4),
    fontSize: Math.min(width * 0.035, 14),
    textAlign: 'center',
  },
  emptySubtextSmall: {
    fontSize: Math.min(width * 0.033, 12),
  },
  emptySubtextLarge: {
    fontSize: Math.min(width * 0.037, 16),
  },
  emptySubtextShort: {
    fontSize: Math.min(width * 0.031, 11),
  },
  // Transaction item styles
  monthContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#000",
    paddingHorizontal: Math.min(width * 0.025, 10),
    paddingVertical: Math.min(height * 0.005, 4),
    borderRadius: 8,
    marginBottom: Math.min(height * 0.01, 8),
  },
  monthContainerSmall: {
    paddingHorizontal: Math.min(width * 0.02, 8),
    paddingVertical: Math.min(height * 0.004, 3),
    marginBottom: Math.min(height * 0.008, 6),
  },
  monthContainerLarge: {
    paddingHorizontal: Math.min(width * 0.03, 12),
    paddingVertical: Math.min(height * 0.006, 5),
    marginBottom: Math.min(height * 0.012, 10),
  },
  monthContainerShort: {
    paddingHorizontal: Math.min(width * 0.018, 6),
    paddingVertical: Math.min(height * 0.003, 2),
    marginBottom: Math.min(height * 0.006, 4),
  },
  monthText: {
    color: "#FEB914",
    fontWeight: "600",
    fontSize: Math.min(width * 0.032, 13),
  },
  monthTextSmall: {
    fontSize: Math.min(width * 0.03, 12),
  },
  monthTextLarge: {
    fontSize: Math.min(width * 0.034, 14),
  },
  monthTextShort: {
    fontSize: Math.min(width * 0.028, 11),
  },
  transactionItem: {
    paddingVertical: Math.min(height * 0.014, 12),
    position: "relative",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: Math.min(height * 0.05, 40),
  },
  transactionItemSmall: {
    paddingVertical: Math.min(height * 0.012, 10),
    minHeight: Math.min(height * 0.045, 36),
  },
  transactionItemLarge: {
    paddingVertical: Math.min(height * 0.016, 14),
    minHeight: Math.min(height * 0.055, 44),
  },
  transactionItemShort: {
    paddingVertical: Math.min(height * 0.01, 8),
    minHeight: Math.min(height * 0.04, 32),
  },
  transactionContent: {
    flex: 1,
    marginRight: Math.min(width * 0.02, 8),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: Math.min(height * 0.005, 4),
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#FEB91433",
  },
  title: {
    color: "#fff",
    fontSize: Math.min(width * 0.038, 15),
    fontWeight: "500",
    flexShrink: 1,
    marginRight: Math.min(width * 0.02, 8),
  },
  titleSmall: {
    fontSize: Math.min(width * 0.036, 14),
  },
  titleLarge: {
    fontSize: Math.min(width * 0.04, 16),
  },
  titleShort: {
    fontSize: Math.min(width * 0.034, 13),
  },
  statusContainer: {
    marginTop: 0,
  },
  statusContainerSmall: {
    marginTop: -2,
  },
  statusContainerShort: {
    marginTop: -1,
  },
  statusBadge: {
    fontSize: Math.min(width * 0.03, 12),
    fontWeight: "600",
    paddingHorizontal: Math.min(width * 0.02, 8),
    paddingVertical: Math.min(height * 0.003, 2),
    borderRadius: 4,
  },
  statusBadgeSmall: {
    fontSize: Math.min(width * 0.028, 11),
    paddingHorizontal: Math.min(width * 0.018, 6),
  },
  statusBadgeLarge: {
    fontSize: Math.min(width * 0.032, 13),
    paddingHorizontal: Math.min(width * 0.022, 9),
  },
  statusBadgeShort: {
    fontSize: Math.min(width * 0.026, 10),
    paddingHorizontal: Math.min(width * 0.015, 5),
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
    marginTop: Math.min(height * 0.002, 2),
  },
  dateContainerSmall: {
    marginTop: 0,
  },
  dateContainerShort: {
    marginTop: -1,
  },
  dateText: {
    color: "#aaa",
    marginLeft: Math.min(width * 0.015, 6),
    fontSize: Math.min(width * 0.034, 13),
  },
  dateTextSmall: {
    fontSize: Math.min(width * 0.032, 12),
    marginLeft: Math.min(width * 0.01, 4),
  },
  dateTextLarge: {
    fontSize: Math.min(width * 0.036, 14),
  },
  dateTextShort: {
    fontSize: Math.min(width * 0.03, 11),
    marginLeft: Math.min(width * 0.008, 3),
  },
  amount: {
    fontSize: Math.min(width * 0.038, 15),
    fontWeight: "bold",
    textAlign: "right",
    flexShrink: 0,
  },
  amountSmall: {
    fontSize: Math.min(width * 0.036, 14),
  },
  amountLarge: {
    fontSize: Math.min(width * 0.04, 16),
  },
  amountShort: {
    fontSize: Math.min(width * 0.034, 13),
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  modalOverlayTablet: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#000",
    borderTopLeftRadius: Math.min(width * 0.06, 25),
    borderTopRightRadius: Math.min(width * 0.06, 25),
    height: "85%",
    padding: Math.min(width * 0.05, 20),
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  modalContentSmall: {
    borderTopLeftRadius: Math.min(width * 0.05, 20),
    borderTopRightRadius: Math.min(width * 0.05, 20),
    height: "90%",
    padding: Math.min(width * 0.04, 16),
  },
  modalContentLarge: {
    borderTopLeftRadius: Math.min(width * 0.07, 30),
    borderTopRightRadius: Math.min(width * 0.07, 30),
    height: "80%",
    padding: Math.min(width * 0.06, 24),
  },
  modalContentTablet: {
    width: "90%",
    maxWidth: 600,
    height: "85%",
    borderRadius: Math.min(width * 0.06, 25),
    marginTop: 0,
  },
  modalContentShort: {
    borderTopLeftRadius: Math.min(width * 0.04, 18),
    borderTopRightRadius: Math.min(width * 0.04, 18),
    height: "92%",
    padding: Math.min(width * 0.035, 14),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Math.min(height * 0.02, 16),
  },
  modalHeaderSmall: {
    marginBottom: Math.min(height * 0.015, 12),
  },
  modalHeaderLarge: {
    marginBottom: Math.min(height * 0.025, 20),
  },
  modalHeaderShort: {
    marginBottom: Math.min(height * 0.012, 10),
  },
  modalTitle: {
    color: "#fff",
    fontSize: Math.min(width * 0.05, 20),
    fontWeight: "bold",
  },
  modalTitleSmall: {
    fontSize: Math.min(width * 0.045, 18),
  },
  modalTitleLarge: {
    fontSize: Math.min(width * 0.055, 22),
  },
  modalTitleShort: {
    fontSize: Math.min(width * 0.042, 16),
  },
  closeButton: {
    padding: 5,
  },
  modalFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Math.min(height * 0.02, 16),
    backgroundColor: "#111",
    padding: Math.min(width * 0.03, 12),
    borderRadius: Math.min(width * 0.02, 8),
    borderWidth: 1,
    borderColor: "#FEB914",
  },
  modalFilterRowShort: {
    marginBottom: Math.min(height * 0.015, 12),
    padding: Math.min(width * 0.025, 10),
  },
  modalCountText: {
    color: "#FEB914",
    fontSize: Math.min(width * 0.036, 15),
    fontWeight: "600",
  },
  modalCountTextSmall: {
    fontSize: Math.min(width * 0.034, 14),
  },
  modalCountTextLarge: {
    fontSize: Math.min(width * 0.038, 16),
  },
  modalCountTextShort: {
    fontSize: Math.min(width * 0.032, 13),
  },
  modalEmptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Math.min(height * 0.05, 30),
  },
  modalEmptyContainerSmall: {
    padding: Math.min(height * 0.04, 24),
  },
  modalEmptyContainerLarge: {
    padding: Math.min(height * 0.06, 36),
  },
  modalEmptyContainerShort: {
    padding: Math.min(height * 0.03, 20),
  },
  modalEmptyText: {
    color: "#aaa",
    marginTop: Math.min(height * 0.015, 12),
    fontSize: Math.min(width * 0.045, 18),
    fontWeight: "600",
    textAlign: 'center',
  },
  modalEmptyTextSmall: {
    fontSize: Math.min(width * 0.042, 16),
    marginTop: Math.min(height * 0.012, 10),
  },
  modalEmptyTextLarge: {
    fontSize: Math.min(width * 0.048, 20),
    marginTop: Math.min(height * 0.018, 14),
  },
  modalEmptyTextShort: {
    fontSize: Math.min(width * 0.038, 14),
    marginTop: Math.min(height * 0.01, 8),
  },
  modalEmptySubtext: {
    color: "#666",
    marginTop: Math.min(height * 0.008, 6),
    fontSize: Math.min(width * 0.038, 15),
    textAlign: 'center',
  },
  modalEmptySubtextSmall: {
    fontSize: Math.min(width * 0.036, 14),
  },
  modalEmptySubtextLarge: {
    fontSize: Math.min(width * 0.04, 16),
  },
  modalEmptySubtextShort: {
    fontSize: Math.min(width * 0.034, 13),
  },
  modalMonthSection: {
    marginBottom: Math.min(height * 0.02, 16),
  },
  modalListContent: {
    paddingBottom: Math.min(height * 0.05, 40),
  },
  modalListContentSmall: {
    paddingBottom: Math.min(height * 0.04, 32),
  },
  modalListContentLarge: {
    paddingBottom: Math.min(height * 0.06, 48),
  },
  modalListContentShort: {
    paddingBottom: Math.min(height * 0.03, 24),
  },
});

