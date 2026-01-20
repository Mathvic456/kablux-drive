import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  ActivityIndicator, 
  SafeAreaView,
  StatusBar,
  Platform,
  useWindowDimensions,
  Dimensions,
  Alert,
  Share,
  Linking 
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Feather, Entypo } from '@expo/vector-icons';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import * as SMS from 'expo-sms';
import CentralModal from '../components/CentralModal';

export default function ReferAndEarn() {
    const navigation = useNavigation();
    const { width, height } = useWindowDimensions();
    const isSmallScreen = width < 375;
    const isMediumScreen = width >= 375 && width <= 414;
    const isLargeScreen = width > 414;
    const isTablet = width > 768;
    const screenHeight = Dimensions.get('window').height;
    const isShortScreen = screenHeight < 700;

    const [rewardsModalVisible, setRewardsModalVisible] = useState(false);
    const [howItWorksModalVisible, setHowItWorksModalVisible] = useState(false);
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [copyModalVisible, setCopyModalVisible] = useState(false);

    const referralCode = "B219XN23LA22";
    const referralLink = "https://kabluxe.com";
    const shareMessage = `Join me on KabLux! Use my referral code ${referralCode} to get started and we both earn rewards. Sign up here: ${referralLink}`;

    const copyToClipboard = async (text) => {
        await Clipboard.setStringAsync(text);
        setCopyModalVisible(true);
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

    // WhatsApp sharing
    const shareViaWhatsApp = async () => {
        try {
            const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
            const canOpen = await Linking.canOpenURL(whatsappUrl);
            
            if (canOpen) {
                await Linking.openURL(whatsappUrl);
            } else {
                // If WhatsApp is not installed, fallback to generic share
                await Share.share({
                    message: shareMessage,
                    title: 'Invite to KabLux',
                });
            }
        } catch (error) {
            console.error('Error sharing via WhatsApp:', error);
            Alert.alert('Error', 'Unable to share via WhatsApp. Please try another method.');
        }
    };

    // Facebook sharing
    const shareViaFacebook = async () => {
        try {
            // Note: Facebook's sharing URL is more complex and requires proper setup
            // This is a simplified approach using the Share API
            await Share.share({
                message: shareMessage,
                title: 'Invite to KabLux',
                url: referralLink,
            });
        } catch (error) {
            console.error('Error sharing via Facebook:', error);
            Alert.alert('Error', 'Unable to share via Facebook. Please try another method.');
        }
    };

    // SMS sharing
    const shareViaSMS = async () => {
        try {
            const isAvailable = await SMS.isAvailableAsync();
            if (isAvailable) {
                await SMS.sendSMSAsync(
                    [], // Empty array will open SMS app with no recipient pre-filled
                    shareMessage
                );
            } else {
                Alert.alert('SMS Not Available', 'SMS is not available on this device.');
            }
        } catch (error) {
            console.error('Error sharing via SMS:', error);
            Alert.alert('Error', 'Unable to send SMS. Please try another method.');
        }
    };

    // Generic sharing
    const shareViaGeneric = async () => {
        try {
            await Share.share({
                message: shareMessage,
                title: 'Invite to KabLux',
                url: referralLink,
            });
        } catch (error) {
            console.error('Error sharing:', error);
            Alert.alert('Error', 'Unable to share. Please try again.');
        }
    };

    const RewardItem = ({ title, description, status, date, points }) => (
        <View style={[
            styles.rewardItem,
            isSmallScreen && styles.rewardItemSmall,
            isLargeScreen && styles.rewardItemLarge,
            isShortScreen && styles.rewardItemShort
        ]}>
            <View style={styles.rewardHeader}>
                <Text style={[
                    styles.rewardTitle,
                    isSmallScreen && styles.rewardTitleSmall,
                    isLargeScreen && styles.rewardTitleLarge,
                    isShortScreen && styles.rewardTitleShort
                ]}>{title}</Text>
                <View style={[
                    styles.statusBadge,
                    status === 'Completed' ? styles.statusCompleted : styles.statusPending,
                    isSmallScreen && styles.statusBadgeSmall,
                    isShortScreen && styles.statusBadgeShort
                ]}>
                    <Text style={[
                        styles.statusText,
                        isSmallScreen && styles.statusTextSmall,
                        isShortScreen && styles.statusTextShort
                    ]}>{status}</Text>
                </View>
            </View>
            <Text style={[
                styles.rewardDescription,
                isSmallScreen && styles.rewardDescriptionSmall,
                isLargeScreen && styles.rewardDescriptionLarge,
                isShortScreen && styles.rewardDescriptionShort
            ]}>{description}</Text>
            <View style={styles.rewardFooter}>
                <Text style={[
                    styles.rewardDate,
                    isSmallScreen && styles.rewardDateSmall,
                    isShortScreen && styles.rewardDateShort
                ]}>{date}</Text>
                <Text style={[
                    styles.rewardPoints,
                    isSmallScreen && styles.rewardPointsSmall,
                    isLargeScreen && styles.rewardPointsLarge,
                    isShortScreen && styles.rewardPointsShort
                ]}>+{points} points</Text>
            </View>
        </View>
    );

    const StepItem = ({ number, title, description }) => (
        <View style={[
            styles.stepItem,
            isSmallScreen && styles.stepItemSmall,
            isLargeScreen && styles.stepItemLarge,
            isShortScreen && styles.stepItemShort
        ]}>
            <View style={[
                styles.stepNumber,
                isSmallScreen && styles.stepNumberSmall,
                isLargeScreen && styles.stepNumberLarge,
                isShortScreen && styles.stepNumberShort
            ]}>
                <Text style={[
                    styles.stepNumberText,
                    isSmallScreen && styles.stepNumberTextSmall,
                    isLargeScreen && styles.stepNumberTextLarge,
                    isShortScreen && styles.stepNumberTextShort
                ]}>{number}</Text>
            </View>
            <View style={styles.stepContent}>
                <Text style={[
                    styles.stepTitle,
                    isSmallScreen && styles.stepTitleSmall,
                    isLargeScreen && styles.stepTitleLarge,
                    isShortScreen && styles.stepTitleShort
                ]}>{title}</Text>
                <Text style={[
                    styles.stepDescription,
                    isSmallScreen && styles.stepDescriptionSmall,
                    isLargeScreen && styles.stepDescriptionLarge,
                    isShortScreen && styles.stepDescriptionShort
                ]}>{description}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="black" />
            <View style={[
                styles.container,
                isSmallScreen && styles.containerSmall,
                isLargeScreen && styles.containerLarge,
                isTablet && styles.containerTablet,
                isShortScreen && styles.containerShort
            ]}>
                {/* Header */}
                <View style={[
                    styles.header,
                    isSmallScreen && styles.headerSmall,
                    isLargeScreen && styles.headerLarge,
                    isTablet && styles.headerTablet,
                    isShortScreen && styles.headerShort
                ]}>
                    <TouchableOpacity 
                        onPress={goBack}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons 
                            name="arrow-back-circle" 
                            size={isSmallScreen ? 28 : isShortScreen ? 26 : 32} 
                            color="white" 
                        />
                    </TouchableOpacity>
                    <Text style={[
                        styles.text,
                        isSmallScreen && styles.textSmall,
                        isLargeScreen && styles.textLarge,
                        isTablet && styles.textTablet,
                        isShortScreen && styles.textShort
                    ]}>Refer & Earn</Text>
                    <View style={{ 
                        width: isSmallScreen ? 28 : isShortScreen ? 26 : 32 
                    }}></View>
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scrollContent,
                        isShortScreen && styles.scrollContentShort
                    ]}
                >
                    {/* Header text */}
                    <Text style={[
                        styles.headerText,
                        isSmallScreen && styles.headerTextSmall,
                        isLargeScreen && styles.headerTextLarge,
                        isTablet && styles.headerTextTablet,
                        isShortScreen && styles.headerTextShort
                    ]}>
                        Invite friends to KabLux and earn rewards for{"\n"}every sign-up
                    </Text>

                    {/* Referral Card */}
                    <View style={[
                        styles.card,
                        isSmallScreen && styles.cardSmall,
                        isLargeScreen && styles.cardLarge,
                        isTablet && styles.cardTablet,
                        isShortScreen && styles.cardShort
                    ]}>
                        {/* Referral Code */}
                        <View style={[
                            styles.row,
                            isShortScreen && styles.rowShort
                        ]}>
                            <View style={[
                                styles.textBox,
                                isShortScreen && styles.textBoxShort
                            ]}>
                                <Text style={[
                                    styles.label,
                                    isSmallScreen && styles.labelSmall,
                                    isShortScreen && styles.labelShort
                                ]}>Your referral code :</Text>
                                <Text style={[
                                    styles.value,
                                    isSmallScreen && styles.valueSmall,
                                    isLargeScreen && styles.valueLarge,
                                    isShortScreen && styles.valueShort
                                ]}>{referralCode}</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => copyToClipboard(referralCode)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather 
                                    name="copy" 
                                    size={isSmallScreen ? 16 : isShortScreen ? 14 : 18} 
                                    color="#FFC107" 
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={[
                            styles.divider,
                            isShortScreen && styles.dividerShort
                        ]} />

                        {/* Referral Link */}
                        <View style={[
                            styles.row,
                            isShortScreen && styles.rowShort
                        ]}>
                            <View style={[
                                styles.textBox,
                                isShortScreen && styles.textBoxShort
                            ]}>
                                <Text style={[
                                    styles.label,
                                    isSmallScreen && styles.labelSmall,
                                    isShortScreen && styles.labelShort
                                ]}>Your referral link :</Text>
                                <Text style={[
                                    styles.value,
                                    isSmallScreen && styles.valueSmall,
                                    isLargeScreen && styles.valueLarge,
                                    isShortScreen && styles.valueShort
                                ]} numberOfLines={2}>
                                    {referralLink}
                                </Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => copyToClipboard(referralLink)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather 
                                    name="copy" 
                                    size={isSmallScreen ? 16 : isShortScreen ? 14 : 18} 
                                    color="#FFC107" 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Reward Options */}
                    <TouchableOpacity 
                        style={[
                            styles.option, 
                            isSmallScreen && styles.optionSmall,
                            isLargeScreen && styles.optionLarge,
                            isShortScreen && styles.optionShort
                        ]} 
                        onPress={() => setRewardsModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.optionContent}>
                            <Text style={[
                                styles.optionTitle,
                                isSmallScreen && styles.optionTitleSmall,
                                isLargeScreen && styles.optionTitleLarge,
                                isShortScreen && styles.optionTitleShort
                            ]}>Your Rewards</Text>
                            <Text style={[
                                styles.optionDesc,
                                isSmallScreen && styles.optionDescSmall,
                                isLargeScreen && styles.optionDescLarge,
                                isShortScreen && styles.optionDescShort
                            ]}>
                                Track the rewards you've earned from successful referrals
                            </Text>
                        </View>
                        <Entypo 
                            name="chevron-right" 
                            size={isSmallScreen ? 16 : isShortScreen ? 14 : 18} 
                            color="#FFC107" 
                        />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[
                            styles.option, 
                            isSmallScreen && styles.optionSmall,
                            isLargeScreen && styles.optionLarge,
                            isShortScreen && styles.optionShort
                        ]} 
                        onPress={() => setHowItWorksModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.optionContent}>
                            <Text style={[
                                styles.optionTitle,
                                isSmallScreen && styles.optionTitleSmall,
                                isLargeScreen && styles.optionTitleLarge,
                                isShortScreen && styles.optionTitleShort
                            ]}>How it works</Text>
                            <Text style={[
                                styles.optionDesc,
                                isSmallScreen && styles.optionDescSmall,
                                isLargeScreen && styles.optionDescLarge,
                                isShortScreen && styles.optionDescShort
                            ]}>
                                Step-by-step explanation of how our referral program works
                            </Text>
                        </View>
                        <Entypo 
                            name="chevron-right" 
                            size={isSmallScreen ? 16 : isShortScreen ? 14 : 18} 
                            color="#FFC107" 
                        />
                    </TouchableOpacity>

                    {/* Invite Button */}
                    <TouchableOpacity 
                        style={[
                            styles.inviteButton,
                            isSmallScreen && styles.inviteButtonSmall,
                            isLargeScreen && styles.inviteButtonLarge,
                            isTablet && styles.inviteButtonTablet,
                            isShortScreen && styles.inviteButtonShort,
                            isLoading && styles.inviteButtonDisabled
                        ]} 
                        onPress={handleInviteFriends}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#04223A" size="small" />
                        ) : (
                            <Text style={[
                                styles.inviteText,
                                isSmallScreen && styles.inviteTextSmall,
                                isLargeScreen && styles.inviteTextLarge,
                                isShortScreen && styles.inviteTextShort
                            ]}>Invite Friends</Text>
                        )}
                    </TouchableOpacity>

                    {/* Bottom Spacer */}
                    <View style={[
                        styles.bottomSpacer,
                        isShortScreen && styles.bottomSpacerShort
                    ]} />
                </ScrollView>

                {/* Rewards Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={rewardsModalVisible}
                    onRequestClose={() => setRewardsModalVisible(false)}
                    statusBarTranslucent={true}
                >
                    <SafeAreaView style={[
                        styles.modalOverlay,
                        isTablet && styles.modalOverlayTablet
                    ]}>
                        <StatusBar backgroundColor="rgba(0, 0, 0, 0.9)" barStyle="light-content" />
                        <View style={[
                            styles.modalContent,
                            isSmallScreen && styles.modalContentSmall,
                            isLargeScreen && styles.modalContentLarge,
                            isTablet && styles.modalContentTablet,
                            isShortScreen && styles.modalContentShort
                        ]}>
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
                                ]}>Your Rewards</Text>
                                <TouchableOpacity 
                                    onPress={() => setRewardsModalVisible(false)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons 
                                        name="close" 
                                        size={isSmallScreen ? 22 : isShortScreen ? 20 : 24} 
                                        color="#FFC107" 
                                    />
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView 
                                style={styles.modalBody}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={[
                                    styles.modalBodyContent,
                                    isShortScreen && styles.modalBodyContentShort
                                ]}
                            >
                                <View style={[
                                    styles.totalRewards,
                                    isSmallScreen && styles.totalRewardsSmall,
                                    isLargeScreen && styles.totalRewardsLarge,
                                    isShortScreen && styles.totalRewardsShort
                                ]}>
                                    <Text style={[
                                        styles.totalRewardsText,
                                        isSmallScreen && styles.totalRewardsTextSmall,
                                        isLargeScreen && styles.totalRewardsTextLarge,
                                        isShortScreen && styles.totalRewardsTextShort
                                    ]}>Total Points Earned</Text>
                                    <Text style={[
                                        styles.totalRewardsPoints,
                                        isSmallScreen && styles.totalRewardsPointsSmall,
                                        isLargeScreen && styles.totalRewardsPointsLarge,
                                        isShortScreen && styles.totalRewardsPointsShort
                                    ]}>1,250 points</Text>
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
                    </SafeAreaView>
                </Modal>

                {/* How It Works Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={howItWorksModalVisible}
                    onRequestClose={() => setHowItWorksModalVisible(false)}
                    statusBarTranslucent={true}
                >
                    <SafeAreaView style={[
                        styles.modalOverlay,
                        isTablet && styles.modalOverlayTablet
                    ]}>
                        <StatusBar backgroundColor="rgba(0, 0, 0, 0.9)" barStyle="light-content" />
                        <View style={[
                            styles.modalContent,
                            isSmallScreen && styles.modalContentSmall,
                            isLargeScreen && styles.modalContentLarge,
                            isTablet && styles.modalContentTablet,
                            isShortScreen && styles.modalContentShort
                        ]}>
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
                                ]}>How It Works</Text>
                                <TouchableOpacity 
                                    onPress={() => setHowItWorksModalVisible(false)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons 
                                        name="close" 
                                        size={isSmallScreen ? 22 : isShortScreen ? 20 : 24} 
                                        color="#FFC107" 
                                    />
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView 
                                style={styles.modalBody}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={[
                                    styles.modalBodyContent,
                                    isShortScreen && styles.modalBodyContentShort
                                ]}
                            >
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

                                <View style={[
                                    styles.termsSection,
                                    isSmallScreen && styles.termsSectionSmall,
                                    isLargeScreen && styles.termsSectionLarge,
                                    isShortScreen && styles.termsSectionShort
                                ]}>
                                    <Text style={[
                                        styles.termsTitle,
                                        isSmallScreen && styles.termsTitleSmall,
                                        isLargeScreen && styles.termsTitleLarge,
                                        isShortScreen && styles.termsTitleShort
                                    ]}>Terms & Conditions</Text>
                                    <Text style={[
                                        styles.termsText,
                                        isSmallScreen && styles.termsTextSmall,
                                        isLargeScreen && styles.termsTextLarge,
                                        isShortScreen && styles.termsTextShort
                                    ]}>
                                        • Maximum 10 referrals per month{"\n"}
                                        • Points expire after 6 months{"\n"}
                                        • Minimum 1000 points required for redemption{"\n"}
                                        • Program subject to change without notice
                                    </Text>
                                </View>
                            </ScrollView>
                        </View>
                    </SafeAreaView>
                </Modal>

                {/* Invite Friends Modal */}
                // Replace the Invite Friends Modal section with this updated version:

