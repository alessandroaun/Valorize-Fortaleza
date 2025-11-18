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

// Ícones
import { DollarSign, Home, MapPin, TrendingUp, ChevronDown, Check, Search, X } from 'lucide-react-native';

// Importa os dados dos bairros
import BAIRROS_DATA from '../../data/bairros.json';

const { width } = Dimensions.get('window');

// --- DEFINIÇÃO DE CORES ---
const COLORS = {
    primary: '#1D4ED8', // Azul forte (moderno)
    primaryLight: '#DCE7FF', // Azul claro para fundo
    background: '#F8F8F8', // Fundo cinza claro
    card: '#FFFFFF',
    text: '#333333',
    label: '#6B7280',
    title: '#1F2937',
    danger: '#EF4444',
    success: '#10B981',
    inputBorder: '#E5E7EB',
};

// --- TIPAGEM ---
interface BairroData {
    bairro: string;
}

// --- FUNÇÕES DE UTILIDADE ---
const formatCurrencyInput = (value: string) => {
    // Remove tudo que não for dígito
    let cleanValue = value.replace(/[^\d]/g, '');

    if (!cleanValue) return '';

    // Converte para número e depois para formato de moeda
    let num = parseInt(cleanValue, 10) / 100;
    
    return num.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
};

const extractNumericValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    
    // Remove R$, pontos de milhar e substitui a vírgula decimal por ponto
    const cleanValue = formattedValue
        .replace(/[R$\s.]/g, '')
        .replace(',', '.');
        
    return parseFloat(cleanValue) || 0;
};


/* -------------------------------------------------------------------------- */
/* COMPONENTES DO FORMULÁRIO                                                  */
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

// COMPONENTE DO SELETOR DE BAIRRO COM FILTRO E ROLAGEM
const BairroSelector: React.FC<BairroSelectorProps> = ({ bairros, selectedBairro, onSelectBairro }) => {
    const [modalVisible, setModalVisible] = useState(false);
    // Novo estado para o termo de pesquisa
    const [searchTerm, setSearchTerm] = useState('');

    // Filtra a lista de bairros com base no termo de pesquisa
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
        setSearchTerm(''); // Limpa o termo de busca ao selecionar
    };

    const handleOpenModal = () => {
        setModalVisible(true);
        setSearchTerm(''); // Inicia a busca vazia
    };

    return (
        <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
                <MapPin size={16} color={COLORS.label} />
                <Text style={styles.inputLabel}>Bairro do Imóvel</Text>
            </View>
            
            {/* BOTÃO QUE ABRE O MODAL - Exibe o bairro selecionado */}
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

            {/* MODAL COM PESQUISA E LISTA ROLÁVEL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                {/* KeyboardAvoidingView para ajustar o modal quando o teclado aparece */}
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
                        
                        {/* CAMPO DE PESQUISA DENTRO DO MODAL */}
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
                        
                        {/* LISTA ROLÁVEL COM BAIRROS FILTRADOS */}
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

                        {/* Botão de Fechar para telas menores */}
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
/* TELA PRINCIPAL (INDEX)                                                     */
/* -------------------------------------------------------------------------- */

const HomeScreen = () => {
    const router = useRouter();
    
    // CAMPOS VAZIOS POR PADRÃO (Conforme solicitação)
    const [valorInput, setValorInput] = useState('');
    const [metrosQuadrados, setMetrosQuadrados] = useState('');
    const [bairro, setBairro] = useState('');
    
    // Lista de Bairros
    const bairrosList = useMemo(() => {
        // Ordena a lista de bairros
        return (BAIRROS_DATA as BairroData[])
            .map(item => ({ bairro: item.bairro }))
            .sort((a, b) => a.bairro.localeCompare(b.bairro));
    }, []);

    // Tratamento de mudança de valor (moeda)
    const handleValorChange = (text: string) => {
        setValorInput(formatCurrencyInput(text));
    };
    
    // Validação e Navegação
    const handleAnalisar = () => {
        // Extrai o valor numérico do input formatado
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

    // Função para checar se o botão deve estar ativo
    const isButtonEnabled = useMemo(() => {
        const valorNumerico = extractNumericValue(valorInput);
        const m2Numerico = parseInt(metrosQuadrados, 10);

        return valorNumerico > 0 && !isNaN(m2Numerico) && m2Numerico > 0 && !!bairro;
    }, [valorInput, metrosQuadrados, bairro]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* --- HEADER CENTRALIZADO (ESTILIZADO) --- */}
                <View style={styles.headerContainer}>
                    {/* Componente Image */}
                    <Image 
                        // URL de placeholder (Atualizada para 300x80)
                        source={{ 
                            uri: 'https://i.imgur.com/oNizFxc.png' 
                        }}
                        style={styles.headerLogo}
                    />
                    <Text style={styles.headerSubtitle}>
                        Preencha os dados do imóvel que você deseja comprar em Fortaleza.


                    </Text>
                </View>

                {/* --- CARD PRINCIPAL DO FORMULÁRIO --- */}
                <View style={styles.card}>
                    
                    {/* Input: Valor do Imóvel */}
                    <InputField
                        label="Valor do Imóvel"
                        icon={DollarSign}
                        value={valorInput}
                        onChangeText={handleValorChange}
                        keyboardType="numeric"
                        placeholder="Ex: R$ 450.000,00"
                    />
                    
                    {/* Input: Metragem Quadrada */}
                    <InputField
                        label="Metragem Quadrada (m²)"
                        icon={Home}
                        value={metrosQuadrados}
                        onChangeText={setMetrosQuadrados}
                        keyboardType="numeric"
                        placeholder="Ex: 85"
                    />

                    {/* Selector: Bairro do Imóvel (COM PESQUISA E SCROLL) */}
                    <BairroSelector
                        bairros={bairrosList}
                        selectedBairro={bairro}
                        onSelectBairro={setBairro}
                    />

                    {/* Botão de Análise */}
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
/* ESTILOS REACT NATIVE                                                       */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { padding: 25 },
    
    // Header Centralizado
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 15,
    },
    // Estilo para a imagem (Logo) - TAMANHO AUMENTADO AQUI
    headerLogo: {
        width: 400, // Largura aumentada (antes era 250)
        height: 100, // Altura aumentada (antes era 60)
        resizeMode: 'contain',
        marginBottom: 15, 
    },
    headerTitle: { // Mantido mas não usado, se quiser remover, pode.
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

    // Card Principal (Estilizado)
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

    // Input Group
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
    
    // Selector (Bairro)
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
        flex: 1, // Para ocupar o espaço e empurrar o ícone
    },

    // Botão Analisar (Estilizado)
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
    
    // --- Estilos do Modal (Bairro Selector com Busca) ---
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