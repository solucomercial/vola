# Exemplos de Testes - Lógica de Isolamento

## ✅ TESTE 1: Voo com preço IGUAL (sem justificativa)

```
PASSOS:
1. Ir para /requests/new
2. Tipo: Voo → Ida e Volta
3. Preencher:
   - Origem: GRU
   - Destino: GIG
   - Partida: 02/03/2026
   - Retorno: 05/03/2026
   - Centro: 1005
4. Pesquisar

RESULTADO ESPERADO:
✅ bestCombinedPrice = 845
✅ Ida (422) + Volta (423) = 845
✅ 845 > 845? NÃO → SEM justificativa obrigatória
✅ Campo de justificativa NÃO aparece
✅ Botão "Adicionar" ativado sem preenchimento de justificativa
```

## ✅ TESTE 2: Múltiplas categorias (isolamento)

```
PASSOS:
1. Execute TESTE 1 completamente
2. Adicionar ao carrinho (voo com 845, sem justificativa)
3. Trocar para HOTEL
   ⚠️  PONTO CRÍTICO: currentSearchLowestPrice deve ser RESETADO aqui

RESULTADO ESPERADO:
✅ Não há aviso de justificativa do voo anterior
✅ Campo de justificativa desaparece
✅ Status "limpo" para nova busca
```

## ✅ TESTE 3: Hotel mais barato (após voo)

```
PASSOS (continuação do TESTE 2):
1. Hotel tipo 
2. Preencher:
   - Destino: São Paulo
   - Check-in: 02/03/2026
   - Check-out: 05/03/2026
   - Centro: 1005
3. Pesquisar e selecionar hotel mais BARATO
4. Preencher motivo
5. Adicionar ao carrinho

RESULTADO ESPERADO:
✅ Hotel não exige justificativa (é o mais barato)
✅ Botão "Adicionar" ativado imediatamente
✅ Carrinho agora tem:
   - Voo (R$ 845, sem aviso)
   - Hotel (R$ X, sem aviso)
```

## ✅ TESTE 4: Hotel mais caro (válida isolamento)

```
PASSOS:
1. Nova busca de CARRO
2. Preencher:
   - Destino: Rio de Janeiro
   - Retirada: 02/03/2026
   - Devolução: 05/03/2026
   - Centro: 1005
3. Pesquisar

RESULTADO ESPERADO:
✅ currentSearchLowestPrice = preço mínimo de carros
✅ Nenhuma referência aos preços anteriores (voo e hotel)
✅ Validação isolada desta busca
```

## 🔴 TESTE 5: Voo acima do melhor preço (com justificativa)

```
PASSOS:
1. Nova busca de VOO round-trip
2. bestCombinedPrice = 845
3. Selecionar:
   - Ida por R$ 500 (acima de 422)
   - Volta por R$ 450 (acima de 423)
   - Total: 950
4. Não preencher justificativa
5. Tentar clicar "Adicionar ao Carrinho"

RESULTADO ESPERADO:
✅ Aviso aparece: "Opção acima do menor preço"
✅ Campo de justificativa obrigatório
✅ Botão desativado até preencher justificativa
✅ Mensagem de erro: "Justificativa é obrigatória..."
```

## 🔴 TESTE 6: Carro acima do melhor preço (com justificativa)

```
PASSOS:
1. Buscar carros
2. Selecionar carro caro (acima do melhor)
3. Não preencher justificativa
4. Tentar clicar "Adicionar ao Carrinho"

RESULTADO ESPERADO:
✅ Aviso aparece com preço mínimo de CARROS
✅ NÃO referencia preços de voos anteriores
✅ Campo de justificativa obrigatório
✅ Validação isolada
```

## 📊 Teste de Carrinho (Integração)

```
PASSOS:
1. Executar TESTE 5 (voo com justificativa: "Prefiro diretos")
2. Preencher justificativa
3. Adicionar ao carrinho
4. Mover para HOTEL
5. Pesquisar e adicionar hotel mais barato
6. Executar TESTE 6 (carro com justificativa: "Preciso de espaço")
7. Preencher justificativa e adicionar
8. Clique "Finalizar Compra"

RESULTADO ESPERADO NO CHECKOUT:
✅ Voo (R$ 950)
   ⚠️ Aviso: "Opção acima do menor preço"
   ⚠️ Justificativa: "Prefiro diretos"

✅ Hotel (R$ X)
   ✨ SEM AVISO (foi o mais barato)

✅ Carro (R$ Y)
   ⚠️ Aviso: "Opção acima do menor preço"
   ⚠️ Justificativa: "Preciso de espaço"

✅ Total: R$ (950 + X + Y)
```

## 🎯 Validação Crítica

Ao executar os testes acima, verificar especificamente:

```typescript
// No console do navegador (F12), procurar por:

[handleSearch] Resultados recebidos: {
  type: "flight",           // ← Muda conforme tipo selecionado
  bestCombinedPrice: 845,   // ← Muda conforme busca
}

// Confirma que currentSearchLowestPrice é:
// - Definido após cada busca
// - Resetado ao trocar de tipo
// - Isolado por busca
```

## ❌ Comportamentos Antigos (Agora Corrigidos)

❌ **Antes:** Seleção de voo caro → Trocar para hotel → Aviso de voo ainda existe
✅ **Depois:** Aviso desaparece ao trocar tipo

❌ **Antes:** Comparar preço de carro com bestCombinedPrice de voo
✅ **Depois:** Comparações isoladas por tipo

❌ **Antes:** needsJustification global reativo
✅ **Depois:** itemNeedsJustification local por item