{/* Invite Friends Modal */}
<Modal
    animationType="slide"
    transparent={true}
    visible={inviteModalVisible}
    onRequestClose={() => setInviteModalVisible(false)}
    statusBarTranslucent={true}
>
    <SafeAreaView style={[
        styles.modalOverlay,
        isTablet && styles.modalOverlayTablet
    ]}>
        <StatusBar backgroundColor="rgba(0, 0, 0, 0.9)" barStyle="light-content" />
        <View style={[
            styles.modalContent,
            isSmallScreen && styles.modalContentSmall,
            isLargeScreen && styles.modalContentLarge,
            isTablet && styles.modalContentTablet,
            isShortScreen && styles.modalContentShort,
            styles.inviteModal // Add specific style for invite modal
        ]}>
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
                ]}>Invite Friends</Text>
                <TouchableOpacity 
                    onPress={() => setInviteModalVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons 
                        name="close" 
                        size={isSmallScreen ? 22 : isShortScreen ? 20 : 24} 
                        color="#FFC107" 
                    />
                </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.inviteScrollContent,
                        isShortScreen && styles.inviteScrollContentShort
                    ]}
                >
                    <View style={[
                        styles.inviteContent,
                        isShortScreen && styles.inviteContentShort
                    ]}>
                        <Ionicons 
                            name="gift-outline" 
                            size={isSmallScreen ? 48 : isShortScreen ? 40 : 64} 
                            color="#FFC107" 
                            style={[
                                styles.inviteIcon,
                                isShortScreen && styles.inviteIconShort
                            ]} 
                        />
                        <Text style={[
                            styles.inviteMessage,
                            isSmallScreen && styles.inviteMessageSmall,
                            isLargeScreen && styles.inviteMessageLarge,
                            isShortScreen && styles.inviteMessageShort
                        ]}>
                            Invite your friends using your referral link
                        </Text>
                        
                        <View style={[
                            styles.referralLinkContainer,
                            isSmallScreen && styles.referralLinkContainerSmall,
                            isLargeScreen && styles.referralLinkContainerLarge,
                            isShortScreen && styles.referralLinkContainerShort
                        ]}>
                            <Text style={[
                                styles.referralLinkText,
                                isSmallScreen && styles.referralLinkTextSmall,
                                isShortScreen && styles.referralLinkTextShort
                            ]} numberOfLines={2}>
                                {referralLink}
                            </Text>
                            <TouchableOpacity 
                                style={[
                                    styles.copyButton,
                                    isSmallScreen && styles.copyButtonSmall,
                                    isShortScreen && styles.copyButtonShort
                                ]}
                                onPress={() => copyToClipboard(referralLink)}
                            >
                                <Feather 
                                    name="copy" 
                                    size={isSmallScreen ? 16 : isShortScreen ? 14 : 18} 
                                    color="#04223A" 
                                />
                            </TouchableOpacity>
                        </View>

                        <Text style={[
                            styles.shareText,
                            isSmallScreen && styles.shareTextSmall,
                            isLargeScreen && styles.shareTextLarge,
                            isShortScreen && styles.shareTextShort
                        ]}>
                            Share this link via:
                        </Text>
                        
                        <View style={[
                            styles.shareButtons,
                            isShortScreen && styles.shareButtonsShort
                        ]}>
                            <TouchableOpacity 
                                style={[
                                    styles.shareButton,
                                    isSmallScreen && styles.shareButtonSmall,
                                    isLargeScreen && styles.shareButtonLarge,
                                    isShortScreen && styles.shareButtonShort
                                ]}
                                onPress={shareViaWhatsApp}
                                activeOpacity={0.7}
                            >
                                <Ionicons 
                                    name="logo-whatsapp" 
                                    size={isSmallScreen ? 22 : isShortScreen ? 20 : 24} 
                                    color="white" 
                                />
                                <Text style={[
                                    styles.shareButtonText,
                                    isSmallScreen && styles.shareButtonTextSmall,
                                    isShortScreen && styles.shareButtonTextShort
                                ]}>WhatsApp</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[
                                    styles.shareButton,
                                    isSmallScreen && styles.shareButtonSmall,
                                    isLargeScreen && styles.shareButtonLarge,
                                    isShortScreen && styles.shareButtonShort
                                ]}
                                onPress={shareViaFacebook}
                                activeOpacity={0.7}
                            >
                                <Ionicons 
                                    name="logo-facebook" 
                                    size={isSmallScreen ? 22 : isShortScreen ? 20 : 24} 
                                    color="white" 
                                />
                                <Text style={[
                                    styles.shareButtonText,
                                    isSmallScreen && styles.shareButtonTextSmall,
                                    isShortScreen && styles.shareButtonTextShort
                                ]}>Facebook</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[
                                    styles.shareButton,
                                    isSmallScreen && styles.shareButtonSmall,
                                    isLargeScreen && styles.shareButtonLarge,
                                    isShortScreen && styles.shareButtonShort
                                ]}
                                onPress={shareViaSMS}
                                activeOpacity={0.7}
                            >
                                <Feather 
                                    name="message-circle" 
                                    size={isSmallScreen ? 22 : isShortScreen ? 20 : 24} 
                                    color="white" 
                                />
                                <Text style={[
                                    styles.shareButtonText,
                                    isSmallScreen && styles.shareButtonTextSmall,
                                    isShortScreen && styles.shareButtonTextShort
                                ]}>SMS</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Other sharing options */}
                        <TouchableOpacity 
                            style={[
                                styles.otherShareButton,
                                isSmallScreen && styles.otherShareButtonSmall,
                                isLargeScreen && styles.otherShareButtonLarge,
                                isShortScreen && styles.otherShareButtonShort
                            ]}
                            onPress={shareViaGeneric}
                            activeOpacity={0.7}
                        >
                            <Ionicons 
                                name="share-social-outline" 
                                size={isSmallScreen ? 18 : isShortScreen ? 16 : 20} 
                                color="#FFC107" 
                            />
                            <Text style={[
                                styles.otherShareText,
                                isSmallScreen && styles.otherShareTextSmall,
                                isShortScreen && styles.otherShareTextShort
                            ]}>Other Apps</Text>
                        </TouchableOpacity>

                        {/* Instructions */}
                        <View style={[
                            styles.instructionsContainer,
                            isShortScreen && styles.instructionsContainerShort
                        ]}>
                            <Text style={[
                                styles.instructionsTitle,
                                isSmallScreen && styles.instructionsTitleSmall,
                                isShortScreen && styles.instructionsTitleShort
                            ]}>How to Earn Rewards:</Text>
                            <View style={styles.instructionsList}>
                                <View style={[
                                    styles.instructionItem,
                                    isShortScreen && styles.instructionItemShort
                                ]}>
                                    <Ionicons name="checkmark-circle" size={16} color="#FFC107" />
                                    <Text style={[
                                        styles.instructionText,
                                        isSmallScreen && styles.instructionTextSmall,
                                        isShortScreen && styles.instructionTextShort
                                    ]}>Your friend signs up using your link</Text>
                                </View>
                                <View style={[
                                    styles.instructionItem,
                                    isShortScreen && styles.instructionItemShort
                                ]}>
                                    <Ionicons name="checkmark-circle" size={16} color="#FFC107" />
                                    <Text style={[
                                        styles.instructionText,
                                        isSmallScreen && styles.instructionTextSmall,
                                        isShortScreen && styles.instructionTextShort
                                    ]}>They complete their first ride</Text>
                                </View>
                                <View style={[
                                    styles.instructionItem,
                                    isShortScreen && styles.instructionItemShort
                                ]}>
                                    <Ionicons name="checkmark-circle" size={16} color="#FFC107" />
                                    <Text style={[
                                        styles.instructionText,
                                        isSmallScreen && styles.instructionTextSmall,
                                        isShortScreen && styles.instructionTextShort
                                    ]}>You earn 500 points instantly!</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    </SafeAreaView>
