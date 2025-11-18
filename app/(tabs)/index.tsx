import { Stack, useRouter } from 'expo-router';
import React, { useState, useMemo, useEffect } from 'react';
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
    Image
} from 'react-native';

import { DollarSign, Home, MapPin, TrendingUp, ChevronDown, Check, Search, X } from 'lucide-react-native';

//Alessandro: Necessário instalar o lucide-react-native via npm.// 

import BAIRROS_DATA from '../../data/bairros.json';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#1D4ED8',
    primaryLight: '#DCE7FF',
    background: '#F8F8F8',
    card: '#FFFFFF',
    text: '#333333',
    label: '#6B7280',
    title: '#1F2937',
    danger: '#EF4444',
    success: '#10B981',
    inputBorder: '#E5E7EB',
};

interface BairroData {
    bairro: string;
}

const formatCurrencyInput = (value: string) => {
    let cleanValue = value.replace(/[^\d]/g, '');

    if (!cleanValue) return '';

    let num = parseInt(cleanValue, 10) / 100;
    
    return num.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
};

const extractNumericValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    
    const cleanValue = formattedValue
        .replace(/[R$\s.]/g, '')
        .replace(',', '.');
        
    return parseFloat(cleanValue) || 0;
};


/* -------------------------------------------------------------------------- */
/* COMPONENTES DO FORMULÁRIO                                                  */
/* -------------------------------------------------------------------------- */

