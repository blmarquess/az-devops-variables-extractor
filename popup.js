document.getElementById('btnExtrair').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  statusDiv.style.color = '#333';
  statusDiv.textContent = 'Extraindo...';

  // 1. Descobre qual formato o usuário escolheu
  const formatoEscolhido = document.querySelector('input[name="formato"]:checked').value;

  // 2. Pega a aba ativa atual do Chrome
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 3. Injeta e executa a função de extração na página
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extrairVariaveisDaPagina,
  }, (resultados) => {
    
    // Tratamento de erro caso o script não consiga rodar na aba
    if (!resultados || resultados.length === 0) {
      statusDiv.style.color = 'red';
      statusDiv.textContent = 'Erro ao ler a página.';
      return;
    }

    // Pega o dicionário retornado pela função injetada
    const dicionario = resultados[0].result;
    const quantidade = Object.keys(dicionario).length;

    if (quantidade === 0) {
      statusDiv.style.color = '#d13438';
      statusDiv.textContent = 'Nenhuma variável encontrada!';
      return;
    }

    // 4. Formata os dados com base na escolha
    let textoFinal = '';
    if (formatoEscolhido === 'json') {
      textoFinal = JSON.stringify(dicionario, null, 2);
    } else if (formatoEscolhido === 'env') {
      // Transforma o objeto em um array de "chave=valor" e junta com quebra de linha
      textoFinal = Object.entries(dicionario)
        .map(([chave, valor]) => `${chave}=${valor}`)
        .join('\n');
    }

    // 5. Copia para a área de transferência do sistema
    navigator.clipboard.writeText(textoFinal).then(() => {
      statusDiv.style.color = '#107c10'; // Verde estilo Microsoft
      statusDiv.textContent = `✅ ${quantidade} variáveis copiadas!`;
    }).catch(err => {
      statusDiv.style.color = 'red';
      statusDiv.textContent = 'Erro ao copiar.';
      console.error(err);
    });
  });
});

// --- ATENÇÃO: Esta função roda DENTRO da página da web, não tem acesso ao popup ---
function extrairVariaveisDaPagina() {
  const dict = {};
  const linhas = document.querySelectorAll('.ms-DetailsRow');

  linhas.forEach(linha => {
    const elNome = linha.querySelector('[aria-colindex="2"] pre.flat-view-text-preserve');
    const elValor = linha.querySelector('[aria-colindex="4"] pre.flat-view-text-preserve');

    if (elNome && elValor) {
      const nome = elNome.textContent.trim();
      const valor = elValor.textContent.trim();
      if (nome) {
        dict[nome] = valor;
      }
    }
  });

  return dict; // Devolve o objeto para o popup.js
}
