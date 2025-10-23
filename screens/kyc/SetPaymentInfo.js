import { FontAwesome, MaterialIcons, Feather, FontAwesome5, SimpleLineIcons } from "@expo/vector-icons";
import Octicons from '@expo/vector-icons/Octicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useRef, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import Logo from "../../assets/Logo.png";
import { useNavigation } from '@react-navigation/native';
import Entypo from '@expo/vector-icons/Entypo';

const SetPaymentInfo = ({ navigation }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });
  
  const [errors, setErrors] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });
  
  const [touched, setTouched] = useState({
    cardNumber: false,
    expiryDate: false,
    cvv: false,
    cardName: false
  });

  // Calculate progress based on filled fields
  const calculateProgress = () => {
    const totalFields = Object.keys(formData).length;
    const filledFields = Object.values(formData).filter(value => value.trim() !== '').length;
    return (filledFields / totalFields) * 100;
  };

  const progress = calculateProgress();

  // Validation rules
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'cardNumber':
        if (!value.trim()) {
          error = 'Card number is required';
        } else if (!/^\d{16}$/.test(value.replace(/\s/g, ''))) {
          error = 'Card number must be 16 digits';
        } else if (!luhnCheck(value.replace(/\s/g, ''))) {
          error = 'Invalid card number';
        }
        break;
        
      case 'expiryDate':
        if (!value.trim()) {
          error = 'Expiry date is required';
        } else if (!/^\d{2}\/\d{2}$/.test(value)) {
          error = 'Format must be MM/YY';
        } else {
          const [month, year] = value.split('/');
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear() % 100;
          const currentMonth = currentDate.getMonth() + 1;
          
          if (parseInt(month) < 1 || parseInt(month) > 12) {
            error = 'Invalid month';
          } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
            error = 'Card has expired';
          }
        }
        break;
        
      case 'cvv':
        if (!value.trim()) {
          error = 'CVV is required';
        } else if (!/^\d{3,4}$/.test(value)) {
          error = 'CVV must be 3 or 4 digits';
        }
        break;
        
      case 'cardName':
        if (!value.trim()) {
          error = 'Cardholder name is required';
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = 'Name can only contain letters and spaces';
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };

  // Luhn algorithm for card validation
  const luhnCheck = (cardNumber) => {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
    return formatted.substring(0, 19); // 16 digits + 3 spaces
  };

  // Format expiry date
  const formatExpiryDate = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleChange = (name, value) => {
    let formattedValue = value;
    
    // Apply formatting
    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (name === 'cardName') {
      formattedValue = value;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Validate field if it's been touched
    if (touched[name]) {
      const error = validateField(name, formattedValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    const error = validateField(name, formData[name]);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const newTouched = {};
    
    Object.keys(formData).forEach(key => {
      newErrors[key] = validateField(key, formData[key]);
      newTouched[key] = true;
    });
    
    setErrors(newErrors);
    setTouched(newTouched);
    
    return !Object.values(newErrors).some(error => error !== '');
  };

  const nextScreen = () => {
    if (validateForm()) {
      // Form is valid, proceed to next screen
      navigation.navigate('PasskeySetup');
    } else {
      Alert.alert('Validation Error', 'Please fix all errors before proceeding.');
    }
  };

  const isFormValid = () => {
    return Object.values(formData).every(value => value.trim() !== '') && 
           !Object.values(errors).some(error => error !== '');
  };

  // Get filled fields count for progress text
  const getFilledFieldsCount = () => {
    return Object.values(formData).filter(value => value.trim() !== '').length;
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.banner} />

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.LogoContainer}>
          <Image source={Logo} style={styles.Logoicon} />
        </View>

        {/* Dynamic Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {getFilledFieldsCount()} of {Object.keys(formData).length} fields completed
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressLabel}>
            {progress === 100 ? 'All fields completed!' : 'Fill all fields to continue'}
          </Text>
        </View>

        <Text style={styles.title}>Payment Information</Text>
        <Text style={styles.subtitle}>
          Add your bank info and payment pin
        </Text>

        {/* Card Number */}
        <View style={[
          styles.InputContainer,
          errors.cardNumber && styles.inputError,
          formData.cardNumber && styles.inputFilled
        ]}>
          <Entypo name="credit-card" size={24} color={formData.cardNumber ? "#4CAF50" : "#fcbf24"} />
          <TextInput
            style={styles.input}
            placeholder="Card Number"
            placeholderTextColor={'#999'}
            keyboardType="number-pad"
            value={formData.cardNumber}
            onChangeText={(value) => handleChange('cardNumber', value)}
            onBlur={() => handleBlur('cardNumber')}
            maxLength={19}
            cursorColor={'#fcbf24'}
          />
          {formData.cardNumber && (
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
          )}
        </View>
        {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}

        {/* Expiry and CVV */}
        <View style={styles.ExpiryContainer}>
          <View style={[
            styles.expiryInputContainer,
            errors.expiryDate && styles.inputError,
            formData.expiryDate && styles.inputFilled
          ]}>
            <TextInput
              style={styles.monthanddate}
              placeholderTextColor={"#999"}
              cursorColor={"#fcbf24"}
              placeholder="MM/YY"
              value={formData.expiryDate}
              onChangeText={(value) => handleChange('expiryDate', value)}
              onBlur={() => handleBlur('expiryDate')}
              maxLength={5}
              keyboardType="number-pad"
            />
            {formData.expiryDate && (
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" style={styles.fieldCheckIcon} />
            )}
            {errors.expiryDate && <Text style={styles.smallErrorText}>{errors.expiryDate}</Text>}
          </View>
          
          <View style={[
            styles.expiryInputContainer,
            errors.cvv && styles.inputError,
            formData.cvv && styles.inputFilled
          ]}>
            <TextInput
              style={styles.cvv}
              placeholderTextColor={"#999"}
              cursorColor={"#fcbf24"}
              placeholder="CVV"
              value={formData.cvv}
              onChangeText={(value) => handleChange('cvv', value)}
              onBlur={() => handleBlur('cvv')}
              maxLength={4}
              keyboardType="number-pad"
              secureTextEntry
            />
            {formData.cvv && (
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" style={styles.fieldCheckIcon} />
            )}
            {errors.cvv && <Text style={styles.smallErrorText}>{errors.cvv}</Text>}
          </View>
        </View>

        {/* Card Name */}
        <View style={[
          styles.NameContainer,
          errors.cardName && styles.inputError,
          formData.cardName && styles.inputFilled
        ]}>
          <Feather name="user" size={24} color={formData.cardName ? "#4CAF50" : "#fcbf24"} />
          <TextInput
            style={styles.input}
            placeholder="Name on card"
            placeholderTextColor={'#999'}
            value={formData.cardName}
            onChangeText={(value) => handleChange('cardName', value)}
            onBlur={() => handleBlur('cardName')}
            cursorColor={'#fcbf24'}
            autoCapitalize="words"
          />
          {formData.cardName && (
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
          )}
        </View>
        {errors.cardName && <Text style={styles.errorText}>{errors.cardName}</Text>}

        {/* Proceed Button */}
        <TouchableOpacity
          style={[
            styles.proceedBtn,
            !isFormValid() && styles.proceedBtnDisabled
          ]}
          onPress={nextScreen}
          disabled={!isFormValid()}
        >
          <Text style={styles.proceedText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  banner: {
    height: 200,
    backgroundColor: "#0B2633",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  card: {
    flex: 1,
    marginTop: -40,
    backgroundColor: "#000",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    width: "95%",
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 20,
  },
  Logoicon: {
    width: 130,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },
  // Progress Bar Styles
  progressContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  progressText: {
    color: "#fcbf24",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fcbf24',
    borderRadius: 4,
  },
  progressLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  proceedBtn: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    paddingVertical: 18,
    marginTop: 30,
    alignItems: "center",
  },
  proceedBtnDisabled: {
    backgroundColor: "#555",
    opacity: 0.6,
  },
  proceedText: { 
    color: "#000", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  InputContainer: {
    borderWidth: 1,
    borderColor: "#fcbf24",
    borderStyle: "solid",
    padding: 15,
    flexDirection: "row",
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    backgroundColor: '#181818',
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  ExpiryContainer: {
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    gap: 10,
  },
  expiryInputContainer: {
    flex: 1,
  },
  monthanddate: {
    borderWidth: 1,
    borderColor: "#fcbf24",
    width: '100%',
    borderRadius: 10,
    textAlign: 'center',
    height: 50,
    backgroundColor: '#181818',
    color: 'white',
    fontSize: 16,
  },
  cvv: {
    borderWidth: 1,
    borderColor: "#fcbf24",
    width: '100%',
    borderRadius: 10,
    textAlign: 'center',
    height: 50,
    backgroundColor: '#181818',
    color: 'white',
    fontSize: 16,
  },
  NameContainer: {
    borderWidth: 1,
    borderColor: "#fcbf24",
    borderStyle: "solid",
    padding: 15,
    flexDirection: "row",
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    backgroundColor: '#181818',
    marginTop: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  smallErrorText: {
    color: '#ff6b6b',
    fontSize: 10,
    marginTop: 3,
    textAlign: 'center',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  inputFilled: {
    borderColor: '#4CAF50',
  },
  fieldCheckIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
});

export default SetPaymentInfo;