</Modal>


<CentralModal
                    visible={copyModalVisible}
                    onClose={() => setCopyModalVisible(false)}
                    title="Copied!"
                    subText="Referral info copied to clipboard."
                    icon="checkmark-circle"
                    confirmText="Got it"
                    closeText=""
                    onConfirm={() => setCopyModalVisible(false)}
                    confirmButtonColor="#FFC107"
                    themeColor="#4CAF50"
                />
            </View>
        </SafeAreaView>
    );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    safeArea: {

        flex: 1,
        backgroundColor: 'black',
    },
    container: {
        flex: 1,
        backgroundColor: 'black',
        paddingTop: Platform.OS === 'ios' ? 20 : 40,
    },
    containerSmall: {
        paddingTop: Platform.OS === 'ios' ? 5 : 15,
    },
    containerLarge: {
        paddingTop: Platform.OS === 'ios' ? 15 : 25,
    },
    containerTablet: {
        paddingTop: Platform.OS === 'ios' ? 20 : 30,
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
    },
    containerShort: {
        paddingTop: Platform.OS === 'ios' ? 5 : 10,
    },
    scrollContent: {
        paddingHorizontal: Math.min(width * 0.05, 20),
        paddingBottom: Math.min(height * 0.05, 40),
        flexGrow: 1,
    },
    scrollContentShort: {
        paddingHorizontal: Math.min(width * 0.035, 14),
        paddingBottom: Math.min(height * 0.03, 24),
    },


    // Add these styles to the existing StyleSheet

