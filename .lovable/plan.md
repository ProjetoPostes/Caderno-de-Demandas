# Ajustes na Análise e no formulário de Obras

## Objetivo
Ajustar somente os campos solicitados na tela de análise e substituir o diálogo atual de Obras por uma visualização compacta de detalhes, preservando a integração existente.

## Implementação

### Tela de Análise
- Tornar **Tipo de atendimento** somente leitura, mantendo o mesmo campo e valor já carregado do Supabase.
- Calcular **Crítica de distância** automaticamente a partir de **Distância prevista (m)**, sem campo editável.
- Aplicar todas as faixas solicitadas, incluindo exatamente os limites de 60, 100, 500, 1.000 e 2.000 metros.
- Manter `critica_distancia` no mesmo objeto enviado exclusivamente pela RPC `salvar_analise_os`.

### Tela de Obras
- Ao clicar em uma obra, abrir um formulário de detalhes organizado em:
  - cabeçalho compacto: Nº Obra, Tranche, Nome envolvido e Município;
  - informações da obra: Status, Data Início, Data de Fim, Valor orçado e Valor realizado;
  - descrição da obra com o texto inicial fornecido;
  - seção CLIENTES com cliente e status da validação em badges.
- Reaproveitar as OSs vinculadas à obra para listar clientes reais.
- Buscar o resultado da análise atual de cada OS para exibir **Aprovado**, **Não aprovado** ou **Pendente**; quando não houver análise ou resultado, usar **Pendente**.
- Usar os dados existentes da obra e da primeira OS vinculada para os campos disponíveis. Campos ainda inexistentes no esquema receberão os valores iniciais informados, apenas na apresentação, sem criar ou alterar tabelas.

## Preservação
- Não alterar tabelas, colunas, funções, triggers ou policies.
- Não criar persistência local ou dados simulados para clientes.
- Manter as demais telas e o fluxo atual de salvamento da análise inalterados.

## Verificação
- Validar tipagem e compilação automática.
- Conferir o diálogo de Obras e a tela de Análise no navegador em tamanhos desktop e móvel.
