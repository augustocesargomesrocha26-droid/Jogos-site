# Jogos 4INFO3 — Frontend

Frontend em React + Vite para consumir a API Express do repositório `jogos4info3`.

## O que está integrado

- `GET /Jogos`: carrega o catálogo (rota pública no backend).
- `GET /Jogos/:id`: função de serviço disponível para buscar um jogo individual.
- Busca por nome/descrição e filtro por categoria no navegador.
- Janela de detalhes com os campos devolvidos pelo MongoDB.
- Estados de carregamento, erro, catálogo vazio e atualização.

A interface é somente catálogo: não cadastra, edita ou exclui jogos e não chama endpoints de usuário/login.

## Requisitos

- Node.js 18 ou superior
- Backend do projeto iniciado na porta 3000
- MongoDB configurado no backend

## Instalação

Dentro desta pasta:

```bash
npm install
cp .env.example .env
npm run dev
```

No Windows PowerShell, se `cp` não funcionar:

```powershell
Copy-Item .env.example .env
```

Abra `http://localhost:5173`.

## Configuração da API

O arquivo `.env` deve conter:

```env
VITE_API_URL=http://localhost:3000
```

O `server.js` do backend já configura CORS para `http://localhost:5173`. Se mudar a porta ou domínio do frontend, ajuste também a origem permitida no backend.

## Estrutura

```text
src/
  components/
    GameCard.jsx
    GameModal.jsx
  services/
    api.js
  App.jsx
  main.jsx
  styles.css
```

## Observação sobre os campos dos jogos

O backend retorna os documentos da coleção `Jogos4info3.jogos`. O controlador confirma o campo `nome`, mas os demais campos dependem dos documentos cadastrados. A interface reconhece nomes comuns como `descricao`, `categoria`, `imagem`, `capa` e também mostra os demais campos no detalhe. Se sua coleção usa nomes diferentes para imagem/descrição/categoria, ajuste as listas em `GameCard.jsx` e `App.jsx`.

## Build de produção

```bash
npm run build
npm run preview
```

A API é a fonte dos dados; o frontend não contém jogos fictícios.
