import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Dimensions,
    TouchableOpacity
} from 'react-native';

// Ícones
import { ChevronLeft, MapPin, DollarSign, Home, TrendingUp, Zap, Users, Search } from 'lucide-react-native';

// Importa os dados dos bairros
import BAIRROS_DATA from '../data/bairros.json';

const { width } = Dimensions.get('window');

// --- DEFINIÇÃO DE CORES (Baseadas nas imagens) ---
const COLORS = {
    primary: '#6C5CE7', // Roxo principal
    background: '#F8F8F8', // Fundo cinza claro
    card: '#FFFFFF',
    text: '#333333',
    label: '#6B7280',
    title: '#1F2937',
    greenSuccess: '#10B981', // Verde "Excelente Negócio"
    greenLight: '#34D399', // Verde "Muito Vantajoso"
    yellowWarning: '#FBBF24', // Amarelo "Justo"
    orangeAlert: '#FB923C', // Laranja
    redDanger: '#EF4444', // Vermelho "Preço Elevado"
    indigoCard: '#4F46E5', // Azul índigo para cards
    tealCard: '#0D9488', // Azul-esverdeado para cards
    grayCard: '#4B5563', // Cinza escuro para cards
    infoBoxBg: '#E0F2FE', // Azul claro para box de dicas
    infoBoxBorder: '#93C5FD',
    infoBoxText: '#1D4ED8',
};

/* -------------------------------------------------------------------------- */
/* TIPAGEM E FUNÇÕES DE UTILIDADE                                            */
/* -------------------------------------------------------------------------- */
interface BairroFullData {
    bairro: string;
    preco_minimo_fipe_m2: string;
    preco_medio_fipe_m2: string;
    preco_maximo_fipe_m2: string;
    preco_m2_olx: string;
    ibeu: string;
    idh: string;
    condicoes_ambientais_urbanas: string;
    condicoes_habitacionais_urbanas: string;
    valor_rendimento_medio_mensal: string;
}

interface SearchParams {
    bairro: string;
    valor: string;
    metrosQuadrados: string;
}

const formatCurrency = (value: number) =>
    // Garante que NaN ou valores muito baixos sejam tratados como 0 para formatar
    (isNaN(value) ? 0 : value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const classifyIbeu = (value: string) => {
    const num = parseFloat(value || '0');
    if (num >= 0.9) return { label: 'Muito Alto', color: COLORS.greenSuccess };
    if (num >= 0.8) return { label: 'Alto', color: COLORS.greenLight };
    if (num >= 0.7) return { label: 'Médio', color: COLORS.yellowWarning };
    if (num >= 0.6) return { label: 'Baixo', color: COLORS.orangeAlert };
    return { label: 'Muito Baixo', color: COLORS.redDanger };
};

const classifyIndicator = (value: string) => {
    const num = parseFloat(value || '0');
    if (num >= 0.9) return { label: 'Excelente', color: COLORS.greenSuccess };
    if (num >= 0.8) return { label: 'Bom', color: COLORS.greenLight };
    if (num >= 0.7) return { label: 'Regular', color: COLORS.yellowWarning };
    return { label: 'Ruim', color: COLORS.redDanger };
};

// Mapeamento de cores de fundo do Tailwind para estilos RN (com as cores da imagem)
const getRNColorStyle = (colorName: string) => {
    switch (colorName) {
        case 'bg-green-600': return { backgroundColor: COLORS.greenSuccess };
        case 'bg-lime-500': return { backgroundColor: COLORS.greenLight };
        case 'bg-yellow-500': return { backgroundColor: COLORS.yellowWarning };
        case 'bg-orange-500': return { backgroundColor: COLORS.orangeAlert };
        case 'bg-red-600': return { backgroundColor: COLORS.redDanger };
        case 'bg-indigo-600': return { backgroundColor: COLORS.indigoCard };
        case 'bg-teal-600': return { backgroundColor: COLORS.tealCard };
        case 'bg-gray-700': return { backgroundColor: COLORS.grayCard };
        default: return { backgroundColor: COLORS.label };
    }
};

/* -------------------------------------------------------------------------- */
/* COMPONENTES DE UI REUTILIZÁVEIS                                           */
/* -------------------------------------------------------------------------- */

interface InfoCardProps {
    icon: React.ComponentType<{ size: number; color: string }>;
    title: string;
    value: string;
    unit?: string;
    color: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, title, value, unit, color }) => {
    const colorStyle = getRNColorStyle(color);
    
    return (
        <View style={[styles.miniInfoCard, colorStyle]}>
            <View style={styles.miniInfoCardHeader}>
                <Icon size={16} color="#fff" />
                <Text style={styles.miniInfoCardTitle}>{title}</Text>
            </View>
            <Text style={styles.miniInfoCardValue}>
                {/* Garantindo que o valor é uma string válida, mesmo que seja 'N/A' */}
                {String(value)}
                {unit && <Text style={styles.miniInfoCardUnit}>{String(unit)}</Text>}
            </Text>
        </View>
    );
};

