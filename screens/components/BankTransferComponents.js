import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TextInput,
  ScrollView,
  FlatList
} from 'react-native';
import { FontAwesome, Entypo, MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function BankTransferComponents() {
  const navigation = useNavigation();
  
  // State for active payment method
  const [activePayment, setActivePayment] = useState({
    type: 'Bank Transfer',
    accountNumber: '9016039577',
    bankName: 'Opay',
    accountName: 'Alabi Ibrahim Umer'
  });

  // State for modals
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  // State for edit form
  const [editForm, setEditForm] = useState({
    accountNumber: '',
    bankName: '',
    accountName: '',
    selectedBank: null
  });

  // State for payment methods selection
  const [selectedMethods, setSelectedMethods] = useState({
    mastercard: true,
    visa: false,
    crypto: false
  });

  // Nigerian banks data
  const banks = [
    { id: '1', name: 'Access Bank', code: '044' },
    { id: '2', name: 'First Bank', code: '011' },
    { id: '3', name: 'Guaranty Trust Bank', code: '058' },
    { id: '4', name: 'Zenith Bank', code: '057' },
    { id: '5', name: 'United Bank for Africa', code: '033' },
    { id: '6', name: 'Ecobank Nigeria', code: '050' },
    { id: '7', name: 'Fidelity Bank', code: '070' },
    { id: '8', name: 'Stanbic IBTC Bank', code: '039' },
    { id: '9', name: 'Sterling Bank', code: '232' },
    { id: '10', name: 'Union Bank', code: '032' },
    { id: '11', name: 'Opay', code: '099' },
    { id: '12', name: 'Palmpay', code: '100' },
  ];

  const goBack = () => {
    navigation.goBack();
  };

  // Open edit modal
  const handleEditPress = () => {
    setEditForm({
      accountNumber: activePayment.accountNumber,
      bankName: activePayment.bankName,
      accountName: activePayment.accountName,
      selectedBank: { name: activePayment.bankName, code: '099' }
    });
    setEditModalVisible(true);
  };

  // Select bank from dropdown
  const handleBankSelect = (bank) => {
    setEditForm(prev => ({
      ...prev,
      bankName: bank.name,
      selectedBank: bank
    }));
    setShowBankDropdown(false);
  };

  // Save edited details
  const handleSaveEdit = () => {
    if (editForm.accountNumber && editForm.bankName && editForm.accountName) {
      setActivePayment({
        ...activePayment,
        accountNumber: editForm.accountNumber,
        bankName: editForm.bankName,
        accountName: editForm.accountName
      });
      setEditModalVisible(false);
    }
  };

  // Toggle payment method selection
  const togglePaymentMethod = (method) => {
    setSelectedMethods(prev => ({
      ...prev,
      [method]: !prev[method]
    }));
  };

  // Validate account number (10 digits for Nigerian banks)
  const isAccountNumberValid = editForm.accountNumber.length === 10;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Setting up Bank transfer for riders</Text>

      {/* Active Section */}
      <Text style={styles.activeText}>Active</Text>
      <View style={styles.activeCard}>
        <View style={styles.activeLeft}>
          <FontAwesome name="bank" size={30} color="#FFC107" />
          <View>
            <Text style={styles.activeTitle}>{activePayment.type}</Text>
            <Text style={styles.activeSub}>{activePayment.accountNumber}</Text>
            <Text style={styles.activeSub}>{activePayment.bankName}</Text>
            <Text style={styles.activeSub}>{activePayment.accountName}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleEditPress}>
          <Feather name="edit-3" size={18} color="white" />
        </TouchableOpacity>
      </View>

      {/* Divider button */}
      <TouchableOpacity style={styles.otherMethodsButton}>
        <Text style={styles.otherMethodsText}>Other payment methods include</Text>
      </TouchableOpacity>

      {/* Payment Methods */}
      <View style={styles.methodsCard}>
        {/* Mastercard */}
        <TouchableOpacity 
          style={styles.methodRow}
          onPress={() => togglePaymentMethod('mastercard')}
        >
          <Text style={styles.methodText}>Mastercard ****2132</Text>
          <MaterialIcons 
            name={selectedMethods.mastercard ? "check-box" : "check-box-outline-blank"} 
            size={22} 
            color="#FFC107" 
          />
        </TouchableOpacity>
        <View style={styles.divider} />

        {/* Visa */}
        <TouchableOpacity 
          style={styles.methodRow}
          onPress={() => togglePaymentMethod('visa')}
        >
          <Text style={styles.methodText}>Visa ****2132</Text>
          <MaterialIcons 
            name={selectedMethods.visa ? "check-box" : "check-box-outline-blank"} 
            size={22} 
            color="#FFC107" 
          />
        </TouchableOpacity>
        <View style={styles.divider} />

        {/* Crypto */}
        <TouchableOpacity 
          style={styles.methodRow}
          onPress={() => togglePaymentMethod('crypto')}
        >
          <Text style={styles.methodText}>Add with Crypto</Text>
          <MaterialIcons 
            name={selectedMethods.crypto ? "check-box" : "check-box-outline-blank"} 
            size={22} 
            color="#FFC107" 
          />
        </TouchableOpacity>
      </View>

      {/* Edit Bank Details Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Bank Details</Text>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#FFC107" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              
              {/* Account Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.accountName}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, accountName: text }))}
                  placeholder="Enter account holder name"
                  placeholderTextColor="#888"
                  selectionColor="#FFC107"
                  autoCapitalize="words"
                />
              </View>

              {/* Account Number Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    editForm.accountNumber && !isAccountNumberValid && styles.inputError
                  ]}
                  value={editForm.accountNumber}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, accountNumber: text.replace(/[^0-9]/g, '') }))}
                  placeholder="Enter 10-digit account number"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  maxLength={10}
                  selectionColor="#FFC107"
                />
                {editForm.accountNumber && !isAccountNumberValid && (
                  <Text style={styles.errorText}>Account number must be 10 digits</Text>
                )}
              </View>

              {/* Bank Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Select Bank</Text>
                <TouchableOpacity 
                  style={styles.bankSelector}
                  onPress={() => setShowBankDropdown(true)}
                >
                  <Text style={editForm.bankName ? styles.bankSelectedText : styles.bankPlaceholderText}>
                    {editForm.bankName || 'Choose your bank'}
                  </Text>
                  <Entypo 
                    name={showBankDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#FFC107" 
                  />
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[
                    styles.saveButton,
                    (!editForm.accountNumber || !editForm.bankName || !editForm.accountName || !isAccountNumberValid) && styles.saveButtonDisabled
                  ]}
                  onPress={handleSaveEdit}
                  disabled={!editForm.accountNumber || !editForm.bankName || !editForm.accountName || !isAccountNumberValid}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bank Selection Modal - SEPARATE MODAL */}
      <Modal
        visible={showBankDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBankDropdown(false)}
      >
        <View style={styles.bankModalOverlay}>
          <View style={styles.bankModalContent}>
            <View style={styles.bankModalHeader}>
              <Text style={styles.bankModalTitle}>Select Bank</Text>
              <TouchableOpacity 
                onPress={() => setShowBankDropdown(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#FFC107" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={banks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bankItem}
                  onPress={() => handleBankSelect(item)}
                >
                  <Text style={styles.bankName}>{item.name}</Text>
                  <Text style={styles.bankCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingTop: 40,
    gap: 20,
  },
  header: {
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  activeText: {
    color: '#FFC107',
    fontWeight: '700',
    marginBottom: 10,
    fontSize: 16,
  },
  activeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  activeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  activeTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  activeSub: {
    color: '#aaa',
    fontSize: 13,
  },
  otherMethodsButton: {
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  otherMethodsText: {
    color: 'white',
    fontSize: 13,
  },
  methodsCard: {
    backgroundColor: '#04223A',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  methodText: {
    color: 'white',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#FFC107',
    opacity: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFC107',
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: 'white',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF3D3D',
  },
  errorText: {
    color: '#FF3D3D',
    fontSize: 12,
    marginTop: 5,
  },
  bankSelector: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankSelectedText: {
    color: 'white',
    fontSize: 16,
  },
  bankPlaceholderText: {
    color: '#888',
    fontSize: 16,
  },
  modalActions: {
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#04223A',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  cancelButtonText: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: '600',
  },
  // Bank Modal Styles
  bankModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  bankModalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  bankModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  bankModalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  bankName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  bankCode: {
    color: '#FFC107',
    fontSize: 14,
  },
});