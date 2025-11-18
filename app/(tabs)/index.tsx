import React, { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    Keyboard, // Para esconder o teclado ao selecionar bairro
} from 'react-native';

import { useRouter } from 'expo-router';
// Importação de ícones (adapte conforme sua biblioteca, ex: FontAwesome, MaterialCommunityIcons)
import { FontAwesome } from '@expo/vector-icons';
import { MapPin, DollarSign, Home } from 'lucide-react-native'; // Se preferir lucide

// Importa os dados dos bairros
import BAIRROS_DATA from '../../data/bairros.json';

// Definição de Cores Baseadas nas imagens
const COLORS = {
    primary: '#6C5CE7', // Um roxo mais vibrante (similar ao das imagens)
    background: '#F8F8F8', // Um cinza bem claro
    card: '#FFFFFF',
    text: '#333333',
    label: '#6B7280', // Mais escuro que o original
    inputBorder: '#D1D5DB', // Cinza médio
    inputFocusBorder: '#6C5CE7',
    placeholder: '#A1A1AA',
    shadow: 'rgba(0,0,0,0.08)',
    infoText: '#6C5CE7', // Cor do texto de info do bairro
};

// Garantindo que BAIRROS_DATA é um array de strings válidas
const BAIRROS_NOMES: string[] = BAIRROS_DATA
    .filter(item => item.bairro && typeof item.bairro === "string")
    .map(item => item.bairro.trim());