// Invite Modal specific styles
inviteModal: {
    maxHeight: '90%', // Increased from 85%
    minHeight: Math.min(height * 0.6, 400), // Minimum height to ensure content fits
},

inviteScrollContent: {
    padding: Math.min(width * 0.05, 20),
    paddingBottom: Math.min(height * 0.05, 40),
    flexGrow: 1,
    justifyContent: 'center',
},

inviteScrollContentShort: {
    padding: Math.min(width * 0.04, 16),
    paddingBottom: Math.min(height * 0.04, 32),
},

instructionsContainer: {
    marginTop: Math.min(height * 0.03, 24),
    padding: Math.min(width * 0.04, 16),
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: Math.min(width * 0.03, 12),
    borderWidth: 1,
    borderColor: '#FFC107',
},

instructionsContainerShort: {
    marginTop: Math.min(height * 0.02, 16),
    padding: Math.min(width * 0.035, 14),
},

instructionsTitle: {
    color: '#FFC107',
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '600',
    marginBottom: Math.min(height * 0.012, 12),
},

instructionsTitleSmall: {
    fontSize: Math.min(width * 0.038, 14),
},

instructionsTitleShort: {
    fontSize: Math.min(width * 0.036, 13),
},

instructionsList: {
    gap: Math.min(height * 0.008, 8),
},

instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Math.min(height * 0.004, 4),
},

instructionItemShort: {
    paddingVertical: Math.min(height * 0.003, 3),
},

instructionText: {
    color: 'white',
    fontSize: Math.min(width * 0.038, 14),
    marginLeft: Math.min(width * 0.02, 8),
    flex: 1,
},