interface IndicatorDisplayProps {
    title: string;
    value: string;
    description: string;
    classifier: (value: string) => { label: string; color: string };
}

const IndicatorDisplay: React.FC<IndicatorDisplayProps> = ({ title, value, description, classifier }) => {
    const safeValue = String(value || '0');
    const { label, color } = classifier(safeValue);
    const badgeColorStyle = getRNColorStyle(color === COLORS.greenSuccess ? 'bg-green-600' : (color === COLORS.greenLight ? 'bg-lime-500' : 'default'));

    const displayValue = !isNaN(parseFloat(safeValue)) && parseFloat(safeValue) > 0 
        ? parseFloat(safeValue).toFixed(3) 
        : 'N/A';

    return (
        <View style={styles.indicatorDisplayCard}>
            <Text style={styles.indicatorDisplayTitle}>{title}</Text>
            <View style={styles.indicatorDisplayRow}>
                <Text style={styles.indicatorDisplayValue}>{displayValue}</Text>
                <View style={[styles.indicatorDisplayBadge, badgeColorStyle]}>
                    <Text style={styles.indicatorDisplayBadgeText}>{label}</Text>
                </View>
            </View>
            <Text style={styles.indicatorDisplayDescription}>{description}</Text>
        </View>
    );
};


/* -------------------------------------------------------------------------- */
/* TELA PRINCIPAL DE RESULTADO                                               */
/* -------------------------------------------------------------------------- */

