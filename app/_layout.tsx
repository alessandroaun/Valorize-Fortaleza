// app/_layout.tsx

import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* 1. TELA INICIAL (SEARCH): Esta deve ser a primeira a ser carregada. */}
      {/* Aponta para o arquivo app/index.tsx (sua tela de busca) */}
      <Stack.Screen 
        name="index" 
        options={{ 
          // Oculta o cabeçalho superior (você já configurou isso no index.tsx, mas é bom garantir aqui)
          headerShown: false, 
        }} 
      />
      
      {/* 2. ROTAS SECUNDÁRIAS (TABS): O grupo de abas. */}
      {/* Esta rota aponta para a pasta (tabs) e deve ser acessada via navegação (router.replace). */}
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          // Oculta o cabeçalho para que a Tab Bar (que é o header do (tabs)/_layout.tsx) seja o elemento principal
          headerShown: false, 
        }} 
      />

      {/* 3. TELA DE RESULTADOS: Tela de Stack acessada via router.push. */}
      {/* Aponta para o arquivo app/resultado.tsx (ou o nome do seu arquivo de resultado) */}
      <Stack.Screen 
        name="resultado" 
        options={{ 
          headerShown: false, 
        }} 
      />
      
      {/* ... adicione outras rotas de Stack aqui, se houver ... */}
    </Stack>
  );
}