import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import BAIRROS_DATA from '../data/bairros.json';

interface BairroData {
    bairro: string;
    preco_medio_fipe_m2: string;
}

interface SearchParams {
    bairro: string;
    valor: string; 
    metrosQuadrados: string; 
}

const ResultadoScreen = () => {
    const params = useLocalSearchParams<SearchParams>();
    const { bairro, valor, metrosQuadrados } = params;

    const valorNumerico = parseFloat(valor?.replace(',', '.') || '0');
    const areaNumerica = parseInt(metrosQuadrados || '0', 10);
    const precoM2Informado = areaNumerica > 0 ? valorNumerico / areaNumerica : 0;

    const dadosMercado = useMemo(() => {
        return (BAIRROS_DATA as BairroData[]).find(
            item => item.bairro === bairro
        );
    }, [bairro]);

    const precoMedioM2String = dadosMercado?.preco_medio_fipe_m2 || '0';
    const precoMedioM2Numerico = parseFloat(precoMedioM2String);
    const valorMercadoEstimado = precoMedioM2Numerico * areaNumerica;

    const diferenca = valorNumerico - valorMercadoEstimado;
    const percentualDiferenca = (diferenca / valorMercadoEstimado) * 100;
    
    let recomendacao = '';
    let corRecomendacao = '#333';

    if (!dadosMercado) {
        recomendacao = 'Dados de mercado não encontrados para este bairro.';
        corRecomendacao = '#ffc107';
    } else if (percentualDiferenca > 5) {
        recomendacao = `Alto: O preço sugerido está ${Math.abs(percentualDiferenca).toFixed(1)}% acima da média de mercado!`;
        corRecomendacao = '#dc3545';
    } else if (percentualDiferenca < -5) {
        recomendacao = `Baixo: O preço sugerido está ${Math.abs(percentualDiferenca).toFixed(1)}% abaixo da média de mercado. Boa oportunidade!`;
        corRecomendacao = '#28a745';
    } else {
        recomendacao = 'Equilibrado: O preço está em linha com a média de mercado (+/- 5%).';
        corRecomendacao = '#007AFF';
    }


    const formatCurrency = (value: number) => 
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: 'Resultado da Avaliação' }} />
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Avaliação de Mercado 📈</Text>
                
                {}
                <View style={[styles.card, { marginBottom: 20, backgroundColor: corRecomendacao }]}>
                    <Text style={styles.recommendationTitle}>Recomendação:</Text>
                    <Text style={styles.recommendationText}>{recomendacao}</Text>
                </View>

                {}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Dados do Imóvel</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Bairro:</Text>
                        <Text style={styles.detailValue}>{bairro || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Área Total:</Text>
                        <Text style={styles.detailValue}>{areaNumerica} m²</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Valor Informado:</Text>
                        <Text style={styles.detailValue}>{formatCurrency(valorNumerico)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Preço/m² Informado:</Text>
                        <Text style={styles.detailValue}>{formatCurrency(precoM2Informado)}</Text>
                    </View>
                </View>

                {}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Análise de Mercado (FIPE/OLX)</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Média FIPE/m² (Bairro):</Text>
                        <Text style={styles.detailValue}>{formatCurrency(precoMedioM2Numerico)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Valor de Mercado Estimado:</Text>
                        <Text style={styles.detailValueResult}>{formatCurrency(valorMercadoEstimado)}</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f0f5' },
    container: { flex: 1, padding: 15 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 25, color: '#333', textAlign: 'center' },
    
    card: { 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        padding: 20, 
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recommendationTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
    recommendationText: { fontSize: 16, color: '#fff' },

    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, color: '#007AFF' },
    
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    detailLabel: { fontSize: 15, color: '#555' },
    detailValue: { fontSize: 15, fontWeight: '600', color: '#333' },
    detailValueResult: { fontSize: 16, fontWeight: '700', color: '#28a745' },
});

export default ResultadoScreen;