const ResultadoScreen = () => {
    // CORREÇÃO: Usando 'as unknown as SearchParams' para forçar a tipagem de forma mais robusta e remover a linha vermelha no ambiente de desenvolvimento.
    const params = useLocalSearchParams() as unknown as SearchParams;
    const router = useRouter();

    const { bairro, valor, metrosQuadrados } = params;

    // --- Lógica de Análise Principal ---
    const analiseData = useMemo(() => {
        if (!bairro || !valor || !metrosQuadrados) return null;

        const bairroData = (BAIRROS_DATA as BairroFullData[]).find(item => item.bairro === bairro);
        if (!bairroData) return null;

        // Garante que os valores de entrada sejam números válidos
        const valorImovelNumerico = parseFloat(String(valor || '0'));
        const m2ImovelNumerico = parseInt(String(metrosQuadrados || '0'), 10);
        
        if (m2ImovelNumerico === 0 || isNaN(valorImovelNumerico) || isNaN(m2ImovelNumerico)) return null;

        const userPricePerM2 = valorImovelNumerico / m2ImovelNumerico;

        // Conversão dos dados do JSON (usa || '0' para garantir que parseFloat não retorne NaN por string vazia/undefined)
        const data = {
            ...bairroData,
            preco_minimo_fipe_m2: parseFloat(String(bairroData.preco_minimo_fipe_m2 || '0')),
            preco_medio_fipe_m2: parseFloat(String(bairroData.preco_medio_fipe_m2 || '0')),
            preco_maximo_fipe_m2: parseFloat(String(bairroData.preco_maximo_fipe_m2 || '0')),
            preco_m2_olx: parseFloat(String(bairroData.preco_m2_olx || '0')),
            valor_rendimento_medio_mensal: parseFloat(String(bairroData.valor_rendimento_medio_mensal || '0')),
            userPricePerM2,
        };

        let vantagem = {
            status: 'PREÇO JUSTO',
            message: `Seu preço/m² (${formatCurrency(userPricePerM2)}) está em linha com a média oficial do mercado do bairro. O preço médio no OLX é ${formatCurrency(data.preco_m2_olx)}.`,
            color: 'bg-yellow-500',
        };

        if (data.preco_minimo_fipe_m2 > 0 && userPricePerM2 < data.preco_minimo_fipe_m2 * 0.95) {
            vantagem = { status: 'EXCELENTE NEGÓCIO!', message: `Seu preço/m² (${formatCurrency(userPricePerM2)}) está significativamente abaixo do piso oficial (${formatCurrency(data.preco_minimo_fipe_m2)}). Além disso, seu preço está abaixo da média de anúncios do OLX (${formatCurrency(data.preco_m2_olx)}), o que é um bom indicador.`, color: 'bg-green-600' };
        } else if (userPricePerM2 < data.preco_medio_fipe_m2) {
            vantagem = { status: 'MUITO VANTAJOSO', message: `Seu preço/m² (${formatCurrency(userPricePerM2)}) está abaixo da média oficial de mercado do bairro. O preço médio no OLX é ${formatCurrency(data.preco_m2_olx)}.`, color: 'bg-lime-500' };
        } else if (userPricePerM2 > data.preco_maximo_fipe_m2) {
            vantagem = { status: 'PREÇO ELEVADO', message: `Seu preço/m² (${formatCurrency(userPricePerM2)}) está acima do teto oficial de mercado. Reavalie. O preço médio no OLX é ${formatCurrency(data.preco_m2_olx)}.`, color: 'bg-red-600' };
        }
        
        return { ...data, vantagem, m2ImovelNumerico: m2ImovelNumerico };
    }, [bairro, valor, metrosQuadrados]);


    if (!analiseData) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                        Não foi possível carregar os dados de análise para o bairro "{bairro || 'N/A'}".
                        Verifique se o bairro está cadastrado ou se há dados suficientes no arquivo de bairros.
                    </Text>
                    <TouchableOpacity onPress={() => router.replace('/')} style={styles.retryButton}>
                         <Text style={styles.retryButtonText}>Voltar para o Início</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }
    
    // Desestrutura os dados para facilitar o uso
    const data = analiseData;
    const { status, message, color: statusColor } = data.vantagem;
    const vantagemColorStyle = getRNColorStyle(statusColor);


    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* --- HEADER PERSONALIZADO --- */}
                <View style={styles.customHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft size={24} color={COLORS.primary} />
                        <Text style={styles.backButtonText}>Voltar</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>Análise para {data.bairro}</Text>
                    <View style={{width: 70}} />
                </View>

                {/* --- BOX DE RECOMENDAÇÃO (Image 2) --- */}
                <View style={[styles.recommendationBox, vantagemColorStyle]}>
                    <View style={styles.recommendationBoxHeader}>
                        <TrendingUp size={24} color="#fff" />
                        <Text style={styles.recommendationBoxStatus}>{status}</Text>
                    </View>
                    <Text style={styles.recommendationBoxPrice}>
                        {formatCurrency(data.userPricePerM2)}
                        <Text style={styles.recommendationBoxUnit}> / m² (Seu Preço)</Text>
                    </Text>
                    <Text style={styles.recommendationBoxMessage}>{message}</Text>
                </View>

                {/* --- COMPARAÇÃO DE MERCADO (Image 2 e 3) --- */}
                <Text style={styles.sectionTitle}>Comparação de Mercado (Preço/m²)</Text>
                
                <View style={styles.cardGrid}>
                    <InfoCard
                        icon={DollarSign}
                        title="VALOR TOTAL INFORMADO"
                        value={formatCurrency(data.userPricePerM2 * data.m2ImovelNumerico)}
                        unit=""
                        color="bg-gray-700" // Mudei para gray para destacar que é o dado do usuário
                    />
                    <InfoCard
                        icon={Home}
                        title="METRAGEM INFORMADA"
                        value={String(data.m2ImovelNumerico)}
                        unit=" m²"
                        color="bg-gray-700"
                    />

                    <InfoCard
                        icon={DollarSign}
                        title="PREÇO MÉDIO FIPE"
                        value={formatCurrency(data.preco_medio_fipe_m2)}
                        unit="/ m²"
                        color="bg-indigo-600"
                    />
                    <InfoCard
                        icon={Search}
                        title="PREÇO MÉDIO OLX"
                        value={formatCurrency(data.preco_m2_olx)}
                        unit="/ m²"
                        color="bg-teal-600"
                    />
                    <InfoCard
                        icon={DollarSign}
                        title="PREÇO MÍNIMO FIPE"
                        value={formatCurrency(data.preco_minimo_fipe_m2)}
                        unit="/ m²"
                        color="bg-indigo-600"
                    />
                    <InfoCard
                        icon={DollarSign}
                        title="PREÇO MÁXIMO FIPE"
                        value={formatCurrency(data.preco_maximo_fipe_m2)}
                        unit="/ m²"
                        color="bg-indigo-600"
                    />
                </View>

                {/* --- INDICADORES SOCIOECONÔMICOS (Image 3 e 4) --- */}
                <Text style={styles.sectionTitle}>Indicadores Socioeconômicos</Text>

                <View style={styles.cardGrid}>
                    <IndicatorDisplay
                        title="Índice de Bem Estar Urbano (IBEU)"
                        value={data.ibeu}
                        description="Nível de satisfação dos moradores do bairro."
                        classifier={classifyIbeu}
                    />
                    <IndicatorDisplay
                        title="Índice de Desenvolvimento Humano (IDH)"
                        value={data.idh}
                        description="Mede longevidade, educação e renda."
                        classifier={classifyIndicator}
                    />
                    <IndicatorDisplay
                        title="Condições Ambientais Urbanas"
                        value={data.condicoes_ambientais_urbanas}
                        description="Qualidade do ar, saneamento, etc."
                        classifier={classifyIndicator}
                    />
                    <IndicatorDisplay
                        title="Condições Habitacionais Urbanas"
                        value={data.condicoes_habitacionais_urbanas}
                        description="Qualidade da moradia e entorno (1 é melhor)."
                        classifier={classifyIndicator}
                    />
                </View>
                
                {/* --- RENDIMENTO MÉDIO MENSAL FAMILIAR (Image 4) --- */}
                <View style={[styles.miniInfoCard, { backgroundColor: COLORS.grayCard, width: '100%', marginTop: 5, marginBottom: 20 }]}>
                    <View style={styles.miniInfoCardHeader}>
                        <Users size={16} color="#fff" />
                        <Text style={styles.miniInfoCardTitle}>RENDIMENTO MÉDIO MENSAL FAMILIAR</Text>
                    </View>
                    <Text style={styles.miniInfoCardValue}>
                        {formatCurrency(data.valor_rendimento_medio_mensal)}
                    </Text>
                </View>

                {/* --- DICA DE DECISÃO DE COMPRA (Image 4) --- */}
                <View style={styles.dicaBox}>
                    <View style={styles.dicaHeader}>
                        <Zap size={18} color={COLORS.infoBoxText} />
                        <Text style={styles.dicaTitle}>Decisão de Compra</Text>
                    </View>
                    <Text style={styles.dicaText}>
                        Se o seu preço/m² estiver <Text style={{fontWeight: 'bold'}}>abaixo</Text> do Preço Médio FIPE, a compra
                        é considerada um bom investimento com potencial de valorização
                        imediata. Analise a classificação do <Text style={{fontWeight: 'bold'}}>IBEU</Text> e <Text style={{fontWeight: 'bold'}}>IDH</Text> para entender
                        a qualidade de vida e o desenvolvimento social do bairro.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

/* -------------------------------------------------------------------------- */
/* ESTILOS REACT NATIVE (CORRESPONDENTES ÀS IMAGENS)                         */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { padding: 15, paddingBottom: 30 },
    
    // --- Header Personalizado ---
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 5,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        marginBottom: 15,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    backButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        marginLeft: 5,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.title,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },

    // --- Box de Recomendação Principal ---
    recommendationBox: {
        padding: 20,
        borderRadius: 12,
        shadowColor: 'rgba(0,0,0,0.15)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
        marginBottom: 20,
    },
    recommendationBoxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    recommendationBoxStatus: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginLeft: 10,
        textTransform: 'uppercase',
    },
    recommendationBoxPrice: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        marginTop: 5,
    },
    recommendationBoxUnit: {
        fontSize: 14,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.85)',
    },
    recommendationBoxMessage: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 10,
        lineHeight: 20,
    },

    // --- Títulos de Seção ---
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.title,
        marginTop: 25,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8,
    },

    // --- Grid para Cards de Informação e Indicadores ---
    cardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    // Mini Info Cards (Preço FIPE, OLX, Rendimento)
    miniInfoCard: {
        width: '48%',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        justifyContent: 'space-between',
    },
    miniInfoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    miniInfoCardTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    miniInfoCardValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        marginTop: 5,
    },
    miniInfoCardUnit: {
        fontSize: 12,
        fontWeight: '300',
        opacity: 0.75,
    },

    // Cards de Indicador (IBEU, IDH, etc.)
    indicatorDisplayCard: {
        width: '48%',
        padding: 15,
        backgroundColor: COLORS.card,
        borderRadius: 10,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    indicatorDisplayTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.label,
        marginBottom: 5,
    },
    indicatorDisplayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    indicatorDisplayValue: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    indicatorDisplayBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 15,
    },
    indicatorDisplayBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    indicatorDisplayDescription: {
        fontSize: 10,
        color: COLORS.label,
        marginTop: 8,
        lineHeight: 14,
    },

    // --- Dica de Decisão de Compra ---
    dicaBox: {
        padding: 18,
        backgroundColor: COLORS.infoBoxBg,
        borderWidth: 1,
        borderColor: COLORS.infoBoxBorder,
        borderRadius: 10,
        marginTop: 20,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    dicaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    dicaTitle: {
        fontWeight: '700',
        color: COLORS.infoBoxText,
        marginLeft: 8,
        fontSize: 15,
    },
    dicaText: {
        fontSize: 13,
        color: COLORS.text,
        lineHeight: 19,
    },

    // --- Estilos de Erro ---
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.background,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.redDanger,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ResultadoScreen;