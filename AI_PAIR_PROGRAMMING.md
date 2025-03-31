# Guia de Pair Programming com IA

## Características do Assistente

1. **Abordagem Sistemática**
   - Segue uma ordem lógica de implementação
   - Mantém um registro claro do progresso
   - Divide tarefas complexas em etapas menores e gerenciáveis

2. **Comunicação Clara**
   - Explica o que está fazendo antes de cada ação
   - Fornece feedback após cada etapa
   - Mantém o usuário informado sobre o progresso

3. **Boas Práticas**
   - Implementa testes automatizados
   - Segue padrões de código consistentes
   - Documenta o código adequadamente
   - Trata erros apropriadamente

## Como Interagir

1. **Início do Projeto**
   ```plaintext
   "Preciso implementar [descrição do projeto]. Poderia me ajudar seguindo sua abordagem sistemática?"
   ```

2. **Durante o Desenvolvimento**
   ```plaintext
   "Continue" - Para prosseguir com a próxima etapa lógica
   "Explique [parte específica]" - Para entender melhor alguma implementação
   "Revise [arquivo/função]" - Para revisar código existente
   ```

3. **Solicitando Testes**
   ```plaintext
   "Vamos adicionar testes para [módulo/função]"
   "Poderia testar [cenário específico]"
   ```

4. **Debugging**
   ```plaintext
   "Estou tendo um problema com [descrição]. Poderia me ajudar a debugar?"
   ```

## Melhores Práticas

1. **Forneça Contexto**
   - Compartilhe arquivos relevantes
   - Descreva o ambiente de desenvolvimento
   - Explique requisitos específicos

2. **Acompanhe o Progresso**
   - Mantenha um arquivo PROGRESS.md atualizado
   - Revise as mudanças após cada etapa
   - Confirme se os testes estão passando

3. **Iteração**
   - Faça pequenas mudanças de cada vez
   - Teste frequentemente
   - Commit após cada funcionalidade completa

4. **Documentação**
   - Mantenha READMEs atualizados
   - Documente decisões importantes
   - Comente código complexo

## Fluxo de Trabalho Recomendado

1. **Planejamento**
   - Definir estrutura do projeto
   - Criar lista de tarefas
   - Estabelecer prioridades

2. **Implementação**
   - Desenvolver um módulo por vez
   - Escrever testes primeiro (TDD)
   - Refatorar quando necessário

3. **Revisão**
   - Verificar cobertura de testes
   - Validar funcionalidades
   - Identificar melhorias

4. **Documentação**
   - Atualizar documentação
   - Registrar decisões técnicas
   - Documentar APIs

## Comandos Úteis

```bash
# Iniciar novo módulo
"Vamos implementar o módulo [nome]"

# Adicionar testes
"Precisamos adicionar testes para [funcionalidade]"

# Revisar código
"Pode revisar esta implementação?"

# Debugar
"Estou tendo este erro: [erro]. Pode ajudar?"
```

## Dicas

1. Seja específico nas solicitações
2. Forneça feedback sobre as implementações
3. Pergunte quando não entender algo
4. Mantenha um histórico das decisões importantes
5. Use o controle de versão efetivamente

## Exemplo de Fluxo de Conversa

```plaintext
Usuário: "Preciso implementar um novo módulo de autenticação"
IA: [Propõe estrutura e passos]
Usuário: "Continue"
IA: [Implementa primeira parte]
Usuário: "Explique esta parte específica"
IA: [Fornece explicação detalhada]
```

---

Este guia serve como referência para manter uma comunicação efetiva e produtiva durante o desenvolvimento. Adapte conforme necessário para seu projeto específico. 