interface InputFieldProps {
    label: string;
    icon: React.ComponentType<{ size: number; color: string }>;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: 'default' | 'numeric';
    placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon: Icon, value, onChangeText, keyboardType = 'default', placeholder }) => (
    <View style={styles.inputGroup}>
        <View style={styles.inputLabelContainer}>
            <Icon size={16} color={COLORS.label} />
            <Text style={styles.inputLabel}>{label}</Text>
        </View>
        <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholder={placeholder}
            placeholderTextColor="#C7C7C7"
        />
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
        if (!searchTerm) {
            return bairros;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        return bairros.filter(item => 
            item.bairro.toLowerCase().includes(lowerCaseSearch)
        );
    }, [searchTerm, bairros]);

    const handleSelect = (bairro: string) => {
        onSelectBairro(bairro);
        setModalVisible(false);
        setSearchTerm('');
    };

    const handleOpenModal = () => {
        setModalVisible(true);
        setSearchTerm('');
    };

    return (
        <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
                <MapPin size={16} color={COLORS.label} />
                <Text style={styles.inputLabel}>Bairro do Imóvel</Text>
            </View>
            
            <TouchableOpacity 
                style={styles.selectButton} 
                onPress={handleOpenModal}
                activeOpacity={0.8}
            >
                <Text style={[styles.selectButtonText, selectedBairro ? { color: COLORS.text } : { color: '#C7C7C7' }]}>
                    {selectedBairro || 'Selecione ou Busque o Bairro'}
                </Text>
                <ChevronDown size={20} color={COLORS.primary} />
            </TouchableOpacity>

            <Modal
                animationType="slide"
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
                            <Text style={styles.modalTitle}>Selecione o Bairro</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={COLORS.label} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.searchContainer}>
                            <Search size={20} color={COLORS.label} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Digite o nome do bairro para filtrar..."
                                placeholderTextColor="#9CA3AF"
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                            />
                        </View>
                        
                        <ScrollView style={styles.bairroListContainer}>
                            {filteredBairros.length > 0 ? (
                                filteredBairros.map((item) => (
                                    <TouchableOpacity
                                        key={item.bairro}
                                        style={styles.bairroListItem}
                                        onPress={() => handleSelect(item.bairro)}
                                    >
                                        <Text style={styles.bairroListItemText}>{item.bairro}</Text>
                                        {selectedBairro === item.bairro && (
                                            <Check size={18} color={COLORS.success} />
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.noResultsText}>Nenhum bairro encontrado para "{searchTerm}".</Text>
                            )}
                        </ScrollView>

                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.modalCloseButtonText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};


/* -------------------------------------------------------------------------- */
/* TELA PRINCIPAL (INDEX)                                                     */
/* -------------------------------------------------------------------------- */

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

    const handleValorChange = (text: string) => {
        setValorInput(formatCurrencyInput(text));
    };
    
    const handleAnalisar = () => {
        const valorNumerico = extractNumericValue(valorInput);
        const m2Numerico = parseInt(metrosQuadrados, 10);

        if (valorNumerico <= 0 || isNaN(m2Numerico) || m2Numerico <= 0 || !bairro) {
             Alert.alert("Erro de Validação", "Por favor, preencha todos os campos corretamente (Valor e Metragem devem ser maiores que zero e o Bairro deve ser selecionado).");
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
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.headerContainer}>
                    <Image 
                        source={{ 
                            uri: 'https://i.imgur.com/oNizFxc.png' 
                        }}
                        style={styles.headerLogo}
                    />
                    <Text style={styles.headerSubtitle}>
                        Preencha os dados do imóvel que você deseja comprar em Fortaleza.


                    </Text>
                </View>

                <View style={styles.card}>
                    
                    <InputField
                        label="Valor do Imóvel"
                        icon={DollarSign}
                        value={valorInput}
                        onChangeText={handleValorChange}
                        keyboardType="numeric"
                        placeholder="Ex: R$ 450.000,00"
                    />
                    
                    <InputField
                        label="Metragem Quadrada (m²)"
                        icon={Home}
                        value={metrosQuadrados}
                        onChangeText={setMetrosQuadrados}
                        keyboardType="numeric"
                        placeholder="Ex: 85"
                    />

                    <BairroSelector
                        bairros={bairrosList}
                        selectedBairro={bairro}
                        onSelectBairro={setBairro}
                    />

                    <TouchableOpacity 
                        style={[styles.analisarButton, !isButtonEnabled && styles.analisarButtonDisabled]} 
                        onPress={handleAnalisar}
                        activeOpacity={isButtonEnabled ? 0.8 : 1}
                        disabled={!isButtonEnabled}
                    >
                        <TrendingUp size={20} color="#fff" />
                        <Text style={styles.analisarButtonText}>Analisar Imóvel</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

/* -------------------------------------------------------------------------- */
/* ESTILOS REACT NATIVE                                                       */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { padding: 25 },
    
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 15,
    },
    headerLogo: {
        width: 400,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 15, 
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.title,
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 15,
        color: COLORS.label,
        textAlign: 'center',
        lineHeight: 22,
    },

    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },

    inputGroup: {
        marginBottom: 25,
    },
    inputLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginLeft: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 14,
        fontSize: 18,
        fontWeight: '500',
        color: COLORS.text,
        marginTop: 5,
        backgroundColor: '#fff',
    },
    
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 14,
        marginTop: 5,
        backgroundColor: '#fff',
    },
    selectButtonText: {
        fontSize: 17,
        fontWeight: '500',
        flex: 1,
    },

    analisarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        marginTop: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    analisarButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowColor: 'transparent',
    },
    analisarButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: Dimensions.get('window').height * 0.8,
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.title,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        backgroundColor: COLORS.background,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.text,
    },
    bairroListContainer: {
        maxHeight: Dimensions.get('window').height * 0.5, 
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 5,
    },
    bairroListItem: {
        paddingVertical: 12,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bairroListItemText: {
        fontSize: 16,
        color: COLORS.text,
        flex: 1,
    },
    noResultsText: {
        padding: 15,
        textAlign: 'center',
        color: COLORS.label,
        fontStyle: 'italic',
    },
    modalCloseButton: {
        backgroundColor: COLORS.primaryLight,
        borderRadius: 10,
        paddingVertical: 14,
        marginTop: 20,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
});

export default HomeScreen;