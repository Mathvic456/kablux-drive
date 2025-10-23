import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TransactionHistory() {
  const transactions = [
    { 
      id: 1, 
      title: "Ride to Airport", 
      date: "Oct 5, 2023", 
      amount: "-$25.00" 
    },
    { 
      id: 2, 
      title: "Ride from Mall", 
      date: "Oct 12, 2023", 
      amount: "-$15.00" 
    },
    { 
      id: 3, 
      title: "Ride to Downtown", 
      date: "Oct 20, 2023", 
      amount: "-$30.00" 
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>
        Transaction History
      </Text>

      {/* Transactions Card */}
      <View style={styles.card}>
        {/* Month Label */}
        <View style={styles.monthContainer}>
          <Text style={styles.monthText}>October</Text>
        </View>

        {/* Transactions List */}
        {transactions.map((transaction, index) => (
          <View
            key={transaction.id}
            style={[
              styles.transactionItem,
              index !== transactions.length - 1 && styles.borderBottom
            ]}
          >
            {/* Transaction Title */}
            <Text style={styles.title}>
              {transaction.title}
            </Text>

            {/* Date */}
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color="#FEB914" />
              <Text style={styles.dateText}>{transaction.date}</Text>
            </View>

            {/* Amount */}
            <Text style={styles.amount}>
              {transaction.amount}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    // marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#FEB914",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
    textAlign: "right",
    position: "absolute",
    right: 0,
    top: 12,
  },
});