import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Dimensions,
    TouchableOpacity,
    StyleProp, 
    TextStyle, 
    ViewStyle,
    StatusBar
} from 'react-native';

import { ChevronLeft, MapPin, DollarSign, Home, TrendingUp, Zap, Users, Search } from 'lucide-react-native';

import BAIRROS_DATA from '../data/bairros.json';

const { width } = Dimensions.get('window');

// 🌑 --- PALETA DE CORES DARK (Consistente com index.tsx) ---
const COLORS = {
    background: '#0f1d2aff', 
    card: '#1E293B',
    cardSecondary: '#334155', // Usado para cards menores dentro do principal
    
    primary: '#11ac5eff',
    accent: '#10B981',
    
    text: '#1ff087ff', // Verde claro vibrante para destaques de texto
    textPrimary: '#F8FAFC', // Branco para textos principais
    textSecondary: '#94A3B8', // Cinza para legendas
    
    // Cores de Status (Adaptadas para Dark Mode)
    greenSuccess: '#059669', // Verde mais escuro para fundo
    greenLight: '#10B981',   // Verde vibrante
    yellowWarning: '#D97706', // Laranja/Amarelo escuro
    orangeAlert: '#EA580C',
    redDanger: '#DC2626',
    
    indigoCard: '#4F46E5',
    tealCard: '#0D9488',
    grayCard: '#475569',
    
    infoBoxBg: 'rgba(59, 130, 246, 0.1)', // Azul transparente
    infoBoxBorder: 'rgba(59, 130, 246, 0.3)',
    infoBoxText: '#60A5FA', // Azul claro
};

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
    (isNaN(value) ? 0 : value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

// Funções de Classificação (Cores ajustadas para texto ou badge)
const classifyIbeu = (value: string) => {
    const num = parseFloat(value || '0');
    if (num >= 0.9) return { label: 'Muito Alto', color: COLORS.greenLight };
    if (num >= 0.8) return { label: 'Alto', color: COLORS.greenLight };
    if (num >= 0.7) return { label: 'Médio', color: COLORS.yellowWarning };
    if (num >= 0.6) return { label: 'Baixo', color: COLORS.orangeAlert };
    return { label: 'Muito Baixo', color: COLORS.redDanger };
};

const classifyIndicator = (value: string) => {
    const num = parseFloat(value || '0');
    if (num >= 0.9) return { label: 'Excelente', color: COLORS.greenLight };
    if (num >= 0.8) return { label: 'Bom', color: COLORS.greenLight };
    if (num >= 0.7) return { label: 'Regular', color: COLORS.yellowWarning };
    return { label: 'Ruim', color: COLORS.redDanger };
};

// Estilos de cor para backgrounds (Badges e Cards)
const getRNColorStyle = (colorName: string) => {
    switch (colorName) {
        case 'bg-green-600': return { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: COLORS.greenLight, borderWidth: 1 };
        case 'bg-lime-500': return { backgroundColor: 'rgba(132, 204, 22, 0.2)', borderColor: '#A3E635', borderWidth: 1 };
        case 'bg-yellow-500': return { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#FBBF24', borderWidth: 1 };
        case 'bg-orange-500': return { backgroundColor: 'rgba(249, 115, 22, 0.2)', borderColor: '#FB923C', borderWidth: 1 };
        case 'bg-red-600': return { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#F87171', borderWidth: 1 };
        case 'bg-indigo-600': return { backgroundColor: COLORS.cardSecondary }; // Cards neutros
        case 'bg-teal-600': return { backgroundColor: COLORS.cardSecondary };
        case 'bg-gray-700': return { backgroundColor: COLORS.cardSecondary };
        default: return { backgroundColor: COLORS.cardSecondary };
    }
};

interface InfoCardProps {
    icon: React.ComponentType<{ size: number; color: string }>;
    title: string;
    value: string;
    unit?: string;
    color: string; // Mantido para compatibilidade, mas a cor visual será controlada pelo estilo dark
    valueStyle?: StyleProp<TextStyle>;
    containerStyle?: StyleProp<ViewStyle>;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, title, value, unit, color, valueStyle, containerStyle }) => {
    // No tema dark, usamos uma cor de card padrão e ícones coloridos para diferenciar
    let iconColor = COLORS.text;
    if (title.includes('FIPE')) iconColor = '#818CF8'; // Indigo claro
    if (title.includes('OLX')) iconColor = '#2DD4BF'; // Teal claro
    if (title.includes('TOTAL') || title.includes('METRAGEM')) iconColor = COLORS.textSecondary;

    return (
        <View style={[styles.miniInfoCard, containerStyle]}>
            <View style={styles.miniInfoCardHeader}>
                <Icon size={16} color={iconColor} />
                <Text style={styles.miniInfoCardTitle}>{title}</Text>
            </View>
            <Text 
                style={[styles.miniInfoCardValue, valueStyle]}
                numberOfLines={1}
                ellipsizeMode="tail"
            >
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
    
    const displayValue = !isNaN(parseFloat(safeValue)) && parseFloat(safeValue) > 0 
        ? parseFloat(safeValue).toFixed(3) 
        : 'N/A';

    return (
        <View style={styles.indicatorDisplayCard}>
            <Text style={styles.indicatorDisplayTitle}>{title}</Text>
            <View style={styles.indicatorDisplayRow}>
                <Text style={styles.indicatorDisplayValue}>{displayValue}</Text>
                <View style={[styles.indicatorDisplayBadge, { borderColor: color }]}>
                    <Text style={[styles.indicatorDisplayBadgeText, { color: color }]}>{label}</Text>
                </View>
            </View>
            <Text style={styles.indicatorDisplayDescription}>{description}</Text>
        </View>
    );
};

const ResultadoScreen = () => {
    const params = useLocalSearchParams() as unknown as SearchParams;
    const router = useRouter();

    const { bairro, valor, metrosQuadrados } = params;

    const analiseData = useMemo(() => {
        if (!bairro || !valor || !metrosQuadrados) return null;

        const bairroData = (BAIRROS_DATA as BairroFullData[]).find(item => item.bairro === bairro);
        if (!bairroData) return null;

        const valorImovelNumerico = parseFloat(String(valor || '0'));
        const m2ImovelNumerico = parseInt(String(metrosQuadrados || '0'), 10);
        
        if (m2ImovelNumerico === 0 || isNaN(valorImovelNumerico) || isNaN(m2ImovelNumerico)) return null;

        const userPricePerM2 = valorImovelNumerico / m2ImovelNumerico;

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
            vantagem = { status: 'EXCELENTE NEGÓCIO!', message: `Seu preço/m² (${formatCurrency(userPricePerM2)}) está significativamente abaixo do Preço Mínimo da FIPE dos imóveis (${formatCurrency(data.preco_minimo_fipe_m2)}). Além disso, seu preço está abaixo da média de anúncios do OLX (${formatCurrency(data.preco_m2_olx)}), o que é um bom indicador.`, color: 'bg-green-600' };
        } else if (userPricePerM2 < data.preco_medio_fipe_m2) {
            vantagem = { status: 'MUITO VANTAJOSO', message: `Seu preço/m² (${formatCurrency(userPricePerM2)}) está abaixo da média oficial de mercado do bairro. O preço médio no OLX é ${formatCurrency(data.preco_m2_olx)}.`, color: 'bg-lime-500' };
        } else if (userPricePerM2 > data.preco_maximo_fipe_m2) {
            vantagem = { status: 'PREÇO ELEVADO', message: `Seu preço/m² (${formatCurrency(userPricePerM2)}) está acima do valor oficial de mercado. Reavalie. O preço médio no OLX é ${formatCurrency(data.preco_m2_olx)}.`, color: 'bg-red-600' };
        }
        
        return { ...data, vantagem, m2ImovelNumerico: m2ImovelNumerico };
    }, [bairro, valor, metrosQuadrados]);


    if (!analiseData) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                        Dados indisponíveis para "{bairro}".
                    </Text>
                    <TouchableOpacity onPress={() => router.replace('/')} style={styles.retryButton}>
                         <Text style={styles.retryButtonText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }
    
    const data = analiseData;
    const { status, message, color: statusColor } = data.vantagem;
    const vantagemColorStyle = getRNColorStyle(statusColor);


    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <Stack.Screen options={{ headerShown: false }} />
            
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* HEADER SIMPLES */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft size={28} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Análise de Mercado</Text>
                    <View style={{width: 28}} /> 
                </View>

                <Text style={styles.bairroTitle}>{data.bairro}</Text>

                {/* BOX DE RESULTADO PRINCIPAL */}
                <View style={[styles.recommendationBox, vantagemColorStyle]}>
                    <View style={styles.recommendationHeader}>
                        <TrendingUp size={24} color={COLORS.textPrimary} />
                        <Text style={styles.recommendationStatus}>{status}</Text>
                    </View>
                    <Text style={styles.recommendationPrice}>
                        {formatCurrency(data.userPricePerM2)}
                        <Text style={styles.recommendationUnit}> / m²</Text>
                    </Text>
                    <Text style={styles.recommendationSubtext}>{message}</Text>
                </View>

                <Text style={styles.sectionTitle}>Comparativo de Preços (m²)</Text>
                
                <View style={styles.gridContainer}>
                    {/* Dados do Usuário */}
                    <InfoCard
                        icon={DollarSign}
                        title="VALOR TOTAL DO IMÓVEL FORNECIDO POR VOCÊ"
                        value={formatCurrency(data.userPricePerM2 * data.m2ImovelNumerico)}
                        color="bg-gray-700"
                        containerStyle={{width: '100%', marginBottom: 10}}
                        valueStyle={{fontSize: 24, color: COLORS.textPrimary}}
                    />

                    {/* Dados de Mercado (FIPE e OLX) */}
                    <View style={styles.rowContainer}>
                        <InfoCard
                            icon={DollarSign}
                            title="PREÇO MÉDIO FIPE"
                            value={formatCurrency(data.preco_medio_fipe_m2)}
                            color="bg-indigo-600"
                            unit="/ m²"
                            containerStyle={{width: '48%'}}
                        />
                        <InfoCard
                            icon={Search}
                            title="PREÇO MÉDIO OLX"
                            value={formatCurrency(data.preco_m2_olx)}
                            color="bg-teal-600"
                            unit="/ m²"
                            containerStyle={{width: '48%'}}
                        />
                    </View>
                    
                    <View style={styles.rowContainer}>
                        <InfoCard
                            icon={DollarSign}
                            title="PREÇO MÍNIMO FIPE"
                            value={formatCurrency(data.preco_minimo_fipe_m2)}
                            color="bg-indigo-600"
                            unit="/ m²"
                            containerStyle={{width: '48%'}}
                        />
                        <InfoCard
                            icon={DollarSign}
                            title="PREÇO MÁXIMO FIPE"
                            value={formatCurrency(data.preco_maximo_fipe_m2)}
                            color="bg-indigo-600"
                            unit="/ m²"
                            containerStyle={{width: '48%'}}
                        />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Qualidade de Vida no Bairro</Text>

                <View style={styles.gridContainer}>
                    <View style={styles.rowContainer}>
                        <IndicatorDisplay
                            title="IBEU"
                            value={data.ibeu}
                            description="Nível de satisfação dos moradores do bairro."
                            classifier={classifyIbeu}
                        />
                        <IndicatorDisplay
                            title="IDH"
                            value={data.idh}
                            description="Mede longevidade, educação e renda."
                            classifier={classifyIndicator}
                        />
                    </View>
                    <View style={styles.rowContainer}>
                        <IndicatorDisplay
                            title="Ambiental"
                            value={data.condicoes_ambientais_urbanas}
                            description="Qualidade do ar, saneamento, etc."
                            classifier={classifyIndicator}
                        />
                        <IndicatorDisplay
                            title="Habitacional"
                            value={data.condicoes_habitacionais_urbanas}
                            description="Qualidade da infraestrutura imobiliária."
                            classifier={classifyIndicator}
                        />
                    </View>
                </View>
                
                <View style={styles.incomeCard}>
                    <View style={styles.incomeHeader}>
                        <Users size={18} color={COLORS.textSecondary} />
                        <Text style={styles.incomeTitle}>RENDA MÉDIA MENSAL FAMILIAR DO BAIRRO</Text>
                    </View>
                    <Text style={styles.incomeValue}>
                        {formatCurrency(data.valor_rendimento_medio_mensal)}
                    </Text>
                </View>

                <View style={styles.tipBox}>
                    <View style={styles.tipHeader}>
                        <Zap size={20} color={COLORS.infoBoxText} />
                        <Text style={styles.tipTitle}>Dica de Investimento</Text>
                    </View>
                    <Text style={styles.tipText}>
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
    
    // HEADER
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    bairroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 20,
        textAlign: 'center',
    },

    // BOX DE RESULTADO
    recommendationBox: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 25,
        // Estilo de borda brilhante sutil
        borderWidth: 1,
    },
    recommendationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    recommendationStatus: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginLeft: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    recommendationPrice: {
        fontSize: 36,
        fontWeight: '900',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 10,
    },
    recommendationUnit: {
        fontSize: 16,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.7)',
    },
    recommendationSubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 20,
    },

    // SEÇÕES
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 15,
        marginTop: 10,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        paddingLeft: 10,
    },

    // GRIDS E CARDS
    gridContainer: {
        marginBottom: 20,
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    
    // INFO CARD (Preços)
    miniInfoCard: {
        backgroundColor: COLORS.cardSecondary,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
    },
    miniInfoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        opacity: 0.8,
    },
    miniInfoCardTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginLeft: 6,
        textTransform: 'uppercase',
    },
    miniInfoCardValue: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    miniInfoCardUnit: {
        fontSize: 12,
        fontWeight: '400',
        color: COLORS.textSecondary,
    },

    // INDICADORES (IDH, IBEU)
    indicatorDisplayCard: {
        width: '48%',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.grayCard,
    },
    indicatorDisplayTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    indicatorDisplayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    indicatorDisplayValue: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    indicatorDisplayBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    indicatorDisplayBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    indicatorDisplayDescription: {
        fontSize: 11,
        color: COLORS.textSecondary,
        lineHeight: 14,
        opacity: 0.7,
    },

    // CARD RENDA
    incomeCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: COLORS.grayCard,
        alignItems: 'center',
    },
    incomeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    incomeTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginLeft: 8,
        textTransform: 'uppercase',
    },
    incomeValue: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },

    // DICA
    tipBox: {
        backgroundColor: COLORS.infoBoxBg,
        borderWidth: 1,
        borderColor: COLORS.infoBoxBorder,
        borderRadius: 16,
        padding: 20,
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.infoBoxText,
        marginLeft: 10,
    },
    tipText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },

    // ERRO
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.background,
    },
    errorText: {
        fontSize: 18,
        color: COLORS.textSecondary,
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    retryButtonText: {
        color: COLORS.textPrimary,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ResultadoScreen;