import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import TransferForm from '../components/TransferForm';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import ScreenHeaders from '../components/ScreenHeaders'; 
import { Feather, Entypo, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';

export default function ReferAndEarn() {
    const navigation = useNavigation();
    const [rewardsModalVisible, setRewardsModalVisible] = useState(false);
    const [howItWorksModalVisible, setHowItWorksModalVisible] = useState(false);
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const referralCode = "B219XN23LA22";
    const referralLink = "https://www.kbl.com/referral/B219XN23LA22";

    const copyToClipboard = async (text) => {
        await Clipboard.setStringAsync(text);
        Alert.alert("Copied!", "Referral info copied to clipboard.");
    };

    const goBack = () => {
        navigation.goBack();
    }

    const handleInviteFriends = () => {
        setIsLoading(true);
        
        // Simulate API call or processing delay
        setTimeout(() => {
            setIsLoading(false);
            setInviteModalVisible(true);
        }, 1500);
    }

    const RewardItem = ({ title, description, status, date, points }) => (
        <View style={styles.rewardItem}>
            <View style={styles.rewardHeader}>
                <Text style={styles.rewardTitle}>{title}</Text>
                <View style={[
                    styles.statusBadge,
                    status === 'Completed' ? styles.statusCompleted : styles.statusPending
                ]}>
                    <Text style={styles.statusText}>{status}</Text>
                </View>
            </View>
            <Text style={styles.rewardDescription}>{description}</Text>
            <View style={styles.rewardFooter}>
                <Text style={styles.rewardDate}>{date}</Text>
                <Text style={styles.rewardPoints}>+{points} points</Text>
            </View>
        </View>
    );

    const StepItem = ({ number, title, description }) => (
        <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{number}</Text>
            </View>
            <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text style={styles.stepDescription}>{description}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack}>
                    <Ionicons name="arrow-back-circle" size={32} color="white" />
                </TouchableOpacity>
                <Text style={styles.text}>Refer & Earn</Text>
                <View style={{width:24}}></View>
            </View>

            {/* Header text */}
            <Text style={styles.headerText}>
                Invite friends to KabLux and earn rewards for{"\n"}every sign-up
            </Text>

            {/* Referral Card */}
            <View style={styles.card}>
                {/* Referral Code */}
                <View style={styles.row}>
                    <View style={styles.textBox}>
                        <Text style={styles.label}>Your referral code :</Text>
                        <Text style={styles.value}>{referralCode}</Text>
                    </View>
                    <TouchableOpacity onPress={() => copyToClipboard(referralCode)}>
                        <Feather name="copy" size={18} color="#FFC107" />
                    </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Referral Link */}
                <View style={styles.row}>
                    <View style={styles.textBox}>
                        <Text style={styles.label}>Your referral link :</Text>
                        <Text style={styles.value}>{referralLink}</Text>
                    </View>
                    <TouchableOpacity onPress={() => copyToClipboard(referralLink)}>
                        <Feather name="copy" size={18} color="#FFC107" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Reward Options */}
            <TouchableOpacity 
                style={styles.option} 
                onPress={() => setRewardsModalVisible(true)}
            >
                <View>
                    <Text style={styles.optionTitle}>Your Rewards</Text>
                    <Text style={styles.optionDesc}>
                        Track the rewards you've earned from successful referrals
                    </Text>
                </View>
                <Entypo name="chevron-right" size={18} color="#FFC107" />
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.option} 
                onPress={() => setHowItWorksModalVisible(true)}
            >
                <View>
                    <Text style={styles.optionTitle}>How it works</Text>
                    <Text style={styles.optionDesc}>
                        Step-by-step explanation of how our referral program works
                    </Text>
                </View>
                <Entypo name="chevron-right" size={18} color="#FFC107" />
            </TouchableOpacity>

            {/* Invite Button */}
            <TouchableOpacity 
                style={[
                    styles.inviteButton,
                    isLoading && styles.inviteButtonDisabled
                ]} 
                onPress={handleInviteFriends}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#04223A" size="small" />
                ) : (
                    <Text style={styles.inviteText}>Invite Friends</Text>
                )}
            </TouchableOpacity>

            {/* Rewards Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={rewardsModalVisible}
                onRequestClose={() => setRewardsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Your Rewards</Text>
                            <TouchableOpacity onPress={() => setRewardsModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFC107" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.totalRewards}>
                                <Text style={styles.totalRewardsText}>Total Points Earned</Text>
                                <Text style={styles.totalRewardsPoints}>1,250 points</Text>
                            </View>

                            <RewardItem
                                title="Friend Referral - John Doe"
                                description="Successfully referred John Doe who completed 5 rides"
                                status="Completed"
                                date="Dec 15, 2024"
                                points="500"
                            />
                            
                            <RewardItem
                                title="Friend Referral - Sarah Smith"
                                description="Successfully referred Sarah Smith who completed 3 rides"
                                status="Completed"
                                date="Nov 28, 2024"
                                points="300"
                            />
                            
                            <RewardItem
                                title="Friend Referral - Mike Johnson"
                                description="Successfully referred Mike Johnson - pending first ride"
                                status="Pending"
                                date="Dec 10, 2024"
                                points="200"
                            />
                            
                            <RewardItem
                                title="Bonus Reward - Holiday Special"
                                description="Extra points for referring during holiday season"
                                status="Completed"
                                date="Dec 5, 2024"
                                points="250"
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* How It Works Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={howItWorksModalVisible}
                onRequestClose={() => setHowItWorksModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>How It Works</Text>
                            <TouchableOpacity onPress={() => setHowItWorksModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFC107" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <StepItem
                                number="1"
                                title="Share Your Referral Link"
                                description="Send your unique referral link to friends and family through any messaging app or social media."
                            />
                            
                            <StepItem
                                number="2"
                                title="Friend Signs Up"
                                description="Your friend signs up using your referral link and completes their first ride."
                            />
                            
                            <StepItem
                                number="3"
                                title="Earn Points"
                                description="Once your friend completes their first ride, you'll earn 500 points instantly."
                            />
                            
                            <StepItem
                                number="4"
                                title="Redeem Rewards"
                                description="Use your accumulated points to get discounts on future rides or redeem for cash rewards."
                            />
                            
                            <StepItem
                                number="5"
                                title="Bonus Earnings"
                                description="Earn additional points for every ride your referred friends take within the first 30 days."
                            />

                            <View style={styles.termsSection}>
                                <Text style={styles.termsTitle}>Terms & Conditions</Text>
                                <Text style={styles.termsText}>
                                    • Maximum 10 referrals per month{"\n"}
                                    • Points expire after 6 months{"\n"}
                                    • Minimum 1000 points required for redemption{"\n"}
                                    • Program subject to change without notice
                                </Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Invite Friends Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={inviteModalVisible}
                onRequestClose={() => setInviteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Invite Friends</Text>
                            <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFC107" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.modalBody}>
                            <View style={styles.inviteContent}>
                                <Ionicons name="gift-outline" size={64} color="#FFC107" style={styles.inviteIcon} />
                                <Text style={styles.inviteMessage}>
                                    Invite your friends using your referral link
                                </Text>
                                
                                <View style={styles.referralLinkContainer}>
                                    <Text style={styles.referralLinkText}>{referralLink}</Text>
                                    <TouchableOpacity 
                                        style={styles.copyButton}
                                        onPress={() => copyToClipboard(referralLink)}
                                    >
                                        <Feather name="copy" size={18} color="#04223A" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.shareText}>
                                    Share this link via:
                                </Text>
                                
                                <View style={styles.shareButtons}>
                                    <TouchableOpacity style={styles.shareButton}>
                                        <Ionicons name="logo-whatsapp" size={24} color="white" />
                                        <Text style={styles.shareButtonText}>WhatsApp</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity style={styles.shareButton}>
                                        <Ionicons name="logo-facebook" size={24} color="white" />
                                        <Text style={styles.shareButtonText}>Facebook</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity style={styles.shareButton}>
                                        <Feather name="message-circle" size={24} color="white" />
                                        <Text style={styles.shareButtonText}>SMS</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
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
    headerText: {
        color: "white",
        textAlign: "center",
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    card: {
        backgroundColor: "#04223A",
        borderWidth: 1,
        borderColor: "#FFC107",
        borderRadius: 16,
        paddingVertical: 10,
        marginBottom: 40,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    textBox: {
        flex: 1,
    },
    label: {
        color: "#aaa",
        fontSize: 13,
    },
    value: {
        color: "white",
        fontSize: 15,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: "#FFC107",
        opacity: 0.4,
        marginHorizontal: 16,
    },
    option: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    optionTitle: {
        color: "white",
        fontSize: 15,
        fontWeight: "500",
    },
    optionDesc: {
        color: "#aaa",
        fontSize: 13,
        marginTop: 2,
        lineHeight: 18,
    },
    inviteButton: {
        backgroundColor: "#FFC107",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 'auto',
    },
    inviteButtonDisabled: {
        opacity: 0.7,
    },
    inviteText: {
        color: "#04223A",
        fontSize: 16,
        fontWeight: "600",
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
    // Rewards Modal Styles
    totalRewards: {
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FFC107',
    },
    totalRewardsText: {
        color: '#FFC107',
        fontSize: 16,
        fontWeight: '600',
    },
    totalRewardsPoints: {
        color: 'white',
        fontSize: 24,
        fontWeight: '700',
        marginTop: 5,
    },
    rewardItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
    },
    rewardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    rewardTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusCompleted: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
    },
    statusPending: {
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    rewardDescription: {
        color: '#ccc',
        fontSize: 14,
        lineHeight: 18,
        marginBottom: 8,
    },
    rewardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rewardDate: {
        color: '#888',
        fontSize: 12,
    },
    rewardPoints: {
        color: '#FFC107',
        fontSize: 16,
        fontWeight: '700',
    },
    // How It Works Modal Styles
    stepItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFC107',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    stepNumberText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    stepDescription: {
        color: '#ccc',
        fontSize: 14,
        lineHeight: 20,
    },
    termsSection: {
        marginTop: 20,
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
    },
    termsTitle: {
        color: '#FFC107',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    termsText: {
        color: '#ccc',
        fontSize: 14,
        lineHeight: 20,
    },
    // Invite Modal Styles
    inviteContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    inviteIcon: {
        marginBottom: 20,
    },
    inviteMessage: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    referralLinkContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
        width: '100%',
    },
    referralLinkText: {
        color: 'white',
        fontSize: 14,
        flex: 1,
    },
    copyButton: {
        backgroundColor: '#FFC107',
        padding: 8,
        borderRadius: 6,
        marginLeft: 10,
    },
    shareText: {
        color: '#FFC107',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 15,
        alignSelf: 'flex-start',
    },
    shareButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    shareButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#FFC107',
    },
    shareButtonText: {
        color: 'white',
        fontSize: 12,
        marginTop: 5,
        fontWeight: '500',
    },
});