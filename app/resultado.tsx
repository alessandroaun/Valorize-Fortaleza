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

import { 
    ChevronsLeft, MapPin, DollarSign, Home, TrendingUp, Zap, Users, Search, 
    Bus, Bike, Wifi, GraduationCap, HeartPulse, BookOpen, Trees, Activity 
} from 'lucide-react-native'; // pra funcionar os ícones tem que importar o lucide-react-native

import BAIRROS_DATA from '../data/bairros.json'; //as informações de cada bairro, exceto geolocalização estão aqui
import COORDENADAS_DATA from '../data/coordenadas_bairros.json'; //para uso com a api do google maps
import BairroMapa from '../components/BairroMapa'; //componente do mapa

const { width } = Dimensions.get('window');

const COLORS = {
    background: '#0f1d2aff', 
    card: '#1E293B',
    cardSecondary: '#334155',
    
    primary: '#11ac5eff',
    accent: '#10B981',
    
    text: '#1ff087ff', 
    textPrimary: '#F8FAFC', 
    textSecondary: '#94A3B8', 
    
    greenSuccess: '#059669', 
    greenLight: '#10B981', 
    yellowWarning: '#D97706', 
    orangeAlert: '#EA580C',
    redDanger: '#DC2626',
    
    indigoCard: '#4F46E5',
    tealCard: '#0D9488',
    grayCard: '#475569',
    purpleCard: '#7C3AED',
    
    infoBoxBg: 'rgba(59, 130, 246, 0.1)', 
    infoBoxBorder: 'rgba(59, 130, 246, 0.3)',
    infoBoxText: '#60A5FA', 
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
    regional: string;
    pracas: string;
    acesso_pracas_300m_percentual: string;
    wifi_publico_wifor: string;
    pontos_de_onibus: string;
    ciclovias_km: string;
    estacoes_bicicletar: string;
    equipamentos_de_saude: string;
    escolas_municipais: string;
    escolas_estaduais: string;
    unidades_religiosas: string;
    historia: string;
}

interface CoordenadasData {
    bairro: string;
    latitude: number;
    longitude: number;
}

interface SearchParams {
    bairro: string;
    valor: string;
    metrosQuadrados: string;
}

