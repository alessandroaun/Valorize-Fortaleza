import React, { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { useRouter } from 'expo-router';

import BAIRROS_DATA from '../../data/bairros.json';

interface Bairro {
  bairro: string;
}

/* -------------------------------------------
   CORREÇÃO: Lista de bairros 100% segura
---------------------------------------------- */
const BAIRROS_NOMES: string[] = BAIRROS_DATA
  .filter(item => item.bairro && typeof item.bairro === "string")
  .map(item => item.bairro.trim());

const HomeScreen = () => {
  const router = useRouter(); 
  
  const [bairroSelecionado, setBairroSelecionado] = useState('');
  const [valorImovel, setValorImovel] = useState('');
  const [metrosQuadrados, setMetrosQuadrados] = useState('');
  const [isBairroCollapsed, setIsBairroCollapsed] = useState(true);

  const handlePesquisar = () => {
    if (!bairroSelecionado || !valorImovel || !metrosQuadrados) {
        return;
    }

    const dadosPesquisa = {
        bairro: bairroSelecionado,
        valor: valorImovel,
        metrosQuadrados: metrosQuadrados,
    };

    router.push({
        pathname: '/resultado',
        params: dadosPesquisa
    });
  };

  const selectBairro = (bairro: string) => {
    setBairroSelecionado(bairro);
    setIsBairroCollapsed(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <Text style={styles.title}>Avaliação Imobiliária Inteligente</Text>

        {/* --- 1. Menu Acordeão --- */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bairro:</Text>

          <TouchableOpacity 
            style={styles.accordionHeader} 
            onPress={() => setIsBairroCollapsed(!isBairroCollapsed)}
          >
            <Text style={styles.accordionHeaderText}>
              {bairroSelecionado || 'Selecione um Bairro'}
            </Text>
            <Text>{isBairroCollapsed ? '▼' : '▲'}</Text>
          </TouchableOpacity>

          {!isBairroCollapsed && (
            <View style={styles.accordionContent}>
              {BAIRROS_NOMES.map((bairro, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.bairroOption}
                  onPress={() => selectBairro(bairro)}
                >
                  <Text style={styles.bairroText}>{bairro}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* --- 2. Valor do Imóvel --- */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Valor do Imóvel (R$):</Text>
          <TextInput
            style={styles.textInput}
            onChangeText={setValorImovel}
            value={valorImovel}
            keyboardType="numeric"
            placeholder="Ex: 500000"
          />
        </View>

        {/* --- 3. Metros Quadrados --- */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Metros Quadrados (m²):</Text>
          <TextInput
            style={styles.textInput}
            onChangeText={setMetrosQuadrados}
            value={metrosQuadrados}
            keyboardType="numeric"
            placeholder="Ex: 85"
          />
        </View>

        {/* --- 4. Botão --- */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={handlePesquisar}
          disabled={!bairroSelecionado || !valorImovel || !metrosQuadrados}
        >
          <Text style={styles.buttonText}>Pesquisar 🔎</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
    fontWeight: '600',
  },
  textInput: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  accordionHeaderText: {
    fontSize: 16,
    color: '#333',
  },
  accordionContent: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderTopWidth: 0,
    borderRadius: 8,
    marginTop: -8,
    paddingTop: 10,
    backgroundColor: '#fff',
  },
  bairroOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bairroText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
