chrome.action.onClicked.addListener((tab) => {
  // Executa a função na aba atual
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extrairVariaveis
  });
});

// Esta é a função que será injetada e rodará dentro da página do Azure DevOps
function extrairVariaveis() {
  const dicionarioVariaveis = {};
  const linhas = document.querySelectorAll('.ms-DetailsRow');

  linhas.forEach(linha => {
    const elementoNome = linha.querySelector('[aria-colindex="2"] pre.flat-view-text-preserve');
    const elementoValor = linha.querySelector('[aria-colindex="4"] pre.flat-view-text-preserve');

    if (elementoNome && elementoValor) {
      const nome = elementoNome.textContent.trim();
      const valor = elementoValor.textContent.trim();
      
      if (nome) {
        dicionarioVariaveis[nome] = valor;
      }
    }
  });

  const quantidade = Object.keys(dicionarioVariaveis).length;

  if (quantidade > 0) {
    const jsonFormatado = JSON.stringify(dicionarioVariaveis, null, 2);
    
    // Copia para a área de transferência
    navigator.clipboard.writeText(jsonFormatado).then(() => {
      alert(`✅ Sucesso! ${quantidade} variáveis copiadas para a área de transferência.\n\nAgora é só colar (Ctrl+V) onde quiser.`);
      console.log("Variáveis extraídas:", dicionarioVariaveis);
    }).catch(err => {
      alert("⚠️ As variáveis foram encontradas, mas o navegador bloqueou a cópia automática. Verifique o console (F12).");
      console.log("Variáveis extraídas:", jsonFormatado);
    });
  } else {
    alert("❌ Nenhuma variável encontrada. Tem certeza de que você está na página correta do Azure DevOps?");
  }
}