const formatCurrency = (value: number) =>
    (isNaN(value) ? 0 : value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

//aqui esta a lógica por tras da medida oficial do indice de bem estar urbano fornecida pela prefeitura
const classifyIbeu = (value: string) => {
    const num = parseFloat(value || '0');
    if (num >= 0.9) return { label: 'Muito Alto', color: COLORS.greenLight };
    if (num >= 0.8) return { label: 'Alto', color: COLORS.greenLight };
    if (num >= 0.7) return { label: 'Médio', color: COLORS.yellowWarning };
    if (num >= 0.6) return { label: 'Baixo', color: COLORS.orangeAlert };
    return { label: 'Muito Baixo', color: COLORS.redDanger };
};
// o restante da lógica dos indicadores estao aqui
const classifyIndicator = (value: string) => {
    const num = parseFloat(value || '0');
    if (num >= 0.9) return { label: 'Excelente', color: COLORS.greenLight };
    if (num >= 0.8) return { label: 'Bom', color: COLORS.greenLight };
    if (num >= 0.7) return { label: 'Regular', color: COLORS.yellowWarning };
    return { label: 'Ruim', color: COLORS.redDanger };
};
//logica por tras da situacao de mobilidade do bairro
const calculateMobilityStatus = (bus: string, bikes: string, ciclovias: string) => {
    const nBus = parseInt(bus || '0', 10);
    const nBikes = parseInt(bikes || '0', 10);
    const nCiclo = parseFloat(ciclovias || '0');
    const score = (nBus * 1) + (nBikes * 5) + (nCiclo * 3);

    if (score > 60) return { label: 'Excelente', color: COLORS.greenLight };
    if (score > 30) return { label: 'Boa', color: COLORS.greenLight };
    if (score > 15) return { label: 'Regular', color: COLORS.yellowWarning };
    return { label: 'Limitada', color: COLORS.orangeAlert };
};
//logica por tras da situacao da educacao e saude do bairro
const calculateEduHealthStatus = (totalSchools: number, healthUnits: number) => {
    const score = totalSchools + (healthUnits * 3);

    if (score > 25) return { label: 'Excelente', color: COLORS.greenLight };
    if (score > 15) return { label: 'Boa', color: COLORS.greenLight };
    if (score > 5) return { label: 'Regular', color: COLORS.yellowWarning };
    return { label: 'Limitada', color: COLORS.orangeAlert };
};

const getRNColorStyle = (colorName: string) => {
    switch (colorName) {
        case 'bg-green-600': return { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: COLORS.greenLight, borderWidth: 1 };
        case 'bg-lime-500': return { backgroundColor: 'rgba(132, 204, 22, 0.2)', borderColor: '#A3E635', borderWidth: 1 };
        case 'bg-yellow-500': return { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#FBBF24', borderWidth: 1 };
        case 'bg-orange-500': return { backgroundColor: 'rgba(249, 115, 22, 0.2)', borderColor: '#FB923C', borderWidth: 1 };
        case 'bg-red-600': return { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#F87171', borderWidth: 1 };
        default: return { backgroundColor: COLORS.cardSecondary };
    }
};

interface InfoCardProps {
    icon: React.ComponentType<{ size: number; color: string }>;
    title: string;
    value: string;
    unit?: string;
    color?: string;
    valueStyle?: StyleProp<TextStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    iconColorOverride?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, title, value, unit, color, valueStyle, containerStyle, iconColorOverride }) => {
    let iconColor = iconColorOverride || COLORS.text;
    
    if (!iconColorOverride) {
        if (title.includes('FIPE')) iconColor = '#818CF8';
        if (title.includes('OLX')) iconColor = '#2DD4BF';
        if (title.includes('TOTAL') || title.includes('METRAGEM')) iconColor = COLORS.textSecondary;
        if (title.includes('ÔNIBUS')) iconColor = '#F59E0B'; 
        if (title.includes('CICLO') || title.includes('BICICLETAR')) iconColor = '#10B981'; 
        if (title.includes('ESCOLAS')) iconColor = '#A78BFA'; 
        if (title.includes('SAÚDE')) iconColor = '#F43F5E'; 
        if (title.includes('SITUAÇÃO')) iconColor = COLORS.textPrimary; 
    }

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

interface InputDisplayCardProps {
    totalValue: number;
    area: number;
}

const InputDisplayCard: React.FC<InputDisplayCardProps> = ({ totalValue, area }) => (
    <View style={styles.inputDisplayCardContainer}>
        <View style={styles.inputDisplayItemLeft}>
            <View style={styles.inputDisplayHeader}>
                <DollarSign size={24} color={COLORS.primary} />
                <Text 
                    style={styles.inputDisplayTitle} 
                    numberOfLines={1} 
                    ellipsizeMode="tail"
                >
                    VALOR TOTAL
                </Text>
            </View>
            <Text 
                style={styles.inputDisplayValueTotal}
                numberOfLines={1} 
                ellipsizeMode="tail"
            > 
                {formatCurrency(totalValue)}
            </Text>
        </View>

        <View style={styles.inputDisplaySeparator} />

        <View style={styles.inputDisplayItem}>
            <View style={styles.inputDisplayHeader}>
                <Home size={24} color={COLORS.primary} />
                <Text 
                    style={styles.inputDisplayTitle}
                    numberOfLines={1} 
                    ellipsizeMode="tail"
                >
                    ÁREA TOTAL (M²)
                </Text>
            </View>
            <Text 
                style={styles.inputDisplayValue}
                numberOfLines={1} 
                ellipsizeMode="tail"
            > 
                {area}
                <Text style={styles.inputDisplayUnit}> m²</Text>
            </Text>
        </View>
    </View>
);


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

        const mobilityStatus = calculateMobilityStatus(
            bairroData.pontos_de_onibus, 
            bairroData.estacoes_bicicletar, 
            bairroData.ciclovias_km
        );

        const nEscolasMun = parseInt(bairroData.escolas_municipais || '0', 10);
        const nEscolasEst = parseInt(bairroData.escolas_estaduais || '0', 10);
        const totalEscolas = nEscolasMun + nEscolasEst;
        const nSaude = parseInt(bairroData.equipamentos_de_saude || '0', 10);

        const eduHealthStatus = calculateEduHealthStatus(totalEscolas, nSaude);

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
        
        return { 
            ...data, 
            vantagem, 
            m2ImovelNumerico: m2ImovelNumerico, 
            valorImovelNumerico: valorImovelNumerico, 
            mobilityStatus,
            totalEscolas,
            eduHealthStatus 
        };
    }, [bairro, valor, metrosQuadrados]);

    const coordenadasBairro = useMemo<CoordenadasData | undefined>(() => {
        return COORDENADAS_DATA.find(item => item.bairro === bairro) as CoordenadasData | undefined;
    }, [bairro]);


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
                
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronsLeft size={28} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Análise de Mercado</Text>
                    <View style={{width: 28}} /> 
                </View>

                <Text style={styles.bairroTitle}>{data.bairro}</Text>
                
                <View style={styles.regionalBadgeContainer}>
                    <View style={styles.regionalBadge}>
                        <MapPin size={12} color={COLORS.textPrimary} style={{marginRight: 4}}/>
                        <Text style={styles.regionalText}>{data.regional || 'Regional N/A'}</Text>
                    </View>
                </View>

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
                    
                    <InputDisplayCard 
                        totalValue={data.valorImovelNumerico}
                        area={data.m2ImovelNumerico}
                    />

                    <View style={styles.rowContainer}>
                        <InfoCard
                            icon={DollarSign}
                            title="PREÇO MÉDIO FIPE"
                            value={formatCurrency(data.preco_medio_fipe_m2)}
                            unit='/m²'
                            color="bg-indigo-600"
                            containerStyle={{width: '48%'}}
                        />
                        <InfoCard
                            icon={Search}
                            title="PREÇO MÉDIO OLX"
                            value={formatCurrency(data.preco_m2_olx)}
                            unit='/m²'
                            color="bg-teal-600"
                            containerStyle={{width: '48%'}}
                        />
                    </View>
                    
                    <View style={styles.rowContainer}>
                        <InfoCard
                            icon={DollarSign}
                            title="PREÇO MÍNIMO FIPE"
                            value={formatCurrency(data.preco_minimo_fipe_m2)}
                            unit='/m²'
                            color="bg-indigo-600"
                            containerStyle={{width: '48%'}}
                        />
                        <InfoCard
                            icon={DollarSign}
                            title="PREÇO MÁXIMO FIPE"
                            value={formatCurrency(data.preco_maximo_fipe_m2)}
                            unit='/m²'
                            color="bg-indigo-600"
                            containerStyle={{width: '48%'}}
                        />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Mobilidade</Text>
                <View style={styles.gridContainer}>
                    <View style={styles.rowContainer}>
                        <InfoCard
                            icon={Bus}
                            title="QUANTIDADE DE PONTOS DE ÔNIBUS"
                            value={data.pontos_de_onibus || '0'}
                            containerStyle={{width: '48%'}}
                        />
                         <InfoCard
                            icon={Bike}
                            title="QUANTIDADE DE ESTAÇÕES BICICLETAR"
                            value={data.estacoes_bicicletar || '0'}
                            containerStyle={{width: '48%'}}
                        />
                    </View>
                    <View style={styles.rowContainer}>
                        <InfoCard
                            icon={Bike}
                            title="CICLOVIAS NO BAIRRO (KM)"
                            value={data.ciclovias_km || '0'}
                            unit=" km"
                            containerStyle={{width: '48%'}}
                        />
                        <InfoCard
                            icon={Activity}
                            title="SITUAÇÃO MOBILIDADE"
                            value={data.mobilityStatus.label}
                            valueStyle={{ color: data.mobilityStatus.color }}
                            iconColorOverride={data.mobilityStatus.color}
                            containerStyle={{width: '48%'}}
                        />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Educação e Saúde</Text>
                <View style={styles.gridContainer}>
                      <View style={styles.rowContainer}>
                        <InfoCard
                            icon={GraduationCap}
                            title="QUANTIDADE DE ESCOLAS PÚBLICAS"
                            value={String(data.totalEscolas)}
                            containerStyle={{width: '48%'}}
                        />
                        <InfoCard
                            icon={HeartPulse}
                            title="QUANTIDADE DE UNIDADES DE SAÚDE"
                            value={data.equipamentos_de_saude || '0'}
                            containerStyle={{width: '48%'}}
                        />
                    </View>
                    <View style={styles.rowContainer}>
                           <InfoCard
                            icon={BookOpen}
                            title="QUANTIDADE DE IGREJAS E TEMPLOS"
                            value={data.unidades_religiosas || '0'}
                            containerStyle={{width: '48%'}}
                        />
                        <InfoCard
                            icon={Activity}
                            title="SITUAÇÃO DA EDUCAÇÃO E SAÚDE"
                            value={data.eduHealthStatus.label}
                            valueStyle={{ color: data.eduHealthStatus.color }}
                            iconColorOverride={data.eduHealthStatus.color}
                            containerStyle={{width: '48%'}}
                        />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Lazer e Conectividade</Text>
                <View style={styles.gridContainer}>
                      <View style={styles.rowContainer}>
                        <InfoCard
                            icon={Trees}
                            title="PRAÇAS"
                            value={data.pracas || '0'}
                            containerStyle={{width: '32%'}}
                        />
                        <InfoCard
                            icon={Trees}
                            title="ACESSO A PRAÇAS"
                            value={data.acesso_pracas_300m_percentual || '0'}
                            unit="%"
                            containerStyle={{width: '32%'}}
                        />
                          <InfoCard
                            icon={Wifi}
                            title="WIFI PÚBLICO"
                            value={data.wifi_publico_wifor || '0'}
                            containerStyle={{width: '32%'}}
                        />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Qualidade de Vida</Text>
                <View style={styles.gridContainer}>
                    <View style={styles.rowContainer}>
                        <IndicatorDisplay
                            title="Índice de Bem-Estar Urbano (IBEU)"
                            value={data.ibeu}
                            description="Nível de satisfação dos moradores do bairro"
                            classifier={classifyIbeu}
                        />
                        <IndicatorDisplay
                            title="Índice de Desenvolvimento Humano (IDH)"
                            value={data.idh}
                            description="Mede longevidade, educação e renda"
                            classifier={classifyIndicator}
                        />
                    </View>
                    <View style={styles.rowContainer}>
                        <IndicatorDisplay
                            title="Índice de Situação Ambiental"
                            value={data.condicoes_ambientais_urbanas}
                            description="Qualidade do ar e saneamento"
                            classifier={classifyIndicator}
                        />
                        <IndicatorDisplay
                            title="Índice de Situação Habitacional"
                            value={data.condicoes_habitacionais_urbanas}
                            description="Qualidade da moradia e infraestrutura"
                            classifier={classifyIndicator}
                        />
                    </View>
                </View>
                
                <View style={styles.incomeCard}>
                    <View style={styles.incomeHeader}>
                        <Users size={18} color={COLORS.textSecondary} />
                        <Text style={styles.incomeTitle}>RENDA MÉDIA MENSAL DAS FAMÍLIAS DO BAIRRO </Text>
                    </View>
                    <Text style={styles.incomeValue}>
                        {formatCurrency(data.valor_rendimento_medio_mensal)}
                    </Text>
                </View>

                {data.historia && (
                    <>
                        <Text style={styles.sectionTitle}>História e Curiosidades</Text>
                        <View style={styles.historyBox}>
                            <Text style={styles.historyText}>
                                {data.historia}
                            </Text>
                        </View>
                    </>
                )}

                {coordenadasBairro && ( //peço por gentileza que não compartilhe minha chave de API do google maps
                    <View style={styles.mapContainer}>
                            <Text style={styles.sectionTitle}>Localização</Text>
                            <BairroMapa 
                                bairro={data.bairro}
                                latitude={coordenadasBairro.latitude}
                                longitude={coordenadasBairro.longitude}
                            />
                    </View>
                )}

                <View style={styles.tipBox}>
                    <View style={styles.tipHeader}>
                        <Zap size={20} color={COLORS.infoBoxText} />
                        <Text style={styles.tipTitle}>Dica de Investimento</Text>
                    </View>
                    <Text style={styles.tipText}>
                        Imóveis abaixo da média FIPE em bairros com alta infraestrutura de transporte e educação tendem a ter maior liquidez e valorização. Se o seu preço/m² estiver <Text style={{fontWeight: 'bold'}}>abaixo</Text> do Preço Médio FIPE, a compra é considerada um bom investimento com potencial de valorização imediata. Analise a classificação do <Text style={{fontWeight: 'bold'}}>IBEU</Text> e <Text style={{fontWeight: 'bold'}}>IDH</Text> para entender a qualidade de vida e o desenvolvimento social do bairro. Compare sempre com o estado de conservação do imóvel.
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
    
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        paddingVertical: 18,
    
    },
    bairroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 5,
         
    },
    regionalBadgeContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    regionalBadge: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardSecondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
    },
    regionalText: {
        color: COLORS.textPrimary,
        fontSize: 12,
        fontWeight: '700',
    },

    mapContainer: {
        marginBottom: 25,
    },

    recommendationBox: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 25,
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
        lineHeight: 18,
    },

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

    gridContainer: {
        marginBottom: 10,
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    
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
        opacity: 0.9,
    },
    miniInfoCardTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginLeft: 6,
        textTransform: 'uppercase',
        flex: 1,
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

    inputDisplayCardContainer: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    inputDisplayItem: {
        alignItems: 'center', 
        flex: 1,
    },
    inputDisplayItemLeft: { 
        alignItems: 'flex-start', 
        flex: 1,
    },
    inputDisplayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    inputDisplayTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginLeft: 8,
        textTransform: 'uppercase',
        flexShrink: 1, 
    },
    inputDisplayValue: {
        fontSize: 24, 
        fontWeight: '900',
        color: COLORS.textPrimary,
    },
    inputDisplayValueTotal: {
        fontSize: 20, 
        fontWeight: '900',
        color: COLORS.textPrimary,
    },
    inputDisplayUnit: {
        fontSize: 16,
        fontWeight: '400',
        color: COLORS.textSecondary,
    },
    inputDisplaySeparator: {
        width: 1,
        height: '80%',
        backgroundColor: COLORS.cardSecondary,
    },


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

    incomeCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: COLORS.grayCard,
        alignItems: 'center',
        marginTop: 10,
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

    historyBox: {
        backgroundColor: COLORS.card,
        padding: 20,
        borderRadius: 16,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: COLORS.grayCard,
    },
    historyText: {
        color: COLORS.textPrimary,
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'justify',
        opacity: 0.9,
    },

    tipBox: {
        backgroundColor: COLORS.infoBoxBg,
        borderWidth: 1,
        borderColor: COLORS.infoBoxBorder,
        borderRadius: 16,
        padding: 20,
        marginTop: 10,
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
        textAlign: 'justify',
    },

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