import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { MapPin, AlertTriangle } from 'lucide-react-native';

const { height } = Dimensions.get('window');

// Tenta importar o mapa dinamicamente para evitar crash se a lib nativa faltar
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

try {
    // Só tenta carregar se não for Web (Maps nativo não roda na web sem config extra)
    if (Platform.OS !== 'web') {
        const Maps = require('react-native-maps');
        MapView = Maps.default;
        Marker = Maps.Marker;
        PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
    }
} catch (error) {
    console.warn("react-native-maps não encontrado ou erro nativo:", error);
}

interface BairroMapaProps {
    bairro: string;
    latitude: number;
    longitude: number;
}

const BairroMapa: React.FC<BairroMapaProps> = ({ bairro, latitude, longitude }) => {
    
    // Se o MapView não carregou (erro nativo), mostra Placeholder
    if (!MapView) {
        return (
            <View style={[styles.container, styles.placeholderContainer]}>
                <AlertTriangle size={48} color="#64748b" />
                <Text style={styles.placeholderTitle}>Mapa Indisponível</Text>
                <Text style={styles.placeholderText}>
                    A biblioteca de mapas não foi carregada corretamente.
                </Text>
                <Text style={styles.placeholderSubtext}>
                    Tente rodar: npx expo install react-native-maps
                </Text>
            </View>
        );
    }

    // Região inicial do mapa
    const initialRegion = {
        latitude: latitude,
        longitude: longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    };

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE} 
                style={styles.map}
                initialRegion={initialRegion}
                scrollEnabled={false}
                zoomEnabled={false} 
                liteMode={true} // Otimização para listas (Android)
            >
                <Marker
                    coordinate={{ latitude, longitude }}
                    title={bairro}
                    pinColor="#11ac5eff" 
                />
            </MapView>
            
            {/* Overlay para interação (opcional, leva para app de mapas se clicar) */}
            {/* <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => ...abrirWaze} /> */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 15,
        overflow: 'hidden',
        marginVertical: 15,
        height: height * 0.35, // Altura do mapa
        borderWidth: 1,
        borderColor: '#475569',
        backgroundColor: '#1e293b', // Fundo caso mapa demore a carregar
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    // Estilos do Placeholder (Caso de Erro)
    placeholderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    placeholderTitle: {
        color: '#f8fafc',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
    },
    placeholderText: {
        color: '#94a3b8',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 5,
    },
    placeholderSubtext: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 10,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    }
});

export default BairroMapa;