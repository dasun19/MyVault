import React, { useState } from 'react';
import {View, Text, TextInput, Alert,TouchableOpacity, StyleSheet, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {RootStackParamList} from '../../App';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ReactNativeBiometrics from "react-native-biometrics";

type SigninScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signin'>;

type Props = {
    navigation: SigninScreenNavigationProp;
}

const SigninScreen: React.FC<Props> = ({navigation}) => {

    const [pin, setPin] = useState<string>("");
    const [showPinField, setShowPinField] = useState<boolean>(false);

    const handleBiometricLogin = async () => {
        const rnBiometrics = new ReactNativeBiometrics();
        try {
            const { success } = await rnBiometrics.simplePrompt({
                promptMessage: "Login with Biometrics",
            });

            if (success){
                //Alert.alert("Login Success", "Biometric Verified");
               navigation.navigate("Language");
            }else {
                Alert.alert("Biometric Faild", "Try PIN instead");
            }
        } catch(error){
            Alert.alert("Biometric Error", "Biometrics not available this device");
        }
    };

    const handlePinLoginPress = () =>{
        //Show PIN input field when pressing "Login with PIN"
        setShowPinField(true);
    }

    const handlePinLogin = () => {

        if (pin === "123456"){
           
            navigation.navigate("Language");
            Alert.alert("Login Success", "PIN Verified");

        }else{
            Alert.alert("Invalid PIN", "Try again");
        }
    };



    return (
        <SafeAreaView style = {styles.container}>

            {/*app logo and myvault title*/}
            <View style = {styles.logoContainer}>
                <Image
                    source = {require('../assets/images/logo.png')}
                    style = {styles.logo}
                    resizeMode = "contain"/>
                <Text style = {styles.myVaultTitle}>MyVault</Text>
            </View>

            {/*Sign in content*/}

            <View style = {styles.signinContent}>
                <Text style = {styles.signinTitle}>Sign in</Text>
                <View style={styles.buttonContent}>
                <TouchableOpacity style = {styles.buttonCommon}
                    onPress = {handleBiometricLogin}>
                        <Text style = {styles.signinText}>Sign in with Biometrics</Text>
                </TouchableOpacity>

                <View style={{ marginTop:20}}>
                    {!showPinField ? (
                        <TouchableOpacity style = {styles.buttonCommon}
                    onPress = {handlePinLoginPress}>
                        <Text style = {styles.backButtonText}>Sign in with PIN</Text>
                     </TouchableOpacity>
                    ): (<>
                        <Text style={styles.pinEnterText}>Enter your PIN:</Text>
                        <TextInput
                            secureTextEntry
                            keyboardType="numeric"
                            value={pin}
                            onChangeText={setPin}
                           
                            maxLength={6}
                            style = {styles.input}
                         /> 
                         <TouchableOpacity style = {styles.buttonCommon}
                         onPress = {handlePinLogin}>
                            <Text style={styles.signinText}>Sign In</Text>
                        </TouchableOpacity>
                    </>
                    )}
                    </View>

                
                </View>
            </View>


        </SafeAreaView>
    );

};

const styles = StyleSheet.create({
    container : {
        flex: 1,
        justifyContent: "center",

    },
    logoContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 1,
        marginTop: 200
    },
    logo: {
        width: 80,
        height: 80,
    },
    myVaultTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#666666',
        textAlign: 'center',
    },
    signinContent: {
        flex: 1,
        marginTop: 2,
        
    },
    signinTitle: {
        fontSize: 25,
        color: '#666666',
        textAlign: 'left',
        marginLeft: 40,
        marginTop: 70,
        marginBottom: 50
    },
    buttonContent:{
        alignItems: 'center'
    },
    signinText: {
        fontSize: 20,
        color: '#ffffff',
        textAlign: 'center',

    },
    signinButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 4,
        marginBottom: 2,
        width: '70%'
        
    },
    backButton:{
        backgroundColor: '#4A90E2',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 4,
        marginBottom: 2,
        width: '70%'
        
    },
    backButtonText: {
        fontSize:20,
        color: '#ffff',
        textAlign: 'center'
    },
  
    pinEnterText:{
        color: '#666666',
        fontSize: 16,
        marginBottom: 10
    },
      input:{
        backgroundColor: '#d7d9fbff',
        borderRadius: 4,
        width: 300,
        marginBottom: 10

    },
    submitButton:{
        backgroundColor: '#4A90E2',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 4,
        marginBottom: 20,
        width: '100%',
    },
    buttonCommon: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 4,
    marginBottom: 10,
    width: 300,
    alignItems: 'center', 
  },
})

export default SigninScreen;