import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Image, 
    Modal,
    Alert,
    ScrollView,
    Platform,
    PermissionsAndroid,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ManualIDEntryForm from '../components/ManualIDEntryForm';
import VirtualIDCard from '../components/VirtualIDCard';
import IDCardOptionsMenu from '../components/IDCardOptionsMenu';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import CheckBox from '@react-native-community/checkbox';
import { Picker } from '@react-native-picker/picker';
import { createSecureToken } from '../utils/jwtUtils';

type DocumentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Document'>;

type Props = {
    navigation: DocumentScreenNavigationProp;
}

// Interface for stored ID card data
interface IDCardData {
    id: string;
    idNumber: string;
    fullName: string;
    dateOfBirth: string;
    issuedDate: string;
    hash: string;
    createdAt: string;
    updatedAt: string;
    isVerified?: boolean;
}

const DocumentScreen: React.FC<Props> = ({ navigation }) => {
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [showEditModel, setShowEditModel] = useState(false);
    const [showShareModal, setShowShareModel] = useState(false);
    const [savedIDCard, setSavedIDCard] = useState<IDCardData | null>(null);
    const [selectedFields, setSelectedFields] = useState({
        fullName: true,
        idNumber: true,
        dateOfBirth: true,
        issuedDate: true,
        hash: false,
    });
    const [expirationOption, setExpirationOption] = useState('No Expiration');
    const [qrValue, setQrValue] = useState<string | null>(null);
    const viewShotRef = useRef<ViewShot>(null);

    // Storage keys - singleID card storage
    const ID_CARD_STORAGE_KEY = 'single_digital_id';
    
    // Load saved documents when component mounts
    useEffect(() => {
        loadSavedDocuments();
    }, []);

    // Function to load saved ID card from AsyncStorage
   const loadSavedDocuments = async () => {
  try {
    const savedIDData = await AsyncStorage.getItem(ID_CARD_STORAGE_KEY);
    const parsedID: IDCardData | null = savedIDData ? JSON.parse(savedIDData) : null;
    setSavedIDCard(parsedID);
    console.log('Loaded ID card:', parsedID ? 'Found' : 'None');
  } catch (error) {
    console.error('Error loading documents:', error);
    Alert.alert('Error', 'Failed to load saved ID card. Please try again.');
    setSavedIDCard(null); // Fallback to no ID
  }
};

    // Handle manual entry from close - refresh data when from closes
    const handleManualEntryClose = () => {
        setShowManualEntry(false);
        loadSavedDocuments(); // Refresh the list after adding new ID
    };

    // Handle card deletion
    const handleDeleteCard = () => {
        Alert.alert(
            'Delete ID Card',
            'Are you sure you want to delete the ID card? This action cannot be undone.',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: deleteIDCard
                }
            ]
        );
    };

    // Delete Id card from storage
    const deleteIDCard = async () => {
  try {
    await AsyncStorage.removeItem(ID_CARD_STORAGE_KEY);
    setSavedIDCard(null);
    setShowOptionsMenu(false);
    Alert.alert('Success', 'ID card deleted successfully!');
  } catch (error) {
    console.error('Delete error:', error);
    Alert.alert('Error', 'Failed to delete ID card.');
  }
};

   // Handle edit ID card
   const handleEditCard = () => {
        setShowOptionsMenu(false);
        setShowEditModel(true);
   };

//    //Generate QR code with selected fields and expiration
//    const handleGenerateQR = () => {
//     if (!savedIDCard) return;

//     // Create data object with selected fields
//     const data: Partial<IDCardData> = {};
//     for (const key in selectedFields){
//         if(selectedFields[key as keyof typeof selectedFields]){
//             data[key as keyof IDCardData] = savedIDCard[key as keyof IDCardData];
//         }
//     }

//     // Set expiration timestamp (in milliseconds)
//     let expires: number | null = null;
//     if (expirationOption !== 'No Expiration'){
//         const now = Date.now();
//         if (expirationOption === '1 Hour') expires = now + 3600000;
//         else if (expirationOption === '1 Day') expires = now + 86400000;
//         else if (expirationOption === '1 Week') expires = now + 604800000;
//         }

//         // Create QR code data as JSON
//         const qrData = JSON.stringify({data, expires});
//         setQrValue(qrData);
//    };

   // Replace your current handleGenerateQR function with this updated version
const handleGenerateQR = async () => {
  if (!savedIDCard) return;

  const data: Partial<IDCardData> = {};
  for (const key in selectedFields) {
    if (selectedFields[key as keyof typeof selectedFields]) {
      data[key as keyof IDCardData] = savedIDCard[key as keyof IDCardData];
    }
  }

  try {
    const secureToken = await createSecureToken(data, expirationOption);
    const baseUrl = 'https://your-verification-site.com/verify'; // Replace if needed
    const verificationUrl = `${baseUrl}?token=${encodeURIComponent(secureToken)}`;
    setQrValue(verificationUrl);
    console.log('Generated QR Value (URL with JWT):', verificationUrl);  // Debug: Check console
  } catch (error) {
    console.error('QR Generation Error:', error);
    Alert.alert('Error', 'Failed to generate QR code.');
  }
};

