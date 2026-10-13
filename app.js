(function () {
  'use strict';

  /* =====================================================================
     1. BANCO DE QUESTÕES MODELO ENEM & ESTADO LOCAL
     ===================================================================== */
  const BANCO_ENEM = [
    { 
      id: 101, 
      area: 'Humanas', 
      q: 'A Teoria da Burocracia e a diferenciação entre Poder e Dominação foram formuladas por qual sociólogo clássico?', 
      alt: ['Émile Durkheim', 'Max Weber', 'Karl Marx', 'Auguste Comte', 'Talcott Parsons'], 
      cor: 1 
    },
    { 
      id: 102, 
      area: 'Linguagens', 
      q: 'Na função emotiva ou expressiva da linguagem, o foco principal da comunicação está centrado em qual elemento?', 
      alt: ['No receptor', 'No código', 'No emissor', 'No canal', 'Na mensagem'], 
      cor: 2 
    },
    { 
      id: 103, 
      area: 'Natureza', 
      q: 'Em uma reação de neutralização total entre ácido clorídrico (HCl) e hidróxido de sódio (NaOH), quais são os produtos formados?', 
      alt: ['Água e sal (NaCl)', 'Apenas gás hidrogênio', 'Ácido fraco e base', 'Dióxido de carbono e água', 'Sódio metálico e cloro'], 
      cor: 0 
    },
    { 
      id: 104, 
      area: 'Matemática', 
      q: 'Se a probabilidade de um evento ocorrer é de 3/5, qual é a porcentagem correspondente?', 
      alt: ['30%', '45%', '50%', '60%', '75%'], 
      cor: 3 
    },
    { 
      id: 105, 
      area: 'Humanas', 
      q: 'Qual movimento histórico no século XX utilizou a resistência não violenta como estratégia principal para alcançar a independência?', 
      alt: ['Revolução Francesa', 'Marcha do Sal liderada por Gandhi', 'Revolução Russa', 'Guerra de Secessão', 'Independência das Treze Colônias'], 
      cor: 1 
    }
  ];

  const KEY_ENEM = {
    erros: 'enem_caderno_erros',
    redacao: 'enem_redacao_texto'
  };

  const store = {
    get: (k, def = null) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  let simuladoAtivo = null;

  /* =====================================================================
     2. ESTILOS E INTERFACE
     ===================================================================== */
  function $(sel) { return document.querySelector(sel); }

  function injetarCSS() {
    if ($('#enem-styles')) return;
    const style = document.createElement('style');
    style.id = 'enem-styles';
    style.textContent = `
      :root { --bg: #0b0f19; --card: #151c2c; --accent: #ffb703; --txt: #f0f4f8; --border: #2a354d; }
      #enem-app { max-width: 900px; margin: 0 auto; padding: 20px; color: var(--txt); font-family: system-ui, -apple-system, sans-serif; }
      .enem-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-bottom: 20px; }
      .enem-btn { background: var(--accent); color: #000; font-weight: bold; border: none; padding: 10px 16px; border-radius: 5px; cursor: pointer; margin: 5px 2px; }
      .enem-btn:hover { opacity: 0.9; }
      .enem-btn-sec { background: #1e293b; color: var(--txt); border: 1px solid var(--border); }
      .enem-nav { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
      .modo-foco header, .modo-foco .enem-nav { display: none !important; }
    `;
    document.head.appendChild(style);
  }

  function renderHeader() {
    const hdr = $('#enem-header') || document.createElement('header');
    hdr.id = 'enem-header';
    hdr.className = 'enem-card';
    hdr.innerHTML = `
      <h2 style="margin:0; color:var(--accent);">🎓 PREP ENEM — Treinamento Intensivo</h2>
      <small>Simulados por Áreas de Conhecimento & Treino de Redação</small>
    `;
    if (!$('#enem-header')) $('#enem-app').prepend(hdr);
  }

  function montarLayout() {
    renderHeader();
    const nav = document.createElement('nav');
    nav.className = 'enem-nav';
    nav.innerHTML = `
      <button class="enem-btn enem-btn-sec" data-aba="simulado">📝 Simulado ENEM</button>
      <button class="enem-btn enem-btn-sec" data-aba="redacao">✍️ Redação Nota 1000</button>
      <button class="enem-btn enem-btn-sec" data-aba="caderno">📓 Caderno de Revisão</button>
    `;

    const main = document.createElement('main');
    main.id = 'enem-conteudo';

    $('#enem-app').appendChild(nav);
    $('#enem-app').appendChild(main);
  }

  function showTab(aba) {
    const main = $('#enem-conteudo');
    if (!main) return;
    main.innerHTML = '';

    if (aba === 'simulado') renderSimulado(main);
    if (aba === 'redacao') renderRedacao(main);
    if (aba === 'caderno') renderCaderno(main);
  }

  /* =====================================================================
     3. MÓDULOS DE ESTUDO
     ===================================================================== */
  function renderSimulado(container) {
    container.innerHTML = `
      <div class="enem-card">
        <h3>🚀 Iniciar Maratona de Questões ENEM</h3>
        <p>Escolha o formato do seu treino:</p>
        <button class="enem-btn" data-tempo="20">⚡ Simulado Rápido (5 Questões)</button>
        <button class="enem-btn enem-btn-sec" data-fc="erros">🔄 Revisar Questões Incorretas</button>
      </div>
      <div id="area-simulado"></div>
    `;
  }

  function iniciarSimulado(lista = BANCO_ENEM) {
    simuladoAtivo = { qs: lista, i: 0, resp: {} };
    document.body.classList.add('modo-foco');
    renderQuestao();
  }

  function renderQuestao() {
    const area = $('#area-simulado') \vert{}\vert{} $('#enem-conteudo');
    const q = simuladoAtivo.qs[simuladoAtivo.i];
    area.innerHTML = `
      <div class="enem-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:var(--accent); font-weight:bold;">Área: ${q.area}</span>
          <button class="enem-btn enem-btn-sec" id="btn-sair">❌ Cancelar</button>
        </div>
        <h4>Questão ${simuladoAtivo.i + 1} de ${simuladoAtivo.qs.length}</h4>
        <p style="font-size:1.05rem; line-height:1.5;">${q.q}</p>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${q.alt.map((a, idx) => `
            <button class="enem-btn enem-btn-sec" style="text-align:left; ${simuladoAtivo.resp[simuladoAtivo.i] === idx ? 'border-color:var(--accent); background:#2a354d;' : ''}" data-op="${idx}">
              <b>${String.fromCharCode(65 + idx)})</b>${a}
            </button>
          `).join('')}
        </div>
        <div style="margin-top:15px; display:flex; justify-content:space-between;">
          <button class="enem-btn enem-btn-sec" data-nav="-1" ${simuladoAtivo.i === 0 ? 'disabled' : ''}>⬅️ Anterior</button>
          ${simuladoAtivo.i === simuladoAtivo.qs.length - 1 
            ? `<button class="enem-btn" id="btn-finalizar">🏁 Finalizar Simulado</button>`
            : `<button class="enem-btn" data-nav="1">Próxima ➡️</button>`}
        </div>
      </div>
    `;
  }

  function finalizarSimulado() {
    document.body.classList.remove('modo-foco');
    let acertos = 0;
    const caderno = store.get(KEY_ENEM.erros, []);

    simuladoAtivo.qs.forEach((q, idx) => {
      if (simuladoAtivo.resp[idx] === q.cor) {
        acertos++;
      } else {
        if (!caderno.some(c => c.id === q.id)) {
          caderno.push(q);
        }
      }
    });

    store.set(KEY_ENEM.erros, caderno);

    const main = $('#enem-conteudo');
    const porcentagem = Math.round((acertos / simuladoAtivo.qs.length) * 100);
    main.innerHTML = `
      <div class="enem-card">
        <h2>📊 Desempenho no Simulado</h2>
        <p style="font-size:1.2rem;">Você acertou <b>${acertos}</b> de <b>${simuladoAtivo.qs.length}</b> questões (<b>${porcentagem}%</b> de aproveitamento).</p>
        <p><small>*As questões incorretas foram salvas automaticamente no seu Caderno de Revisão.</small></p>
        <button class="enem-btn" data-aba="simulado">Voltar ao Início</button>
      </div>
    `;
    simuladoAtivo = null;
  }

  function renderRedacao(container) {
    const texto = store.get(KEY_ENEM.redacao, '');
    container.innerHTML = `
      <div class="enem-card">
        <h3>✍️ Laboratório de Redação Dissertativa-Argumentativa</h3>
        <p><b>Estrutura recomendada:</b> Introdução (Tese + Repertório), 2 Desenvolvimento (D1 e D2) e Proposta de Intervenção Completa (Agente, Ação, Meio/Modo, Efeito e Detalhamento).</p>
        <textarea id="enem-red-texto" style="width:100%; height:250px; background:#000; color:#fff; border:1px solid var(--border); padding:10px; font-family:monospace;" placeholder="Digite seu texto estruturado em parágrafos aqui...">${texto}</textarea>
        <div style="display:flex; justify-content:space-between; margin-top:5px;">
          <small>Linhas estimadas: <b id="enem-linhas">0</b> / 30</small>
          <small>Palavras: <b id="enem-palavras">0</b></small>
        </div>
      </div>
    `;
    
    const ta = $('#enem-red-texto');
    const atualizarContadores = (val) => {
      store.set(KEY_ENEM.redacao, val);
      $('#enem-linhas').textContent = Math.round(val.length / 75);
      $('#enem-palavras').textContent = val.trim() ? val.trim().split(/\s+/).length : 0;
    };
    
    atualizarContadores(texto);
    ta.addEventListener('input', e => atualizarContadores(e.target.value));
  }

  function renderCaderno(container) {
    const caderno = store.get(KEY_ENEM.erros, []);
    container.innerHTML = `
      <div class="enem-card">
        <h3>📓 Caderno de Erros & Revisão Especializada</h3>
        <p>Você tem <b>${caderno.length}</b> questão(ões) pendente(s) para reforço.</p>
        ${caderno.length > 0 ? `<button class="enem-btn" data-fc="erros">🔥 Refazer Apenas as Incorretas</button>` : ''}
      </div>
    `;
  }

  /* =====================================================================
     4. EVENTOS E INICIALIZAÇÃO
     ===================================================================== */
  function bindEventos() {
    document.addEventListener('click', e => {
      const b = e.target.closest('button, [data-aba], [data-tempo], [data-op], [data-nav]');
      if (!b) return;

      if (b.dataset.aba) { showTab(b.dataset.aba); return; }
      if (b.dataset.tempo) { iniciarSimulado(); return; }

      if (b.id === 'btn-sair') {
        if (confirm('Deseja cancelar o simulado?')) {
          document.body.classList.remove('modo-foco');
          showTab('simulado');
        }
        return;
      }

      if (b.dataset.op !== undefined && simuladoAtivo) {
        simuladoAtivo.resp[simuladoAtivo.i] = Number(b.dataset.op);
        renderQuestao();
        return;
      }

      if (b.dataset.nav !== undefined && simuladoAtivo) {
        simuladoAtivo.i = Math.max(0, Math.min(simuladoAtivo.qs.length - 1, simuladoAtivo.i + Number(b.dataset.nav)));
        renderQuestao();
        return;
      }

      if (b.id === 'btn-finalizar') {
        if (confirm('Finalizar e calcular seu resultado?')) finalizarSimulado();
        return;
      }

      if (b.dataset.fc === 'erros') {
        const caderno = store.get(KEY_ENEM.erros, []);
        if (!caderno.length) { alert('Você não possui erros salvos no momento!'); return; }
        iniciarSimulado(caderno);
        return;
      }
    });
  }

  function init() {
    injetarCSS();
    montarLayout();
    bindEventos();
    showTab('simulado');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
