# 🚀 FlashChat - Chat em Tempo Real com React Native

<div align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
</div>

<div align="center">
  <p>Um aplicativo de chat moderno e elegante construído com React Native, Expo e Supabase! 💬✨</p>
</div>

## ✨ Funcionalidades

- 🔐 **Autenticação Segura**
  - Login com email/senha
  - Persistência de sessão
  - Proteção de rotas

- 💬 **Chat em Tempo Real**
  - Mensagens instantâneas
  - Indicadores de status de envio
  - Confirmação de leitura
  - Animações suaves

- 🎤 **Mensagens de Voz**
  - Gravação de áudio
  - Reprodução inline
  - Visualização de forma de onda
  - Upload automático

- 🎨 **UI/UX Premium**
  - Design inspirado no WhatsApp
  - Modo claro/escuro
  - Animações fluidas
  - Feedback tátil

## 🛠️ Tecnologias

- [**Expo**](https://expo.dev/) - Framework React Native
- [**Supabase**](https://supabase.com/) - Backend as a Service
- [**TypeScript**](https://www.typescriptlang.org/) - Tipagem estática
- [**Expo AV**](https://docs.expo.dev/versions/latest/sdk/av/) - Gravação e reprodução de áudio
- [**Expo Haptics**](https://docs.expo.dev/versions/latest/sdk/haptics/) - Feedback tátil
- [**AsyncStorage**](https://react-native-async-storage.github.io/async-storage/) - Persistência local

## 📱 Screenshots

<div align="center">
  <table>
    <tr>
      <td><strong>Login</strong></td>
      <td><strong>Chat</strong></td>
      <td><strong>Gravação</strong></td>
    </tr>
    <tr>
      <td>[Imagem Login]</td>
      <td>[Imagem Chat]</td>
      <td>[Imagem Gravação]</td>
    </tr>
  </table>
</div>

## 🚀 Como Rodar

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

```bash
# Verifique a versão do Node.js (v14 ou superior)
node -v

# Instale o Expo CLI globalmente
npm install -g expo-cli

# Instale o Yarn (opcional, mas recomendado)
npm install -g yarn

# Para iOS: Xcode (apenas para Mac)
xcode-select --install

# Para Android: Android Studio e variáveis de ambiente
# ANDROID_HOME e JAVA_HOME configuradas
```

### Configuração do Ambiente

1. **Supabase Setup**:
   - Crie uma conta no [Supabase](https://supabase.com)
   - Crie um novo projeto
   - Vá em Project Settings > API
   - Copie a URL e a Anon Key

2. **Configuração Local**:
   ```bash
   # Clone o repositório
   git clone https://github.com/igorbrandao/flashchat.git
   cd flashchat

   # Crie o arquivo .env
   touch .env
   ```

3. **Configure as Variáveis de Ambiente**:
   Adicione ao arquivo `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=sua_url_aqui
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
   ```

### Instalação e Execução

1. **Instale as Dependências**:
   ```bash
   # Com Yarn (recomendado)
   yarn install

   # Ou com NPM
   npm install
   ```

2. **Inicie o Projeto**:
   ```bash
   # Com Yarn
   yarn start

   # Ou com NPM
   npm start

   # Ou com Expo diretamente
   expo start
   ```

### 📱 Rodando no Dispositivo Físico

1. **Instale o Expo Go**:
   - 📱 iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - 🤖 Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Conecte o App**:
   - Escaneie o QR Code que aparece no terminal
   - iOS: use a câmera do iPhone
   - Android: use o app Expo Go para escanear

3. **Desenvolvimento**:
   - O app irá recarregar automaticamente quando salvar alterações
   - Agite o dispositivo para abrir o menu de desenvolvimento
   - Pressione R duas vezes para forçar reload

### 🔧 Rodando em Emuladores

1. **iOS Simulator (Mac only)**:
   ```bash
   # Inicie o simulador iOS
   yarn ios
   # ou
   npm run ios
   ```

2. **Android Emulator**:
   ```bash
   # Certifique-se que um emulador está rodando
   yarn android
   # ou
   npm run android
   ```

### 🐛 Debugging

- Agite o dispositivo ou pressione `Cmd + D` (iOS) / `Ctrl + M` (Android)
- Selecione "Debug Remote JS" para abrir o Chrome DevTools
- Use o console para ver logs e erros
- Instale o [React Native Debugger](https://github.com/jhen0409/react-native-debugger) para uma experiência melhor

### 📝 Comandos Úteis

```bash
# Limpar cache do Metro
yarn start --clear

# Verificar problemas de TypeScript
yarn typescript

# Rodar linter
yarn lint

# Gerar build de produção
yarn build
```

## 🎯 Recursos Principais

### Chat em Tempo Real
- Mensagens aparecem instantaneamente
- Indicadores de status (enviando, enviado, lido)
- Ordenação cronológica das mensagens
- Cache local para carregamento rápido

### Mensagens de Voz
- Gravação com um toque longo
- Visualização do tempo de gravação
- Forma de onda animada durante a reprodução
- Upload automático para o Supabase Storage

### UI/UX
- Design responsivo
- Animações suaves
- Feedback tátil
- Modo escuro/claro automático

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Igor Brandão**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/igorbrandao)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/igorbrandao)

---

<div align="center">
  <p>Feito com ❤️ por Igor Brandão</p>
  <p>
    <a href="https://github.com/igorbrandao/flashchat/issues">Reportar Bug</a>
    ·
    <a href="https://github.com/igorbrandao/flashchat/issues">Sugerir Feature</a>
  </p>
</div> 