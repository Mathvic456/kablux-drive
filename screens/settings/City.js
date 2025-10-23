import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import TransferForm from '../components/TransferForm';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import ScreenHeaders from '../components/ScreenHeaders'; 
import { Feather, Entypo, FontAwesome, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';

export default function City() {
    const navigation = useNavigation();
    const [modalVisible, setModalVisible] = useState(false);
    const [placeType, setPlaceType] = useState('');
    const [address, setAddress] = useState('');
    const [favourites, setFavourites] = useState([
        {
            type: 'home',
            title: 'Home',
            address: '268 olorulana Street, osun state',
            city: 'Osun State'
        },
        {
            type: 'city',
            title: 'City',
            address: 'Lagos State of Nigeria',
            city: 'Lagos State'
        }
    ]);

    const goBack = () => {
        navigation.goBack();
    }

    const handleAddPlace = () => {
        setModalVisible(true);
    }

    const handlePlaceTypeSelect = (type) => {
        setPlaceType(type);
    }

    const handleSavePlace = () => {
        if (!placeType) {
            Alert.alert('Error', 'Please select a place type');
            return;
        }

        if (!address.trim()) {
            Alert.alert('Error', 'Please enter an address');
            return;
        }

        // Extract city from address (simple implementation - you might want to use geocoding)
        const extractedCity = extractCityFromAddress(address);

        const newPlace = {
            type: placeType,
            title: placeType === 'home' ? 'Home' : 'Work',
            address: address,
            city: extractedCity
        };

        // Add to favourites
        setFavourites(prevFavourites => [newPlace, ...prevFavourites]);

        // Reset form and close modal
        setPlaceType('');
        setAddress('');
        setModalVisible(false);

        Alert.alert('Success', 'Place added to favourites!');
    }

    const extractCityFromAddress = (fullAddress) => {
        // Simple city extraction - you might want to use a geocoding service
        const cityKeywords = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu', 'Calabar', 'Osun', 'Oyo'];
        for (const city of cityKeywords) {
            if (fullAddress.toLowerCase().includes(city.toLowerCase())) {
                return city;
            }
        }
        return 'Unknown City';
    }

    const getPlaceIcon = (type) => {
        switch (type) {
            case 'home':
                return <Entypo name="home" size={22} color="#FFC107" />;
            case 'work':
                return <FontAwesome5 name="briefcase" size={18} color="#FFC107" />;
            case 'city':
                return <FontAwesome5 name="city" size={18} color="#FFC107" />;
            default:
                return <Entypo name="location-pin" size={22} color="#FFC107" />;
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack}>
                    <Ionicons name="arrow-back-circle" size={32} color="white" />
                </TouchableOpacity>
                <Text style={styles.text}>City</Text>
                <View style={{ width: 24 }}></View>
            </View>

            {/* Favourites Section */}
            <Text style={styles.sectionTitle}>Favourites</Text>

            <View style={styles.card}>
                {/* Render favourites */}
                {favourites.map((favourite, index) => (
                    <View key={index} style={styles.row}>
                        {getPlaceIcon(favourite.type)}
                        <View style={styles.textBox}>
                            <Text style={styles.title}>{favourite.title}</Text>
                            <Text style={styles.desc}>{favourite.address}</Text>
                            {favourite.city && (
                                <Text style={styles.cityText}>City: {favourite.city}</Text>
                            )}
                        </View>
                        <Entypo name="chevron-right" size={18} color="#FFC107" />
                    </View>
                ))}

                {/* Add a place */}
                <TouchableOpacity style={styles.row} onPress={handleAddPlace}>
                    <Feather name="plus" size={22} color="#FFC107" />
                    <View style={styles.textBox}>
                        <Text style={styles.title}>Add a place</Text>
                    </View>
                    <Entypo name="chevron-right" size={18} color="#FFC107" />
                </TouchableOpacity>
            </View>

            {/* Apply for city-to-city Section */}
            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Apply for city to city</Text>
            <Text style={styles.subText}>This is for specially approved vehicles only</Text>

            <View style={styles.card}>
                {/* From */}
                <View style={styles.row}>
                    <Text style={styles.title}>From</Text>
                    <View style={styles.textBox}>
                        <Text style={styles.desc}>Lagos State of Nigeria</Text>
                    </View>
                </View>

                {/* To */}
                <TouchableOpacity style={styles.row}>
                    <Text style={styles.title}>To</Text>
                    <Entypo name="chevron-right" size={18} color="#FFC107" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
            </View>

            {/* Add Place Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Place</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFC107" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {/* Place Type Selection */}
                            <Text style={styles.modalLabel}>Select Place Type</Text>
                            <View style={styles.placeTypeContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.placeTypeButton,
                                        placeType === 'home' && styles.placeTypeButtonSelected
                                    ]}
                                    onPress={() => handlePlaceTypeSelect('home')}
                                >
                                    <Entypo 
                                        name="home" 
                                        size={24} 
                                        color={placeType === 'home' ? '#000' : '#FFC107'} 
                                    />
                                    <Text style={[
                                        styles.placeTypeText,
                                        placeType === 'home' && styles.placeTypeTextSelected
                                    ]}>
                                        Home
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.placeTypeButton,
                                        placeType === 'work' && styles.placeTypeButtonSelected
                                    ]}
                                    onPress={() => handlePlaceTypeSelect('work')}
                                >
                                    <FontAwesome5 
                                        name="briefcase" 
                                        size={20} 
                                        color={placeType === 'work' ? '#000' : '#FFC107'} 
                                    />
                                    <Text style={[
                                        styles.placeTypeText,
                                        placeType === 'work' && styles.placeTypeTextSelected
                                    ]}>
                                        Work
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Address Input */}
                            <Text style={styles.modalLabel}>Enter Address</Text>
                            <TextInput
                                style={styles.addressInput}
                                placeholder="Enter full address..."
                                placeholderTextColor="#888"
                                value={address}
                                onChangeText={setAddress}
                                multiline={true}
                                numberOfLines={3}
                                textAlignVertical="top"
                            />

                            {/* City Preview */}
                            {address && (
                                <View style={styles.cityPreview}>
                                    <Text style={styles.cityPreviewText}>
                                        Detected City: {extractCityFromAddress(address)}
                                    </Text>
                                </View>
                            )}

                            {/* Save Button */}
                            <TouchableOpacity 
                                style={[
                                    styles.saveButton,
                                    (!placeType || !address.trim()) && styles.saveButtonDisabled
                                ]}
                                onPress={handleSavePlace}
                                disabled={!placeType || !address.trim()}
                            >
                                <Text style={styles.saveButtonText}>Save to Favourites</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 50,
        backgroundColor: 'black',
        gap: 30,
    },
    text: {
        fontSize: 30,
        color: 'white',
        alignSelf: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
    },
    subText: {
        color: '#aaa',
        fontSize: 13,
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#04223A',
        borderWidth: 1,
        borderColor: '#FFC107',
        borderRadius: 16,
        paddingVertical: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 0.7,
        borderBottomColor: 'rgba(255, 193, 7, 0.3)',
    },
    textBox: {
        flex: 1,
        marginLeft: 10,
    },
    title: {
        color: 'white',
        fontSize: 15,
        fontWeight: '500',
    },
    desc: {
        color: '#ccc',
        fontSize: 13,
        marginTop: 2,
    },
    cityText: {
        color: '#FFC107',
        fontSize: 12,
        marginTop: 2,
        fontStyle: 'italic',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#04223A',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        borderColor: '#FFC107',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#FFC107',
    },
    modalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    modalBody: {
        padding: 20,
    },
    modalLabel: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        marginTop: 10,
    },
    placeTypeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    placeTypeButton: {
        flex: 1,
        alignItems: 'center',
        padding: 15,
        marginHorizontal: 5,
        borderWidth: 2,
        borderColor: '#FFC107',
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    placeTypeButtonSelected: {
        backgroundColor: '#FFC107',
    },
    placeTypeText: {
        color: '#FFC107',
        marginTop: 8,
        fontWeight: '600',
    },
    placeTypeTextSelected: {
        color: '#000',
        fontWeight: '700',
    },
    addressInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: '#FFC107',
        borderRadius: 12,
        padding: 15,
        color: 'white',
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    cityPreview: {
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#FFC107',
    },
    cityPreviewText: {
        color: '#FFC107',
        fontSize: 14,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: '#FFC107',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonDisabled: {
        backgroundColor: '#666',
        opacity: 0.5,
    },
    saveButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
});