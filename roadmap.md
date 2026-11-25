# Roadmap

- [x] Criar tema Floresta com imagem exclusiva na barra lateral; 72 testes de contraste passaram e controles reais isolados foram conferidos em computador/celular e nos seis outros temas; a tela de Obras autenticada não pôde ser conferida por ausência de sessão.

- [x] Adicionar indicadores de número de obras, valor orçado e valor realizado para todo o resultado filtrado, e filtro Status unificado, sem alterar o banco; 12 testes passaram e compilação OK; a conferência em /tratativas/obras com dados reais ficou indisponível por exigir login.

- [x] Ajustar filtros dos Prioritários: retirar Nome e Check PO; adicionar Obra vinculada às OS e presença de Nome correto/CPF correto; 21 testes passaram, compilação OK e conferência da tela indisponível por exigir login.

- [x] Trocar Responsável por seleção de usuários na validação da obra e usar a escolha no salvamento existente, sem mudar o banco.

- [x] Mover ODS e Status ODS para Validação da obra e permitir edição apenas na tela, sem mudar o banco ou o salvamento existente.

- [x] Restringir Holst e Oceano aos acentos, preservando a base neutra; 41 testes de contraste passaram e controles reais de tema conferidos isoladamente em computador/celular, sem testar telas autenticadas.

- [x] Verificar e corrigir contraste dos temas Holst e Oceano; 100 testes passaram.
- [x] Permitir cores individuais de menu, cabeçalho e cards apenas neste navegador, sem recomendação de tema; seleção, recarga e restauração verificadas em controles reais isolados no computador/celular. Conferência em /tratativas/clientes com login indisponível por ausência de sessão.

- [x] Retirar o bloco Critérios de Enquadramento da validação de OS, preservando os dados existentes e os demais campos.
- [x] Explicar que o filtro de tranche deve considerar as OSs vinculadas dentro do RPC existente; definição externa da função indisponível para confirmação.

- [x] Manter apenas os dropdowns solicitados em Obras, Prioritários e Caderno; demais filtros como texto, sem bloquear seletores durante a consulta.
- [x] Filtrar nome do cliente ligado apenas por preenchido/vazio, sem alterar o banco; 12 testes passaram e compilação OK. Conferência nas telas indisponível porque o acesso disponível solicitou login.

- [x] Carregar valores únicos reais nos filtros de todas as telas operacionais, apenas por consultas.
- [x] Testar valores únicos, paginação e preservação das consultas e contagens: 48 testes passaram; conferência autenticada indisponível porque a tela solicitou login.

- [x] Adicionar acesso ao Google Earth e Maps na análise, com conversão UTM em WGS84; acesso autenticado e destinos externos não verificados.
- [x] Exigir tipo de coordenada e, para UTM, fuso e hemisfério; 15 testes passaram e compilação sem erros.

- [x] Tornar Tipo de atendimento somente leitura na Análise.
- [x] Calcular e exibir Crítica de distância pelas faixas definidas.
- [x] Reformular os detalhes de Obras conforme a referência enviada.
- [x] Vincular clientes reais e resultados atuais das análises quando disponíveis.
- [x] Verificar compilação e apresentação responsiva; a inspeção autenticada ficou indisponível neste ambiente.

- [x] Colorir Tranche, Alocação, Coordenada validada e Decisão nos Prioritários; 42 testes passaram e as cores foram conferidas na tabela.

- [x] Retirar as pílulas sólidas de Obras e devolver a tabela ao visual anterior (células simples, Status em selo de contorno); 121 testes passaram e a compilação ficou sem erros.
