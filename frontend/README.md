# Jogos 4INFO3 — Frontend

Frontend em **React + Vite** que consome a API Express do repositório [`jogos4info3`](https://github.com/augustocesargomesrocha26-droid/jogos4info3).

Além do catálogo público, a interface agora usa as rotas de **login**, **cadastro**, **edição de dados do usuário** e **CRUD de jogos** (todas as rotas protegidas por JWT).

## Rotas da API consumidas

| Rota | Método | Autenticação | Onde é usada |
| --- | --- | --- | --- |
| `/login` | POST | pública | modal de login (`Login.jsx`) |
| `/Usuarios` | POST | pública | aba "Criar conta" (`Login.jsx`) |
| `/Usuarios/:id` | PUT | token + id do próprio usuário | "Editar perfil" (`ProfileModal.jsx`) |
| `/Usuarios/:id` | DELETE | token + id do próprio usuário | "Excluir conta" (`ProfileModal.jsx`) |
| `/Jogos` | GET | pública | catálogo (`App.jsx`) |
| `/Jogos/:id` | GET | pública | disponível em `services/api.js` (`getJogo`) |
| `/Jogos` | POST | token | "Novo jogo" (`GameFormModal.jsx`) |
| `/Jogos/:id` | PUT | token | "Editar jogo" (`GameFormModal.jsx`) |
| `/Jogos/:id` | DELETE | token | exclusão com confirmação (`ConfirmDialog.jsx`) |

Detalhes de contrato que o código já respeita:

- **Corpo das rotas de escrita**: jogos vão como `{ jogo: {...} }` e usuários como `{ usuario: {...} }`.
- **Header de autenticação**: o middleware `autenticarToken` do backend lê o header `authorization` **sem** o prefixo `Bearer`, então o token é enviado puro (`services/api.js` → `montarHeaders`). Se o backend passar a aceitar/exigir `Bearer`, basta trocar uma linha ali (há um comentário no local).
- **Atualização parcial**: `PUT /Usuarios/:id` e `PUT /Jogos/:id` fazem *merge* no controller e **apagam o campo** quando o valor recebido é string vazia. Por isso os formulários enviam **apenas os campos alterados**.
- **Token de 1 hora**: o JWT expira em 1h. O frontend decodifica o `exp`, agenda o encerramento da sessão e, em qualquer resposta 401/403, desloga e avisa o usuário.
- **Troca de e-mail**: o token carrega o e-mail; ao alterá-lo, a sessão atual deixa de ser válida. O frontend desloga automaticamente e pede um novo login com o e-mail novo.

## Estrutura

```text
src/
  App.jsx                    # catálogo + orquestração dos modais e rotas (#/conta)
  main.jsx                   # monta o <AuthProvider>
  context/
    AuthContext.jsx          # sessão (token + usuário), login, logout, edição de perfil
  components/
    Navbar.jsx               # topbar com chip do usuário / botão ENTRAR
    Login.jsx                # modal de login e cadastro
    ProfileModal.jsx         # edição dos dados + exclusão de conta
    GameFormModal.jsx        # cadastro/edição de jogos
    GameCard.jsx             # card com ações de editar/excluir quando logado
    GameModal.jsx            # ficha do jogo com ações
    ConfirmDialog.jsx        # confirmação antes de DELETE
    Toast.jsx                # avisos de sucesso/erro
    AccountPage.jsx          # página "#/conta"
  services/
    api.js                   # fetch + tratamento de erro + rotas
  styles.css                 # tema do portal + estilos das telas novas
```

## Como rodar

Pré-requisitos: Node.js 18+, backend rodando (porta 3000) e MongoDB configurado.

```bash
npm install
cp .env.example .env      # no Windows: Copy-Item .env.example .env
npm run dev
```

Abra `http://localhost:5173`.

`.env`:

```env
VITE_API_URL=http://localhost:3000
```

O `server.js` do backend libera CORS para `http://localhost:5173`. Se mudar a porta do frontend, ajuste a origem lá também.

## Fluxos na interface

1. **Entrar / criar conta**: botão `ENTRAR` na topbar. Após o login o chip do usuário aparece e o catálogo entra em "modo editor".
2. **Minha conta** (`#/conta`): resumo da sessão (id, e-mail, login, expiração do token) e atalho para editar.
3. **Editar meus dados**: altera e-mail e/ou senha. Só os campos modificados vão para a API; a troca de e-mail força novo login.
4. **Jogos**: botão `NOVO JOGO`, ícones de lápis/lixeira nos cards e ações dentro da ficha do jogo. Toda escrita exige sessão válida; sem login, a interface fica em modo leitura.

## Ajuste necessário na API (importante)

Para a edição de dados funcionar, o backend precisa devolver o **`id`** do usuário no login — a rota `PUT /Usuarios/:id` exige o id e o token original só trazia o e-mail. O patch correspondente está no repositório da API (arquivos `controller/auth.js`, `controller/usuarios.js` e `middleware/auth.js`):

```js
const id = String(usuario._id);
const token = jwt.sign({ id, email: usuario.email }, SECRET, { expiresIn: '1h' });
res.status(200).json({ token, id, email: usuario.email, mensagem: "login efetuado com sucesso" });
```

Enquanto o backend não for ajustado, a interface funciona para login/catálogo, mas o modal de perfil avisa que o `id` não foi retornado e mantém o botão de salvar desabilitado (o `AuthContext` já lê o id de `data.id`, `data._id`, `data.usuario._id` ou do payload do JWT, então qualquer uma dessas formas resolve).

## Build

```bash
npm run build     # gera dist/
npm run preview
```
