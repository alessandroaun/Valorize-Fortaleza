import { Stack, useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    TouchableOpacity,
    Modal,
    Dimensions,
    Alert, 
    KeyboardAvoidingView,
    Platform,
    Image,
    StatusBar
} from 'react-native';

import { DollarSign, Home, MapPin, TrendingUp, ChevronDown, Check, Search, X } from 'lucide-react-native';

import BAIRROS_DATA from '../data/bairros.json';

const { width } = Dimensions.get('window');

const COLORS = {
    background: '#0f1d2aff', 
    card: '#1E293B',
    inputBackground: '#334155',
    primary: '#11ac5eff', 
    accent: '#10B981', 
    danger: '#EF4444',
    text: '#1ff087ff', 	
    textSecondary: '#94A3B8', 
    border: '#475569',
};

interface BairroData {
    bairro: string;
}

const formatCurrencyInput = (value: string) => {
    let cleanValue = value.replace(/[^\d]/g, '');
    if (!cleanValue) return '';
    if (cleanValue.length > 10) cleanValue = cleanValue.substring(0, 10);
    let num = parseInt(cleanValue, 10) / 100;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const extractNumericValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    const cleanValue = formattedValue.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
};

interface InputFieldProps {
    label: string;
    icon: React.ComponentType<{ size: number; color: string }>;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: 'default' | 'numeric';
    placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon: Icon, value, onChangeText, keyboardType = 'default', placeholder }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.inputWrapper}>
            <View style={styles.iconWrapper}>
                <Icon size={20} color={COLORS.primary} />
            </View>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textSecondary}
            />
        </View>
    </View>
);

interface BairroSelectorProps {
    bairros: BairroData[];
    selectedBairro: string;
    onSelectBairro: (bairro: string) => void;
}