const HomeScreen = () => {
    const router = useRouter(); 
    
    const [bairroSelecionado, setBairroSelecionado] = useState('');
    const [valorImovel, setValorImovel] = useState('');
    const [metrosQuadrados, setMetrosQuadrados] = useState('');
    const [isBairroCollapsed, setIsBairroCollapsed] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // Para filtro de bairros

    // --- Formatação de Moeda (igual ao seu segundo código) ---
    const handleValorChange = (text: string) => {
        const cleaned = text.replace(/\D/g, ''); // Remove tudo que não for dígito
        if (cleaned) {
            let num = parseInt(cleaned, 10);
            if (isNaN(num)) num = 0; // Garante que é um número

            // Converte para centavos e depois para float para formatação
            const floatValue = num / 100; 
            const formatted = floatValue.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
            setValorImovel(formatted);
        } else {
            setValorImovel('');
        }
    };

    const handlePesquisar = () => {
        if (!bairroSelecionado || !valorImovel || !metrosQuadrados) {
            // Poderia adicionar um alerta visual aqui
            return;
        }

        // Remove a formatação para passar o valor puro
        const valorParaEnvio = parseFloat(valorImovel.replace(/\./g, '').replace(',', '.'));

        const dadosPesquisa = {
            bairro: bairroSelecionado,
            valor: valorParaEnvio.toFixed(2), // Garante duas casas decimais
            metrosQuadrados: metrosQuadrados,
        };

        router.push({
            pathname: '/resultado',
            params: dadosPesquisa
        });
    };

    const selectBairro = (bairro: string) => {
        setBairroSelecionado(bairro);
        setSearchTerm(bairro); // Preenche a barra de busca com o bairro selecionado
        setIsBairroCollapsed(true);
        Keyboard.dismiss(); // Esconde o teclado
    };

    const filteredBairros = BAIRROS_NOMES.filter(bairro =>
        bairro.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.container}>
                    
                    <Text style={styles.title}>Análise de Investimento Imobiliário</Text>
                    <Text style={styles.subtitle}>Preencha os dados do imóvel que você deseja comprar em Fortaleza.</Text>

                    {/* --- 1. Valor do Imóvel --- */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Valor do Imóvel</Text>
                        <View style={styles.inputWithIcon}>
                            <DollarSign size={20} color={COLORS.label} />
                            <Text style={styles.currencyPrefix}>R$</Text>
                            <TextInput
                                style={styles.textInput}
                                onChangeText={handleValorChange}
                                value={valorImovel}
                                keyboardType="numeric"
                                placeholder="0,00"
                                placeholderTextColor={COLORS.placeholder}
                            />
                        </View>
                    </View>

                    {/* --- 2. Metros Quadrados --- */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Metragem Quadrada (m²)</Text>
                        <View style={styles.inputWithIcon}>
                            <Home size={20} color={COLORS.label} />
                            <TextInput
                                style={styles.textInput}
                                onChangeText={setMetrosQuadrados}
                                value={metrosQuadrados}
                                keyboardType="numeric"
                                placeholder="Ex: 120"
                                placeholderTextColor={COLORS.placeholder}
                            />
                        </View>
                    </View>

                    {/* --- 3. Bairro (Acordeão Estilizado com Busca) --- */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bairro do Imóvel</Text>
                        <TouchableOpacity 
                            style={styles.accordionHeader} 
                            onPress={() => setIsBairroCollapsed(!isBairroCollapsed)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.inputWithIcon}>
                                <MapPin size={20} color={COLORS.label} />
                                <TextInput
                                    style={styles.accordionTextInput}
                                    onChangeText={(text) => {
                                        setSearchTerm(text);
                                        setBairroSelecionado(''); // Limpa a seleção ao digitar
                                        setIsBairroCollapsed(false); // Abre o acordeão para mostrar resultados
                                    }}
                                    value={searchTerm}
                                    placeholder="Buscar ou Selecionar Bairro"
                                    placeholderTextColor={COLORS.placeholder}
                                    onFocus={() => setIsBairroCollapsed(false)}
                                />
                            </View>
                            <FontAwesome 
                                name={isBairroCollapsed ? 'chevron-down' : 'chevron-up'} 
                                size={16} 
                                color={COLORS.label} 
                            />
                        </TouchableOpacity>

                        {!isBairroCollapsed && (
                            <View style={styles.accordionContent}>
                                <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
                                    {filteredBairros.length > 0 ? (
                                        filteredBairros.map((bairroItem, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={styles.bairroOption}
                                                onPress={() => selectBairro(bairroItem)}
                                            >
                                                <Text style={styles.bairroText}>{bairroItem}</Text>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <Text style={styles.noResultsText}>Nenhum bairro encontrado.</Text>
                                    )}
                                </ScrollView>
                            </View>
                        )}
                        {bairroSelecionado && isBairroCollapsed && (
                            <View style={styles.infoBox}>
                                <FontAwesome name="info-circle" size={14} color={COLORS.infoText} />
                                <Text style={styles.infoText}>Bairro selecionado: {bairroSelecionado}</Text>
                            </View>
                        )}
                    </View>

                    {/* --- Botão Analisar Imóvel --- */}
                    <TouchableOpacity 
                        style={[
                            styles.button, 
                            (!bairroSelecionado || !valorImovel || !metrosQuadrados) && styles.buttonDisabled
                        ]} 
                        onPress={handlePesquisar}
                        disabled={!bairroSelecionado || !valorImovel || !metrosQuadrados}
                        activeOpacity={0.8}
                    >
                        <FontAwesome name="line-chart" size={18} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Analisar Imóvel</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 30, // Adiciona padding vertical para centralizar melhor
    },
    container: {
        width: '90%', // Levemente menor para um respiro nas laterais
        maxWidth: 500,
        alignSelf: 'center',
        padding: 25,
        backgroundColor: COLORS.card,
        borderRadius: 15,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.label,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        marginBottom: 8,
        color: COLORS.text, // Cor do texto mais escuro
        fontWeight: '600',
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: COLORS.inputBorder,
        borderWidth: 1,
        paddingHorizontal: 15,
        borderRadius: 10,
        backgroundColor: COLORS.card,
        height: 50,
    },
    currencyPrefix: {
        fontSize: 16,
        color: COLORS.label,
        marginRight: 4,
        fontWeight: '600',
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
        paddingVertical: 0, // Garante que o texto fique alinhado ao centro verticalmente
    },
    // Estilos do Acordeão (Bairro)
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderColor: COLORS.inputBorder,
        borderWidth: 1,
        paddingRight: 15, // Apenas para o ícone
        borderRadius: 10,
        backgroundColor: COLORS.card,
        height: 50,
    },
    accordionTextInput: { // Estilo para o TextInput dentro do accordionHeader
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
        paddingVertical: 0,
        paddingLeft: 10, // Para o texto não grudar no ícone
    },
    accordionContent: {
        borderColor: COLORS.inputBorder,
        borderWidth: 1,
        borderTopWidth: 0,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        backgroundColor: COLORS.card,
        maxHeight: 200, // Limita a altura para scroll
        overflow: 'hidden',
    },
    bairroOption: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6', // Cinza bem claro
    },
    bairroText: {
        fontSize: 16,
        color: COLORS.text,
    },
    noResultsText: {
        padding: 12,
        fontSize: 14,
        color: COLORS.label,
        textAlign: 'center',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 5,
    },
    infoText: {
        fontSize: 13,
        color: COLORS.infoText,
        marginLeft: 5,
        fontWeight: '500',
    },
    // Estilos do Botão
    button: {
        marginTop: 30,
        backgroundColor: COLORS.primary,
        paddingVertical: 15, // Um pouco menor
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonDisabled: {
        backgroundColor: '#D1D5DB', // Cinza (Gray-300)
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    buttonIcon: {
        // Estilos adicionais se precisar para o ícone do botão
    }
});

export default HomeScreen;