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

```bash
# Node.js (v14 ou superior)
node -v

# Expo CLI
npm install -g expo-cli

# Yarn (opcional, mas recomendado)
npm install -g yarn
```

### Configuração do Supabase

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Copie as credenciais (URL e Anon Key)
4. Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

### Instalação

```bash
# Clone o repositório
git clone https://github.com/igorbrandao/flashchat.git

# Entre na pasta
cd flashchat

# Instale as dependências
yarn install
# ou
npm install

# Inicie o projeto
yarn start
# ou
npm start
```

### 📱 Rodando no Dispositivo

1. Baixe o app **Expo Go**:
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Escaneie o QR Code que aparece no terminal ou na página web do Expo

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