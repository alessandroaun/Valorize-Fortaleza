import React, { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    Keyboard,
    Platform,
} from 'react-native';

import { useRouter, Stack } from 'expo-router';
// Importação de ícones (@expo/vector-icons é robusto e evita problemas de compatibilidade)
import { FontAwesome } from '@expo/vector-icons';
import { MapPin, DollarSign, Home } from 'lucide-react-native';

// Importa os dados dos bairros
import BAIRROS_DATA from '../../data/bairros.json';

// Definição de Cores Baseadas nas imagens
const COLORS = {
    primary: '#6C5CE7', // Roxo principal
    background: '#F8F8F8',
    card: '#FFFFFF',
    text: '#333333',
    label: '#6B7280',
    inputBorder: '#D1D5DB',
    placeholder: '#A1A1AA',
    shadow: 'rgba(0,0,0,0.08)',
    infoText: '#6C5CE7',
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
    const [searchTerm, setSearchTerm] = useState('');

    // --- Formatação de Moeda ---
    const handleValorChange = (text: string) => {
        const cleaned = text.replace(/\D/g, ''); 
        if (cleaned) {
            let num = parseInt(cleaned, 10);
            if (isNaN(num)) num = 0;

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
            // Em uma aplicação real, você mostraria um feedback visual aqui (ex: Toast, Alert)
            return;
        }

        const valorParaEnvio = parseFloat(valorImovel.replace(/\./g, '').replace(',', '.'));

        const dadosPesquisa = {
            bairro: bairroSelecionado,
            valor: valorParaEnvio.toFixed(2),
            metrosQuadrados: metrosQuadrados,
        };

        router.push({
            pathname: '/resultado',
            params: dadosPesquisa
        });
    };

    const selectBairro = (bairro: string) => {
        setBairroSelecionado(bairro);
        setSearchTerm(bairro);
        setIsBairroCollapsed(true);
        Keyboard.dismiss();
    };

    const filteredBairros = BAIRROS_NOMES.filter(bairro =>
        bairro.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerShown: false }} />
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

                    {/* --- 3. Bairro --- */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bairro do Imóvel</Text>
                        <TouchableOpacity 
                            style={styles.accordionHeader} 
                            onPress={() => setIsBairroCollapsed(!isBairroCollapsed)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.inputWithIconInner}>
                                <MapPin size={20} color={COLORS.label} />
                                <TextInput
                                    style={styles.accordionTextInput}
                                    onChangeText={(text) => {
                                        setSearchTerm(text);
                                        setBairroSelecionado('');
                                        setIsBairroCollapsed(false);
                                    }}
                                    value={searchTerm}
                                    placeholder="Buscar ou Selecionar Bairro"
                                    placeholderTextColor={COLORS.placeholder}
                                    onFocus={() => setIsBairroCollapsed(false)}
                                    // Previne que o TouchableOpacity capture o foco do TextInput
                                    editable={!isBairroCollapsed} 
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
                        <FontAwesome name="line-chart" size={18} color="#fff" />
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
        paddingVertical: 30,
    },
    container: {
        width: '90%',
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
        color: COLORS.text,
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
        paddingVertical: 0,
    },
    // Estilos do Acordeão (Bairro)
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderColor: COLORS.inputBorder,
        borderWidth: 1,
        paddingRight: 15,
        borderRadius: 10,
        backgroundColor: COLORS.card,
        height: 50,
    },
    inputWithIconInner: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    accordionTextInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
        paddingVertical: 0,
        paddingLeft: 10,
    },
    accordionContent: {
        borderColor: COLORS.inputBorder,
        borderWidth: 1,
        borderTopWidth: 0,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        backgroundColor: COLORS.card,
        maxHeight: 200,
        overflow: 'hidden',
    },
    bairroOption: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
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
        paddingVertical: 15,
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
        backgroundColor: '#D1D5DB',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default HomeScreen;