const BairroSelector: React.FC<BairroSelectorProps> = ({ bairros, selectedBairro, onSelectBairro }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBairros = useMemo(() => {
        if (!searchTerm) return bairros;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return bairros.filter(item => item.bairro.toLowerCase().includes(lowerCaseSearch));
    }, [searchTerm, bairros]);

    const handleSelect = (bairro: string) => {
        onSelectBairro(bairro);
        setModalVisible(false);
        setSearchTerm(''); 
    };

    return (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bairro do Imóvel</Text>
            
            <TouchableOpacity 
                style={styles.selectButton} 
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
            >
                <View style={styles.iconWrapper}>
                    <MapPin size={20} color={COLORS.primary} />
                </View>
                <Text style={[styles.selectButtonText, selectedBairro ? { color: COLORS.text } : { color: COLORS.textSecondary }]}>
                    {selectedBairro || 'Selecione o bairro...'}
                </Text>
                <ChevronDown size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecionar Bairro</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeIconArea}>
                                <X size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.searchContainer}>
                            <Search size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar bairro..."
                                placeholderTextColor={COLORS.textSecondary}
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                                autoFocus={false}
                            />
                        </View>
                        
                        <ScrollView style={styles.bairroListContainer} indicatorStyle="white">
                            {filteredBairros.length > 0 ? (
                                filteredBairros.map((item) => (
                                    <TouchableOpacity
                                        key={item.bairro}
                                        style={styles.bairroListItem}
                                        onPress={() => handleSelect(item.bairro)}
                                    >
                                        <Text style={styles.bairroListItemText}>{item.bairro}</Text>
                                        {selectedBairro === item.bairro && (
                                            <Check size={20} color={COLORS.accent} />
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.noResultsText}>Nenhum bairro encontrado.</Text>
                            )}
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const HomeScreen = () => {
    const router = useRouter();
    
    const [valorInput, setValorInput] = useState('');
    const [metrosQuadrados, setMetrosQuadrados] = useState('');
    const [bairro, setBairro] = useState('');
    
    const bairrosList = useMemo(() => {
        return (BAIRROS_DATA as BairroData[])
            .map(item => ({ bairro: item.bairro }))
            .sort((a, b) => a.bairro.localeCompare(b.bairro));
    }, []);

    const handleValorChange = (text: string) => setValorInput(formatCurrencyInput(text));
    
    const handleAnalisar = () => {
        const valorNumerico = extractNumericValue(valorInput);
        const m2Numerico = parseInt(metrosQuadrados, 10);

        if (valorNumerico <= 0 || isNaN(m2Numerico) || m2Numerico <= 0 || !bairro) {
             Alert.alert("Atenção", "Preencha todos os campos para realizar a análise.");
             return;
        }

        router.push({
            pathname: "/resultado",
            params: { 
                bairro: bairro, 
                valor: valorNumerico.toString(), 
                metrosQuadrados: metrosQuadrados 
            }
        });
    };

    const isButtonEnabled = useMemo(() => {
        const valorNumerico = extractNumericValue(valorInput);
        const m2Numerico = parseInt(metrosQuadrados, 10);
        return valorNumerico > 0 && !isNaN(m2Numerico) && m2Numerico > 0 && !!bairro;
    }, [valorInput, metrosQuadrados, bairro]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <Stack.Screen options={{ headerShown: false }} />
            
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.headerContainer}>
                    <View style={styles.logoContainer}>
                        <Image 
                            source={require('../assets/images/logo_valorize.png')} 
                            style={styles.headerLogo}
                            resizeMode="contain" 
                        />
                    </View>
            
                    <Text style={styles.headerSubtitle}>
                        Insira os dados e descubra se a compra vale a pena. Receba informações precisas sobre o imóvel e o bairro, na palma da sua mão.
                    </Text>
                </View>

                <View style={styles.card}>
                    <InputField
                        label="Valor do Imóvel"
                        icon={DollarSign}
                        value={valorInput}
                        onChangeText={handleValorChange}
                        keyboardType="numeric"
                        placeholder="Ex:. R$ 250.000,00"
                    />
                    
                    <InputField
                        label="Metragem Quadrada do Imóvel"
                        icon={Home}
                        value={metrosQuadrados}
                        onChangeText={setMetrosQuadrados}
                        keyboardType="numeric"
                        placeholder="Ex:. 130 m²"
                    />

                    <BairroSelector
                        bairros={bairrosList}
                        selectedBairro={bairro}
                        onSelectBairro={setBairro}
                    />

                    <TouchableOpacity 
                        style={[styles.analisarButton, !isButtonEnabled && styles.analisarButtonDisabled]} 
                        onPress={handleAnalisar}
                        activeOpacity={0.8}
                        disabled={!isButtonEnabled}
                    >
                        <TrendingUp size={22} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.analisarButtonText}>ANALISAR AGORA</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>Baseado em dados reais do mercado fortalezense.</Text>
                <Text style={styles.footerText2}>Desenvolvido por alunos da Estácio Parangaba orientados pela professora Juciarias Medeiros. Novembro de 2025.</Text>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: COLORS.background 
    },
    scrollContent: { 
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
    },
    
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 40,
    },
    logoContainer: {
        marginBottom: 5,
    },
    headerLogo: {
        width: 250,
        height: 125,
        resizeMode: 'contain',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: '95%',
    },

    card: {
        backgroundColor: COLORS.card,
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
        fontWeight: '600',
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBackground,
        borderRadius: 16,
        height: 56,
        borderWidth: 1,
        borderColor: 'transparent', 
    },
    iconWrapper: {
        width: 50,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.05)',
    },
    input: {
        flex: 1,
        height: '100%',
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '500',
        paddingHorizontal: 16,
    },

    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBackground,
        borderRadius: 16,
        height: 56,
        paddingRight: 16,
    },
    selectButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        paddingHorizontal: 16,
    },

    analisarButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    analisarButtonDisabled: {
        backgroundColor: COLORS.inputBackground,
        shadowOpacity: 0,
    },
    analisarButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },

    footerText: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: 20,
        fontSize: 13,
        opacity: 0.6,
    },
    footerText2: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: 2,
        fontSize: 10,
        opacity: 0.6,
    },

    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    },
    modalContent: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        height: '80%', 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    closeIconArea: {
        padding: 5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBackground,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 16,
        height: '100%',
    },
    bairroListContainer: {
        flex: 1,
    },
    bairroListItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bairroListItemText: {
        fontSize: 16,
        color: COLORS.text,
    },
    noResultsText: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: 40,
        fontSize: 16,
    },
});

export default HomeScreen;