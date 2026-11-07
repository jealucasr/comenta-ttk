# Comenta TTK

Gerenciador **semiautomático** de comentários para TikTok. Não publica comentários automaticamente.

## Executar

Requisitos: Node.js 18 ou superior.

```bash
git clone https://github.com/jealucasr/comenta-ttk.git
cd comenta-ttk
npm install
npm run dev
```

Abra o endereço local mostrado no terminal (normalmente http://localhost:5173).

## Funcionalidades

- Cadastrar e excluir hashtags e abrir suas páginas no TikTok.
- Cadastrar e excluir comentários pré-definidos.
- Adicionar links individuais ou importar vários links de uma vez, ignorando URLs duplicadas e inválidas.
- Classificar cada vídeo por hashtag, inclusive links recebidos pelo favorito do navegador.
- Filtrar a fila por hashtag, por vídeos sem hashtag ou por trecho do link/perfil.
- Escolher e copiar um comentário, abrir o vídeo e publicar manualmente.
- Confirmar a publicação para atualizar o histórico e a meta de 50 por dia.
- Armazenamento local no navegador via localStorage.

**Atenção:** Não há busca automática, scraping, integração com a API do TikTok ou publicação automática. O contador é baseado nas confirmações manuais e não verifica se o comentário foi realmente publicado. Dados não são sincronizados entre dispositivos e podem ser perdidos ao limpar os dados do navegador.