instructionTextSmall: {
    fontSize: Math.min(width * 0.036, 13),
    marginLeft: Math.min(width * 0.015, 6),
},

instructionTextShort: {
    fontSize: Math.min(width * 0.034, 12),
    marginLeft: Math.min(width * 0.01, 4),
},

// Also update the modalBody style to fix the layout
modalBody: {
    flex: 1,
    minHeight: Math.min(height * 0.5, 350), // Ensure modal body has minimum height
},
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Math.min(width * 0.05, 20),
        paddingBottom: Math.min(height * 0.02, 20),
    },
    headerSmall: {
        paddingHorizontal: Math.min(width * 0.04, 16),
        paddingBottom: Math.min(height * 0.015, 15),
    },
    headerLarge: {
        paddingHorizontal: Math.min(width * 0.06, 24),
        paddingBottom: Math.min(height * 0.025, 25),
    },
    headerTablet: {
        paddingHorizontal: Math.min(width * 0.08, 32),
        paddingBottom: Math.min(height * 0.03, 30),
    },
    headerShort: {
        paddingHorizontal: Math.min(width * 0.035, 14),
        paddingBottom: Math.min(height * 0.01, 10),
    },
    text: {
        fontSize: Math.min(width * 0.065, 30),
        color: 'white',
        fontWeight: '700',
        textAlign: 'center',
        flex: 1,
    },
    textSmall: {
        fontSize: Math.min(width * 0.06, 26),
    },
    textLarge: {
        fontSize: Math.min(width * 0.07, 34),
    },
    textTablet: {
        fontSize: Math.min(width * 0.075, 36),
    },
    textShort: {
        fontSize: Math.min(width * 0.055, 24),
    },
    headerText: {
        color: "white",
        textAlign: "center",
        fontSize: Math.min(width * 0.038, 15),
        marginBottom: Math.min(height * 0.02, 20),
        lineHeight: Math.min(width * 0.048, 22),
    },
    headerTextSmall: {
        fontSize: Math.min(width * 0.036, 14),
        marginBottom: Math.min(height * 0.015, 15),
        lineHeight: Math.min(width * 0.045, 20),
    },
    headerTextLarge: {
        fontSize: Math.min(width * 0.04, 16),
        marginBottom: Math.min(height * 0.025, 25),
        lineHeight: Math.min(width * 0.05, 24),
    },
    headerTextTablet: {
        fontSize: Math.min(width * 0.045, 18),
        marginBottom: Math.min(height * 0.03, 30),
        lineHeight: Math.min(width * 0.055, 26),
    },
    headerTextShort: {
        fontSize: Math.min(width * 0.034, 13),
        marginBottom: Math.min(height * 0.012, 12),
        lineHeight: Math.min(width * 0.042, 18),
    },
    card: {
        backgroundColor: "#04223A",
        borderWidth: 1,
        borderColor: "#FFC107",
        borderRadius: Math.min(width * 0.04, 16),
        marginBottom: Math.min(height * 0.04, 40),
        overflow: 'hidden',
    },
    cardSmall: {
        borderRadius: Math.min(width * 0.035, 14),
        marginBottom: Math.min(height * 0.03, 30),
    },
    cardLarge: {
        borderRadius: Math.min(width * 0.045, 18),
        marginBottom: Math.min(height * 0.05, 50),
    },
    cardTablet: {
        borderRadius: Math.min(width * 0.05, 20),
        marginBottom: Math.min(height * 0.06, 60),
    },
    cardShort: {
        borderRadius: Math.min(width * 0.03, 12),
        marginBottom: Math.min(height * 0.025, 20),
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: Math.min(height * 0.014, 12),
        paddingHorizontal: Math.min(width * 0.04, 16),
        minHeight: Math.min(height * 0.06, 48),
    },
    rowShort: {
        paddingVertical: Math.min(height * 0.012, 10),
        paddingHorizontal: Math.min(width * 0.03, 12),
        minHeight: Math.min(height * 0.055, 44),
    },
    textBox: {
        flex: 1,
        marginRight: Math.min(width * 0.02, 8),
    },
    textBoxShort: {
        marginRight: Math.min(width * 0.015, 6),
    },
    label: {
        color: "#aaa",
        fontSize: Math.min(width * 0.035, 13),
    },
    labelSmall: {
        fontSize: Math.min(width * 0.033, 12),
    },
    labelShort: {
        fontSize: Math.min(width * 0.031, 11),
    },
    value: {
        color: "white",
        fontSize: Math.min(width * 0.04, 15),
        marginTop: Math.min(height * 0.004, 4),
    },
    valueSmall: {
        fontSize: Math.min(width * 0.038, 14),
    },
    valueLarge: {
        fontSize: Math.min(width * 0.042, 16),
    },
    valueShort: {
        fontSize: Math.min(width * 0.036, 13),
    },
    divider: {
        height: 1,
        backgroundColor: "#FFC107",
        opacity: 0.4,
        marginHorizontal: Math.min(width * 0.04, 16),
    },
    dividerShort: {
        marginHorizontal: Math.min(width * 0.03, 12),
    },
    option: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Math.min(height * 0.02, 20),
        paddingVertical: Math.min(height * 0.012, 12),
        minHeight: Math.min(height * 0.06, 48),
    },
    optionSmall: {
        marginBottom: Math.min(height * 0.015, 15),
        paddingVertical: Math.min(height * 0.01, 10),
        minHeight: Math.min(height * 0.055, 44),
    },
    optionLarge: {
        marginBottom: Math.min(height * 0.025, 25),
        paddingVertical: Math.min(height * 0.014, 14),
        minHeight: Math.min(height * 0.065, 52),
    },
    optionShort: {
        marginBottom: Math.min(height * 0.015, 12),
        paddingVertical: Math.min(height * 0.008, 8),
        minHeight: Math.min(height * 0.05, 40),
    },
    optionContent: {
        flex: 1,
        marginRight: Math.min(width * 0.02, 8),
    },
    optionTitle: {
        color: "white",
        fontSize: Math.min(width * 0.04, 15),
        fontWeight: "500",
    },
    optionTitleSmall: {
        fontSize: Math.min(width * 0.038, 14),
    },
    optionTitleLarge: {
        fontSize: Math.min(width * 0.042, 16),
    },
    optionTitleShort: {
        fontSize: Math.min(width * 0.036, 13),
    },
    optionDesc: {
        color: "#aaa",
        fontSize: Math.min(width * 0.035, 13),
        marginTop: Math.min(height * 0.004, 4),
        lineHeight: Math.min(width * 0.042, 18),
    },
    optionDescSmall: {
        fontSize: Math.min(width * 0.033, 12),
        lineHeight: Math.min(width * 0.04, 16),
    },
    optionDescLarge: {
        fontSize: Math.min(width * 0.037, 14),
        lineHeight: Math.min(width * 0.044, 20),
    },
    optionDescShort: {
        fontSize: Math.min(width * 0.031, 11),
        lineHeight: Math.min(width * 0.038, 16),
    },
    inviteButton: {
        backgroundColor: "#FFC107",
        borderRadius: Math.min(width * 0.03, 12),
        paddingVertical: Math.min(height * 0.018, 16),
        alignItems: "center",
        marginTop: Math.min(height * 0.04, 40),
        minHeight: Math.min(height * 0.06, 48),
        justifyContent: 'center',
    },
    inviteButtonSmall: {
        borderRadius: Math.min(width * 0.025, 10),
        paddingVertical: Math.min(height * 0.016, 14),
        marginTop: Math.min(height * 0.03, 30),
        minHeight: Math.min(height * 0.055, 44),
    },
    inviteButtonLarge: {
        borderRadius: Math.min(width * 0.035, 14),
        paddingVertical: Math.min(height * 0.02, 18),
        marginTop: Math.min(height * 0.05, 50),
        minHeight: Math.min(height * 0.065, 52),
    },
    inviteButtonTablet: {
        borderRadius: Math.min(width * 0.04, 16),
        paddingVertical: Math.min(height * 0.022, 20),
        marginTop: Math.min(height * 0.06, 60),
        minHeight: Math.min(height * 0.07, 56),
    },
    inviteButtonShort: {
        borderRadius: Math.min(width * 0.025, 10),
        paddingVertical: Math.min(height * 0.014, 12),
        marginTop: Math.min(height * 0.025, 20),
        minHeight: Math.min(height * 0.05, 40),
    },
    inviteButtonDisabled: {
        opacity: 0.7,
    },
    inviteText: {
        color: "#04223A",
        fontSize: Math.min(width * 0.042, 16),
        fontWeight: "600",
    },
    inviteTextSmall: {
        fontSize: Math.min(width * 0.04, 14),
    },
    inviteTextLarge: {
        fontSize: Math.min(width * 0.044, 18),
    },
    inviteTextShort: {
        fontSize: Math.min(width * 0.038, 13),
    },
    bottomSpacer: {
        height: Math.min(height * 0.03, 24),
    },
    bottomSpacerShort: {
        height: Math.min(height * 0.02, 16),
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'flex-end',
    },
    modalOverlayTablet: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#04223A',
        borderTopLeftRadius: Math.min(width * 0.05, 20),
        borderTopRightRadius: Math.min(width * 0.05, 20),
        borderWidth: 1,
        borderColor: '#FFC107',
        maxHeight: '85%',
        marginTop: Platform.OS === 'ios' ? 40 : 0,
    },
    modalContentSmall: {
        borderTopLeftRadius: Math.min(width * 0.04, 16),
        borderTopRightRadius: Math.min(width * 0.04, 16),
        maxHeight: '90%',
    },
    modalContentLarge: {
        borderTopLeftRadius: Math.min(width * 0.06, 24),
        borderTopRightRadius: Math.min(width * 0.06, 24),
        maxHeight: '80%',
    },
    modalContentTablet: {
        width: '90%',
        maxWidth: 600,
        height: '85%',
        borderRadius: Math.min(width * 0.05, 20),
        marginTop: 0,
    },
    modalContentShort: {
        borderTopLeftRadius: Math.min(width * 0.035, 14),
        borderTopRightRadius: Math.min(width * 0.035, 14),
        maxHeight: '92%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Math.min(width * 0.05, 20),
        borderBottomWidth: 1,
        borderBottomColor: '#FFC107',
    },
    modalHeaderSmall: {
        padding: Math.min(width * 0.04, 16),
    },
    modalHeaderLarge: {
        padding: Math.min(width * 0.06, 24),
    },
    modalHeaderShort: {
        padding: Math.min(width * 0.035, 14),
    },
    modalTitle: {
        color: 'white',
        fontSize: Math.min(width * 0.05, 20),
        fontWeight: '700',
    },
    modalTitleSmall: {
        fontSize: Math.min(width * 0.048, 18),
    },
    modalTitleLarge: {
        fontSize: Math.min(width * 0.052, 22),
    },
    modalTitleShort: {
        fontSize: Math.min(width * 0.045, 16),
    },
    modalBody: {
        flex: 1,
    },
    modalBodyContent: {
        padding: Math.min(width * 0.05, 20),
        paddingBottom: Math.min(height * 0.05, 40),
    },
    modalBodyContentShort: {
        padding: Math.min(width * 0.04, 16),
        paddingBottom: Math.min(height * 0.04, 32),
    },
    // Rewards Modal Styles
    totalRewards: {
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        padding: Math.min(width * 0.05, 20),
        borderRadius: Math.min(width * 0.03, 12),
        alignItems: 'center',
        marginBottom: Math.min(height * 0.02, 20),
        borderWidth: 1,
        borderColor: '#FFC107',
    },
    totalRewardsSmall: {
        padding: Math.min(width * 0.04, 16),
        borderRadius: Math.min(width * 0.025, 10),
        marginBottom: Math.min(height * 0.015, 15),
    },
    totalRewardsLarge: {
        padding: Math.min(width * 0.06, 24),
        borderRadius: Math.min(width * 0.035, 14),
        marginBottom: Math.min(height * 0.025, 25),
    },
    totalRewardsShort: {
        padding: Math.min(width * 0.035, 14),
        borderRadius: Math.min(width * 0.02, 8),
        marginBottom: Math.min(height * 0.012, 12),
    },
    totalRewardsText: {
        color: '#FFC107',
        fontSize: Math.min(width * 0.042, 16),
        fontWeight: '600',
    },
    totalRewardsTextSmall: {
        fontSize: Math.min(width * 0.04, 14),
    },
    totalRewardsTextLarge: {
        fontSize: Math.min(width * 0.044, 18),
    },
    totalRewardsTextShort: {
        fontSize: Math.min(width * 0.038, 13),
    },
    totalRewardsPoints: {
        color: 'white',
        fontSize: Math.min(width * 0.06, 24),
        fontWeight: '700',
        marginTop: Math.min(height * 0.005, 5),
    },
    totalRewardsPointsSmall: {
        fontSize: Math.min(width * 0.055, 20),
    },
    totalRewardsPointsLarge: {
        fontSize: Math.min(width * 0.065, 28),
    },
    totalRewardsPointsShort: {
        fontSize: Math.min(width * 0.05, 18),
    },
    rewardItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: Math.min(width * 0.04, 16),
        borderRadius: Math.min(width * 0.03, 12),
        marginBottom: Math.min(height * 0.015, 12),
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
    },
    rewardItemSmall: {
        padding: Math.min(width * 0.035, 14),
        borderRadius: Math.min(width * 0.025, 10),
        marginBottom: Math.min(height * 0.012, 10),
    },
    rewardItemLarge: {
        padding: Math.min(width * 0.045, 18),
        borderRadius: Math.min(width * 0.035, 14),
        marginBottom: Math.min(height * 0.018, 14),
    },
    rewardItemShort: {
        padding: Math.min(width * 0.03, 12),
        borderRadius: Math.min(width * 0.02, 8),
        marginBottom: Math.min(height * 0.01, 8),
    },
    rewardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Math.min(height * 0.008, 8),
    },
    rewardTitle: {
        color: 'white',
        fontSize: Math.min(width * 0.042, 16),
        fontWeight: '600',
        flex: 1,
        marginRight: Math.min(width * 0.02, 8),
    },
    rewardTitleSmall: {
        fontSize: Math.min(width * 0.04, 14),
    },
    rewardTitleLarge: {
        fontSize: Math.min(width * 0.044, 18),
    },
    rewardTitleShort: {
        fontSize: Math.min(width * 0.038, 13),
    },
    statusBadge: {
        paddingHorizontal: Math.min(width * 0.025, 8),
        paddingVertical: Math.min(height * 0.005, 4),
        borderRadius: Math.min(width * 0.015, 6),
    },
    statusBadgeSmall: {
        paddingHorizontal: Math.min(width * 0.02, 6),
        paddingVertical: Math.min(height * 0.004, 3),
        borderRadius: Math.min(width * 0.012, 5),
    },
    statusBadgeShort: {
        paddingHorizontal: Math.min(width * 0.018, 5),
        paddingVertical: Math.min(height * 0.003, 2),
        borderRadius: Math.min(width * 0.01, 4),
    },
    statusCompleted: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
    },
    statusPending: {
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
    },
    statusText: {
        color: 'white',
        fontSize: Math.min(width * 0.035, 12),
        fontWeight: '600',
    },
    statusTextSmall: {
        fontSize: Math.min(width * 0.033, 11),
    },
    statusTextShort: {
        fontSize: Math.min(width * 0.031, 10),
    },
    rewardDescription: {
        color: '#ccc',
        fontSize: Math.min(width * 0.038, 14),
        lineHeight: Math.min(width * 0.048, 18),
        marginBottom: Math.min(height * 0.008, 8),
    },
    rewardDescriptionSmall: {
        fontSize: Math.min(width * 0.036, 13),
        lineHeight: Math.min(width * 0.045, 16),
    },
    rewardDescriptionLarge: {
        fontSize: Math.min(width * 0.04, 16),
        lineHeight: Math.min(width * 0.05, 20),
    },
    rewardDescriptionShort: {
        fontSize: Math.min(width * 0.034, 12),
        lineHeight: Math.min(width * 0.042, 16),
    },
    rewardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rewardDate: {
        color: '#888',
        fontSize: Math.min(width * 0.035, 12),
    },
    rewardDateSmall: {
        fontSize: Math.min(width * 0.033, 11),
    },
    rewardDateShort: {
        fontSize: Math.min(width * 0.031, 10),
    },
    rewardPoints: {
        color: '#FFC107',
        fontSize: Math.min(width * 0.042, 16),
        fontWeight: '700',
    },
    rewardPointsSmall: {
        fontSize: Math.min(width * 0.04, 14),
    },
    rewardPointsLarge: {
        fontSize: Math.min(width * 0.044, 18),
    },
    rewardPointsShort: {
        fontSize: Math.min(width * 0.038, 13),
    },
    // How It Works Modal Styles
    stepItem: {
        flexDirection: 'row',
        marginBottom: Math.min(height * 0.02, 20),
    },
    stepItemSmall: {
        marginBottom: Math.min(height * 0.015, 15),
    },
    stepItemLarge: {
        marginBottom: Math.min(height * 0.025, 25),
    },
    stepItemShort: {
        marginBottom: Math.min(height * 0.012, 12),
    },
    stepNumber: {
        width: Math.min(width * 0.08, 32),
        height: Math.min(width * 0.08, 32),
        borderRadius: Math.min(width * 0.04, 16),
        backgroundColor: '#FFC107',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Math.min(width * 0.04, 15),
    },
    stepNumberSmall: {
        width: Math.min(width * 0.07, 28),
        height: Math.min(width * 0.07, 28),
        borderRadius: Math.min(width * 0.035, 14),
        marginRight: Math.min(width * 0.035, 12),
    },
    stepNumberLarge: {
        width: Math.min(width * 0.09, 36),
        height: Math.min(width * 0.09, 36),
        borderRadius: Math.min(width * 0.045, 18),
        marginRight: Math.min(width * 0.045, 18),
    },
    stepNumberShort: {
        width: Math.min(width * 0.065, 26),
        height: Math.min(width * 0.065, 26),
        borderRadius: Math.min(width * 0.0325, 13),
        marginRight: Math.min(width * 0.03, 10),
    },
    stepNumberText: {
        color: '#000',
        fontSize: Math.min(width * 0.042, 16),
        fontWeight: '700',
    },
    stepNumberTextSmall: {
        fontSize: Math.min(width * 0.04, 14),
    },
    stepNumberTextLarge: {
        fontSize: Math.min(width * 0.044, 18),
    },
    stepNumberTextShort: {
        fontSize: Math.min(width * 0.038, 13),
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        color: 'white',
        fontSize: Math.min(width * 0.042, 16),
        fontWeight: '600',
        marginBottom: Math.min(height * 0.005, 4),
    },
    stepTitleSmall: {
        fontSize: Math.min(width * 0.04, 14),
    },
    stepTitleLarge: {
        fontSize: Math.min(width * 0.044, 18),
    },
    stepTitleShort: {
        fontSize: Math.min(width * 0.038, 13),
    },
    stepDescription: {
        color: '#ccc',
        fontSize: Math.min(width * 0.038, 14),
        lineHeight: Math.min(width * 0.048, 20),
    },
    stepDescriptionSmall: {
        fontSize: Math.min(width * 0.036, 13),
        lineHeight: Math.min(width * 0.045, 18),
    },
    stepDescriptionLarge: {
        fontSize: Math.min(width * 0.04, 16),
        lineHeight: Math.min(width * 0.05, 22),
    },
    stepDescriptionShort: {
        fontSize: Math.min(width * 0.034, 12),
        lineHeight: Math.min(width * 0.042, 16),
    },
    termsSection: {
        marginTop: Math.min(height * 0.02, 20),
        padding: Math.min(width * 0.04, 16),
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: Math.min(width * 0.03, 12),
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
    },
    termsSectionSmall: {
        marginTop: Math.min(height * 0.015, 15),
        padding: Math.min(width * 0.035, 14),
        borderRadius: Math.min(width * 0.025, 10),
    },
    termsSectionLarge: {
        marginTop: Math.min(height * 0.025, 25),
        padding: Math.min(width * 0.045, 18),
        borderRadius: Math.min(width * 0.035, 14),
    },
    termsSectionShort: {
        marginTop: Math.min(height * 0.012, 12),
        padding: Math.min(width * 0.03, 12),
        borderRadius: Math.min(width * 0.02, 8),
    },
    termsTitle: {
        color: '#FFC107',
        fontSize: Math.min(width * 0.042, 16),
        fontWeight: '600',
        marginBottom: Math.min(height * 0.008, 8),
    },
    termsTitleSmall: {
        fontSize: Math.min(width * 0.04, 14),
    },
    termsTitleLarge: {
        fontSize: Math.min(width * 0.044, 18),
    },
    termsTitleShort: {
        fontSize: Math.min(width * 0.038, 13),
    },
    termsText: {
        color: '#ccc',
        fontSize: Math.min(width * 0.038, 14),
        lineHeight: Math.min(width * 0.048, 20),
    },
    termsTextSmall: {
        fontSize: Math.min(width * 0.036, 13),
        lineHeight: Math.min(width * 0.045, 18),
    },
    termsTextLarge: {
        fontSize: Math.min(width * 0.04, 16),
        lineHeight: Math.min(width * 0.05, 22),
    },
    termsTextShort: {
        fontSize: Math.min(width * 0.034, 12),
        lineHeight: Math.min(width * 0.042, 16),
    },
    // Invite Modal Styles
    inviteContent: {
        alignItems: 'center',
        paddingVertical: Math.min(height * 0.02, 20),
    },
    inviteContentShort: {
        paddingVertical: Math.min(height * 0.015, 15),
    },
    inviteIcon: {
        marginBottom: Math.min(height * 0.02, 20),
    },
    inviteIconShort: {
        marginBottom: Math.min(height * 0.015, 15),
    },
    inviteMessage: {
        color: 'white',
        fontSize: Math.min(width * 0.045, 18),
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: Math.min(height * 0.02, 20),
        lineHeight: Math.min(width * 0.055, 24),
    },
    inviteMessageSmall: {
        fontSize: Math.min(width * 0.042, 16),
        marginBottom: Math.min(height * 0.015, 15),
        lineHeight: Math.min(width * 0.05, 22),
    },
    inviteMessageLarge: {
        fontSize: Math.min(width * 0.048, 20),
        marginBottom: Math.min(height * 0.025, 25),
        lineHeight: Math.min(width * 0.058, 26),
    },
    inviteMessageShort: {
        fontSize: Math.min(width * 0.04, 14),
        marginBottom: Math.min(height * 0.012, 12),
        lineHeight: Math.min(width * 0.048, 20),
    },
    referralLinkContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: Math.min(width * 0.03, 12),
        padding: Math.min(width * 0.04, 16),
        marginBottom: Math.min(height * 0.02, 20),
        alignItems: 'center',
        width: '100%',
    },
    referralLinkContainerSmall: {
        borderRadius: Math.min(width * 0.025, 10),
        padding: Math.min(width * 0.035, 14),
        marginBottom: Math.min(height * 0.015, 15),
    },
    referralLinkContainerLarge: {
        borderRadius: Math.min(width * 0.035, 14),
        padding: Math.min(width * 0.045, 18),
        marginBottom: Math.min(height * 0.025, 25),
    },
    referralLinkContainerShort: {
        borderRadius: Math.min(width * 0.02, 8),
        padding: Math.min(width * 0.03, 12),
        marginBottom: Math.min(height * 0.012, 12),
    },
    referralLinkText: {
        color: 'white',
        fontSize: Math.min(width * 0.038, 14),
        flex: 1,
    },
    referralLinkTextSmall: {
        fontSize: Math.min(width * 0.036, 13),
    },
    referralLinkTextShort: {
        fontSize: Math.min(width * 0.034, 12),
    },
    copyButton: {
        backgroundColor: '#FFC107',
        padding: Math.min(width * 0.025, 8),
        borderRadius: Math.min(width * 0.015, 6),
        marginLeft: Math.min(width * 0.02, 10),
    },
    copyButtonSmall: {
        padding: Math.min(width * 0.02, 6),
        borderRadius: Math.min(width * 0.012, 5),
        marginLeft: Math.min(width * 0.015, 8),
    },
    copyButtonShort: {
        padding: Math.min(width * 0.018, 5),
        borderRadius: Math.min(width * 0.01, 4),
        marginLeft: Math.min(width * 0.012, 6),
    },
    shareText: {
        color: '#FFC107',
        fontSize: Math.min(width * 0.042, 16),
        fontWeight: '600',
        marginBottom: Math.min(height * 0.015, 15),
        alignSelf: 'flex-start',
    },
    shareTextSmall: {
        fontSize: Math.min(width * 0.04, 14),
        marginBottom: Math.min(height * 0.012, 12),
    },
    shareTextLarge: {
        fontSize: Math.min(width * 0.044, 18),
        marginBottom: Math.min(height * 0.018, 18),
    },
    shareTextShort: {
        fontSize: Math.min(width * 0.038, 13),
        marginBottom: Math.min(height * 0.01, 10),
    },
    shareButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: Math.min(height * 0.02, 20),
    },
    shareButtonsShort: {
        marginBottom: Math.min(height * 0.015, 15),
    },
    shareButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
        padding: Math.min(height * 0.015, 15),
        borderRadius: Math.min(width * 0.03, 12),
        alignItems: 'center',
        marginHorizontal: Math.min(width * 0.01, 5),
        borderWidth: 1,
        borderColor: '#FFC107',
        minHeight: Math.min(height * 0.08, 64),
    },
    shareButtonSmall: {
        padding: Math.min(height * 0.012, 12),
        borderRadius: Math.min(width * 0.025, 10),
        marginHorizontal: Math.min(width * 0.008, 4),
        minHeight: Math.min(height * 0.07, 56),
    },
    shareButtonLarge: {
        padding: Math.min(height * 0.018, 18),
        borderRadius: Math.min(width * 0.035, 14),
        marginHorizontal: Math.min(width * 0.012, 6),
        minHeight: Math.min(height * 0.09, 72),
    },
    shareButtonShort: {
        padding: Math.min(height * 0.01, 10),
        borderRadius: Math.min(width * 0.02, 8),
        marginHorizontal: Math.min(width * 0.006, 3),
        minHeight: Math.min(height * 0.06, 48),
    },
    shareButtonText: {
        color: 'white',
        fontSize: Math.min(width * 0.035, 12),
        marginTop: Math.min(height * 0.005, 5),
        fontWeight: '500',
    },
    shareButtonTextSmall: {
        fontSize: Math.min(width * 0.033, 11),
    },
    shareButtonTextShort: {
        fontSize: Math.min(width * 0.031, 10),
    },
    otherShareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        paddingVertical: Math.min(height * 0.012, 12),
        paddingHorizontal: Math.min(width * 0.04, 16),
        borderRadius: Math.min(width * 0.025, 10),
        borderWidth: 1,
        borderColor: '#FFC107',
        marginTop: Math.min(height * 0.01, 10),
    },
    otherShareButtonSmall: {
        paddingVertical: Math.min(height * 0.01, 10),
        paddingHorizontal: Math.min(width * 0.035, 14),
        borderRadius: Math.min(width * 0.02, 8),
    },
    otherShareButtonLarge: {
        paddingVertical: Math.min(height * 0.014, 14),
        paddingHorizontal: Math.min(width * 0.045, 18),
        borderRadius: Math.min(width * 0.03, 12),
    },
    otherShareButtonShort: {
        paddingVertical: Math.min(height * 0.008, 8),
        paddingHorizontal: Math.min(width * 0.03, 12),
        borderRadius: Math.min(width * 0.018, 6),
    },
    otherShareText: {
        color: '#FFC107',
        fontSize: Math.min(width * 0.038, 14),
        fontWeight: '600',
        marginLeft: Math.min(width * 0.02, 8),
    },
    otherShareTextSmall: {
        fontSize: Math.min(width * 0.036, 13),
        marginLeft: Math.min(width * 0.015, 6),
    },
    otherShareTextShort: {
        fontSize: Math.min(width * 0.034, 12),
        marginLeft: Math.min(width * 0.01, 4),
    },
});