// Display token info
const getTokenDisplayInfo = () => {
    if (!qrValue) return null;
    
    try {
        const tokenParts = qrValue.split('.');
        const header = JSON.parse(atob(tokenParts[0]));
        const payload = JSON.parse(atob(tokenParts[1]));
        
        return {
            algorithm: header.alg,
            expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
            issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
            issuer: payload.iss
        };
    } catch (error) {
        return null;
    }
};

   // Request storage permission for Android
    const requestStoragePermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Storage Permission',
                        message: 'App needs access to storage to save QR code.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (error) {
                console.error('Permission error:', error);
                return false;
            }
        }
        return true;
    };

    // Share QR code via device share options
    const handleShareQR = async () => {
        if (!viewShotRef.current || !qrValue) return;

        try {
            const uri = await viewShotRef.current.capture();
            await Share.open({ url: `file://${uri}` });
        } catch (error) {
            console.error('Share error:', error);
            Alert.alert('Error', 'Failed to share QR code.');
        }
    };

    // Save QR code to gallery
    const handleSaveQR = async () => {
        if (!viewShotRef.current || !qrValue) return;

        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Cannot save without storage permission.');
            return;
        }

        try {
            const uri = await viewShotRef.current.capture();
            await CameraRoll.save(uri, { type: 'photo' });
            Alert.alert('Success', 'QR code saved to gallery!');
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save QR code.');
        }
    };




   // Handle verify ID card (placeholder for future implementation)
   const handleVerifyCard = async () => {
        setShowOptionsMenu(false);

        // For now, just toggle verification status as a demo
        if (savedIDCard) {
            try {
                const updateCard = {
                    ...savedIDCard,
                    isVerified: !savedIDCard.isVerified,
                    updatedAt: new Date().toISOString()
                };

                await AsyncStorage.setItem(ID_CARD_STORAGE_KEY, JSON.stringify(updateCard));
                setSavedIDCard(updateCard);

                Alert.alert(
                    'Verification Status Updated',
                    updateCard.isVerified
                    ? 'ID card marked as verified!'
                    : 'ID card verification removed.',
                    [{ text: 'OK' }]
                );
            } catch (error){
                console.error('Verification update error:', error);
                Alert.alert('Error', 'Failed to update verification status.')
            }
        }
   };

    // Render add ID card section when no ID exists
   const renderAddIDSection = () => (
        <View style={styles.addIdContainer}>
            
            <View style={styles.addIdCard}>
                <View style={styles.emptyStateIcon}>
                    <Text style={styles.emptyIconText}>+</Text>
                </View>
                <Text style={styles.addIdTitle}>Add Your National ID</Text>
                <Text style={styles.addIdSubtitle}>
                    Securely store your Sri Lankan National Identity Card
                </Text>
                <TouchableOpacity 
                    style={styles.addIdButton}
                    onPress={() => setShowManualEntry(true)}
                >
                    <Text style={styles.addIdButtonText}>Add ID Card</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Render virtual ID card section when ID exists
    const renderVirtualIDSection = () => (
        <View style={styles.virtualIdContainer}>
            <View style={styles.virtualIdHeader}>
                <Text style={styles.virtualIdTitle}>National Identity Card</Text>
                <TouchableOpacity 
                    style={styles.optionsButton}
                    onPress={() => setShowOptionsMenu(true)}
                >
                    <Text style={styles.optionsIcon}>⋯</Text>
                </TouchableOpacity>
            </View>
            {/* Virtual ID Card Display */}
            <VirtualIDCard 
                cardData={savedIDCard!}
                showQRCode={false}
            />
            {/* Verification Status 
            {savedIDCard?.isVerified && (
                <View style={styles.verificationBadge}>
                    <Text style={styles.verificationText}>✓ Verified</Text>
                </View>
            )}
            */}
            {/* Only show Verify button if not verified */}
            <View style={styles.actionButtons}>
                {!savedIDCard?.isVerified && (
                    <TouchableOpacity 
                        style={styles.verifyButton}
                        onPress={handleVerifyCard}
                    >
                        <Text style={styles.buttonText}>Verify</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={() => setShowShareModel(true)}
                >
                    <Text style={styles.buttonText}>Share</Text>
                </TouchableOpacity>
            </View>
             {/* Separator line */}
            <View style={styles.menuSeparator} />
        </View>
    );

    

   return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.logoContainer}>
                <View style={styles.logoContent}>
                    <Image
                        source={require('../assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode='contain'
                    />
                    <Text style={styles.myvaultTitle}>MyVault</Text>
                </View>
            </View>

            {/* Main Content */}
            <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
                
                {/* ID Card Section */}
                <View style={styles.idCardSection}>
                    
                    
                    {/* Show either add ID or virtual ID based on whether card exists */}
                    {savedIDCard ? renderVirtualIDSection() : renderAddIDSection()}
                </View>

               
                
            </ScrollView>

            {/* Manual ID Entry Modal */}
            <Modal
                visible={showManualEntry}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={handleManualEntryClose}
                        >
                            <Text style={styles.closeButtonText}>✕ Close</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}></Text>
                        <View style={styles.placeholder} />
                    </View>
                    
                    <ManualIDEntryForm 
                        onClose={handleManualEntryClose}
                        storageKey={ID_CARD_STORAGE_KEY}
                        restrictToSingle={true} // New prop to restrict to single ID
                    />
                </View>
            </Modal>

            {/* Edit ID Modal */}
            <Modal
                visible={showEditModel}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={() => setShowEditModel(false)}
                        >
                            <Text style={styles.closeButtonText}>✕ Close</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Edit ID Card</Text>
                        <View style={styles.placeholder} />
                    </View>
                    
                    <ManualIDEntryForm 
                        onClose={() => {
                            setShowEditModel(false);
                            loadSavedDocuments();
                        }}
                        storageKey={ID_CARD_STORAGE_KEY}
                        restrictToSingle={true}
                        editingCard={savedIDCard} // Pass existing card data for editing
                    />
                </View>
            </Modal>

            {/* Options Menu Modal */}
            <IDCardOptionsMenu
                visible={showOptionsMenu}
                onClose={() => setShowOptionsMenu(false)}
                onEdit={handleEditCard}
                onDelete={handleDeleteCard}
                cardData={savedIDCard}
            />

             {/* Share modal */}
            <Modal
                visible={showShareModal}
                animationType="fade"
                transparent={true}
            >
                <View style={styles.shareModalOverlay}>
                    <View style={styles.shareModalContainer}>
                        <Text style={styles.shareTitle}>Share ID Data</Text>
                        
                        <Text style={styles.sectionLabel}>Select fields to share:</Text>
                        {['fullName', 'idNumber', 'dateOfBirth', 'issuedDate', 'hash'].map((field) => (
                            <View key={field} style={styles.checkboxRow}>
                                <CheckBox
                                    value={selectedFields[field as keyof typeof selectedFields]}
                                    onValueChange={(newValue) => 
                                        setSelectedFields({...selectedFields, [field]: newValue})
                                    }
                                />
                                <Text style={styles.checkboxLabel}>
                                    {field === 'fullName' ? 'Full Name' :
                                     field === 'idNumber' ? 'ID Number' :
                                     field === 'dateOfBirth' ? 'Date of Birth' :
                                     field === 'issuedDate' ? 'Issued Date' : 'Security Hash'}
                                </Text>
                            </View>
                        ))}

                        <Text style={styles.sectionLabel}>Set Expiration:</Text>
                        <Picker
                            selectedValue={expirationOption}
                            onValueChange={(itemValue) => setExpirationOption(itemValue)}
                            style={styles.picker}
                        >
                            <Picker.Item label="No Expiration" value="No Expiration" />
                            <Picker.Item label="1 Hour" value="1 Hour" />
                            <Picker.Item label="1 Day" value="1 Day" />
                            <Picker.Item label="1 Week" value="1 Week" />
                        </Picker>

                        {!qrValue && (
                        <View>
                        <TouchableOpacity 
                            style={styles.generateButton}
                            onPress={handleGenerateQR}
                        >
                            <Text style={styles.buttonText}>Generate QR Code</Text>
                        </TouchableOpacity>

                        
                        
                        
                        <TouchableOpacity 
                            style={styles.closeShareButton}
                            onPress={() => {
                                setShowShareModel(false);
                                setQrValue(null);
                            }}
                        >
                            <Text style={styles.buttonText}>Close</Text>
                        </TouchableOpacity>
                        </View>)}

                      
{qrValue && (
  <ScrollView style={styles.qrContainer}>
    <ViewShot 
      ref={viewShotRef} 
      options={{ format: 'png', quality: 1 }}
      style={styles.qrViewShot}
    >
      <View style={styles.qrCodeWrapper}>
        <QRCode 
          value={qrValue} 
          size={200} 
          logo={require('../assets/images/logo.png')}
          logoSize={30}
          logoBackgroundColor="transparent"
        />
        <Text style={styles.qrSecurityLabel}>🔒 Secure Verification URL</Text>
        <Text style={styles.qrExpiryInfo}>
          {expirationOption === 'No Expiration' 
            ? 'No Expiration' 
            : `Expires in ${expirationOption}`
          }
        </Text>
      </View>
    </ViewShot>

    {/* URL Information Display */}
    <View style={styles.urlDisplayContainer}>
      <Text style={styles.urlDisplayTitle}>Generated Verification URL:</Text>
      <Text style={styles.urlDisplayText} numberOfLines={3} ellipsizeMode="middle">
        {qrValue}
      </Text>
      <Text style={styles.urlDisplayNote}>
        • This URL contains your JWT token as a parameter{'\n'}
        • Recipients can verify your ID by visiting this URL{'\n'}
        • The URL can also be scanned from the app's verifier
      </Text>
    </View>

    {/* Token Information Display */}
    <View style={styles.tokenInfoContainer}>
      <Text style={styles.tokenInfoTitle}>Token Information:</Text>
      <Text style={styles.tokenInfoText}>
        • Digitally signed with secure algorithm
      </Text>
      <Text style={styles.tokenInfoText}>
        • Contains only selected data fields
      </Text>
      <Text style={styles.tokenInfoText}>
        • {expirationOption === 'No Expiration' 
            ? 'No expiration set' 
            : `Expires in ${expirationOption}`
          }
      </Text>
      <Text style={styles.tokenInfoText}>
        • Packaged as a verification URL for easy sharing
      </Text>
    </View>

    <View style={styles.qrShareButtons}>
      <TouchableOpacity 
        style={styles.shareQrButton}
        onPress={handleShareQR}
      >
        <Text style={styles.buttonText}>Share QR Code</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.saveQrButton}
        onPress={handleSaveQR}
      >
        <Text style={styles.buttonText}>Save to Gallery</Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity 
      style={styles.cancelButton}
      onPress={() => {
        setShowShareModel(false);
        setQrValue(null);
      }}
    >
      <Text style={styles.buttonText}>Cancel</Text>
    </TouchableOpacity>
  </ScrollView>

)}

                      
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    logoContainer: {
        height: 120,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    logoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 30,
    },
    logo: {
        width: 60,
        height: 60,
        marginRight: 15,
    },
    myvaultTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    mainContent: {
        flex: 1,
        padding: 20,
    },
    idCardSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    addIdContainer: {
        alignItems: 'center',
    },
    addIdCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 2,
        borderColor: '#e0e7ff',
        borderStyle: 'dashed',
    },
    emptyStateIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f8ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
    },
    emptyIconText: {
        fontSize: 36,
        color: '#007AFF',
        fontWeight: '300',
    },
    addIdTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    addIdSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    addIdButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 10,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addIdButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    virtualIdContainer: {
        position: 'relative',
    },
    virtualIdHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    virtualIdTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    optionsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    optionsIcon: {
        fontSize: 20,
        color: '#666',
        fontWeight: 'bold',
        transform: [{ rotate: '90deg' }], // Rotate to make vertical dots
    },
    verificationBadge: {
        backgroundColor: '#34c759',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignSelf: 'center',
        marginTop: 16,
    },
    verificationText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    comingSoonSection: {
        marginTop: 20,
    },
    documentCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    disabledCard: {
        opacity: 0.6,
        backgroundColor: '#f5f5f5',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardIcon: {
        fontSize: 32,
    },
    cardBadge: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 24,
        alignItems: 'center',
    },
    comingSoonBadge: {
        backgroundColor: '#ff9500',
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    closeButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    closeButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    placeholder: {
        width: 80,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    verifyButton: {
        backgroundColor: '#898cecff',
        padding: 12,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    shareButton: {
        backgroundColor: '#898cecff',
        padding: 12,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
        
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    shareModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareModalContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        width: '90%',
        maxHeight: '100%',
    },
    shareTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    checkboxLabel: {
        marginLeft: 8,
        fontSize: 16,
    },
    picker: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    generateButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    qrContainer: {
        // alignItems: 'center',
        marginTop: 16,
    },
    qrViewShot: {
        backgroundColor: 'white',
        padding: 10,
    },
    shareQrButton: {
        backgroundColor: '#5294dbff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    saveQrButton: {
        backgroundColor: '#5294dbff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    closeShareButton: {
        backgroundColor: '#c5c1c1ff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    menuSeparator: {
    height: 2,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
    marginHorizontal: 2,
  },
  qrShareButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap:20,
  },
  cancelButton: {
     backgroundColor: '#5294dbff',
     padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    minWidth: 100,
  },

qrCodeWrapper: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
},
qrSecurityLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#34c759',
    textAlign: 'center',
},
qrExpiryInfo: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
},
tokenInfoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
},
tokenInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
},
tokenInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
},
urlDisplayContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  urlDisplayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  urlDisplayText: {
    fontSize: 12,
    color: '#007AFF',
    fontFamily: 'monospace',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  urlDisplayNote: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  
});

export default DocumentScreen;