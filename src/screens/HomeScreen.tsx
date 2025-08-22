import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
    navigation: HomeScreenNavigationProp;
}

const HomeScreen:React.FC<Props> = ({ navigation }) => {

    return (
        <SafeAreaView style = {styles.container} >

            <View style = { styles.logoContainer }>
                <View style = {styles.logoContent}>
                <Image 
                    source = {require('../assets/images/logo.png')}
                    style = {styles.logo}
                    resizeMode = 'contain'/>
                <Text style = {styles.myvaultTitle}>MyVault</Text>
                </View>
                
            </View>

            <View style = {styles.advertisements}>

            </View>



        </SafeAreaView>
    );
};

const styles = StyleSheet.create(
    {
        container : {
            flex: 1,
            backgroundColor: '#ffff'
        },
        logoContainer:{
            
            height: 150,

        },
        logoContent:{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 20

        },
        logo:{
            width: 80,
            height: 80
        },
        myvaultTitle:{
            fontSize: 24,
            fontWeight: '600',
            color: '#666666',
            textAlign: 'center',
        },
        advertisements:{
            
            backgroundColor: '#666666',
            height: 220
        }

});

export default HomeScreen;
