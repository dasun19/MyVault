import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image,} from 'react-native';
import { SafeAreaView} from 'react-native-safe-area-context';


const LanguageScreen = () => {
       const [selectedLanguage, setSelectedLanguage] = useState('English');
       
       const handleLanguageSelect = () => {
        // Later should navigate to the next screen
        console.log('Selected language:', selectedLanguage);
       };

       return (
            <SafeAreaView style={styles.container}>
              <View style={styles.content}>
                {/*app icon*/}
                <View style={styles.iconContainer}>
                    <View style={styles.icon}>
                        <View style = {styles.document}/>
                    </View>
                </View>


                {/*welcome text*/}
                <Text style = {styles.welcomeTitle}>Welcome to MyVault</Text>
                <Text style = {styles.subtitle}>Digital identity and document verification solution</Text>

                {/*language selection*/}
                <View style = {styles.languageSection}>

                <Text style = {styles.languageTitle}>Select a language</Text>

                <TouchableOpacity style = {styles.languageButton}
                onPress = {handleLanguageSelect}>
                    <Text style = {styles.languageText}>English</Text>
                </TouchableOpacity>
                </View>

                </View>      
            </SafeAreaView>

       );

};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },

    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },

    iconContainer: {
        marginBottom: 40,
    },

    icon: {
        width: 80,
        height: 80,
        backgroundColor: '#4A90E2',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    document: {
        width: 40,
        height: 48,
        backgroundColor: '#ffffff',
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#666666',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 80,
    },
    languageSection: {
        width: '100%',
        alignItems: 'center',
    },
    languageTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333333',
        marginBottom: 20,
    },
    languageButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 8,
        minWidth: 120,
    },
    languageText: {
        fontSize: 16,
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default LanguageScreen;