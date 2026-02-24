document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const content = document.getElementById('content');
  const errorScreen = document.getElementById('error-screen');

  const dominiosPermitidos = ['dev.azure.com', 'visualstudio.com', 'portal.azure.com'];
  const ehDominioValido = dominiosPermitidos.some(d => tab.url?.includes(d));

  if (ehDominioValido) {
    content.classList.remove('hidden');
  } else {
    errorScreen.classList.remove('hidden');
  }
});

document.getElementById('btnExtrair').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const btn = document.getElementById('btnExtrair');
  
  statusDiv.className = "mt-4 text-center text-sm font-medium text-slate-500 animate-pulse";
  statusDiv.textContent = 'Processando...';
  btn.disabled = true;

  const formatoEscolhido = document.querySelector('input[name="formato"]:checked').value;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extrairVariaveisDaPagina,
  }, (resultados) => {
    btn.disabled = false;

    if (!resultados || !resultados[0].result) {
      statusDiv.className = "mt-4 text-center text-sm font-medium text-red-500";
      statusDiv.textContent = 'Erro ao ler a página.';
      return;
    }

    const dicionario = resultados[0].result;
    const chaves = Object.keys(dicionario);

    if (chaves.length === 0) {
      statusDiv.className = "mt-4 text-center text-sm font-medium text-amber-500";
      statusDiv.textContent = 'Nenhuma variável encontrada.';
      return;
    }

    let textoFinal = formatoEscolhido === 'json' 
      ? JSON.stringify(dicionario, null, 2)
      : chaves.map(k => `${k}=${dicionario[k]}`).join('\n');

    navigator.clipboard.writeText(textoFinal).then(() => {
      statusDiv.className = "mt-4 text-center text-sm font-medium text-green-600";
      statusDiv.textContent = `✅ ${chaves.length} variáveis copiadas!`;
      
      // Limpa a mensagem após 3 segundos
      setTimeout(() => { statusDiv.textContent = ''; }, 3000);
    });
  });
});

function extrairVariaveisDaPagina() {
  const dict = {};
  document.querySelectorAll('.ms-DetailsRow').forEach(linha => {
    const elNome = linha.querySelector('[aria-colindex="2"] pre.flat-view-text-preserve');
    const elValor = linha.querySelector('[aria-colindex="4"] pre.flat-view-text-preserve');
    if (elNome && elValor) {
      const nome = elNome.textContent.trim();
      const valor = elValor.textContent.trim();
      if (nome) dict[nome] = valor;
    }
  });
  return dict;
}
