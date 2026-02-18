document.addEventListener('DOMContentLoaded', () => {
    //
    // ============================= CONFIGURAÇÕES IMPORTANTES =============================
    //
    const API_URL = 'https://script.google.com/macros/s/AKfycbxdLedZAMb-zN64kivWw4zHChHtCFZYu19Jw3NrCAjc98PaIFL_Rayuv8Q7VIrw5FNz/exec';
    const GITHUB_SPECS_URL_BASE = 'https://raw.githubusercontent.com/avatek-m2m/dispositivos-precos/main/especificacoes/';
    //
    // =====================================================================================

    // --- Mapa de Logos ---
    const supplierLogos = {
        'TELTONIKA': 'https://img.logo.dev/teltonika-gps.com?token=pk_FGnHpYa7RVyBaPNWay1WYg',
        'SUNTECH': 'https://img.logo.dev/suntechdobrasil.com.br?token=pk_FGnHpYa7RVyBaPNWay1WYg',
        'RUPTELA': 'https://img.logo.dev/ruptela.com?token=pk_FGnHpYa7RVyBaPNWay1WYg',
        'TOPFLY': 'https://img.logo.dev/topflytech.com?token=pk_FGnHpYa7RVyBaPNWay1WYg',
        'QUECLINK': 'https://img.logo.dev/queclink.com?token=pk_FGnHpYa7RVyBaPNWay1WYg',
        'CONCOX': 'https://img.logo.dev/iconcox.com?token=pk_FGnHpYa7RVyBaPNWay1WYg',
        'JIMI IoT': 'https://img.logo.dev/jimilab.com?token=pk_FGnHpYa7RVyBaPNWay1WYg',
        'LUMINI': 'https://img.logo.dev/queclink.com?token=pk_FGnHpYa7RVyBaPNWay1WYg'
    };

    // --- Referências aos elementos da página ---
    const container = document.getElementById('equipment-container');
    const searchInput = document.getElementById('searchInput');
    const reloadDataBtn = document.getElementById('reloadDataBtn'); // Botão de Recarregar
    let allEquipments = [];

    // --- Referências aos MODAIS ---
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeImageBtn = document.querySelector('#imageModal .modal-close');
    const imageModalOverlay = document.querySelector('#imageModal .modal-overlay');
    const specModal = document.getElementById('specModal');
    const modalSpecs = document.getElementById('modalSpecs');
    const modalSpecTitle = document.getElementById('modalSpecTitle');
    const closeSpecBtn = document.querySelector('#specModal .modal-close');
    const specModalOverlay = document.querySelector('#specModal .modal-overlay');

    // --- Funções dos MODAIS ---
    const openImageModal = (imageUrl) => { modalImage.src = imageUrl; imageModal.style.display = 'flex'; };
    const closeImageModal = () => { imageModal.style.display = 'none'; modalImage.src = ''; };
    const openSpecModal = async (fileName, equipName) => {
        modalSpecTitle.textContent = `Especificações Técnicas - ${equipName}`;
        modalSpecs.innerHTML = 'Carregando...';
        specModal.style.display = 'flex';
        try {
            const response = await fetch(`${GITHUB_SPECS_URL_BASE}${fileName}`);
            if (!response.ok) throw new Error('Arquivo não encontrado.');
            const text = await response.text();
            const html = text.replace(/^# (.*$)/gm, '').replace(/^## (.*$)/gm, '<h3>$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^\* (.*$)/gm, '<li>$1</li>').replace(/(\r\n|\n|\r)/gm, '<br>');
            const cleanHtml = html.replace(/<br>\s*<h/g, '<h').replace(/<\/li><br>/g, '</li>');
            modalSpecs.innerHTML = `<ul>${cleanHtml}</ul>`;
        } catch (error) {
            console.error('Erro ao buscar especificações:', error);
            modalSpecs.textContent = 'Não foi possível carregar as especificações.';
        }
    };
    const closeSpecModal = () => { specModal.style.display = 'none'; };

    // --- Eventos para fechar os MODAIS ---
    closeImageBtn.onclick = closeImageModal; imageModalOverlay.onclick = closeImageModal;
    closeSpecBtn.onclick = closeSpecModal; specModalOverlay.onclick = closeSpecModal;
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeImageModal(); closeSpecModal(); } });

    // --- Lógica principal da página ---
    const formatCurrency = (value) => { if (isNaN(value) || value === null) return 'R$ --'; return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); };
    const renderEquipments = (equipments) => {
        container.innerHTML = '';
        if (equipments.length === 0) { container.innerHTML = '<p class="not-found">Nenhum equipamento encontrado.</p>'; return; }
        equipments.forEach(equip => {
            const card = document.createElement('div'); card.className = 'equipment-card';
            const logoUrl = supplierLogos[equip.Fabricante];
            const logoHTML = logoUrl ? `<img src="${logoUrl}" alt="Logo ${equip.Fabricante}" class="supplier-logo">` : '';
            const imageButtonHTML = equip.URL_Imagem ? `<button class="view-image-btn" data-img-src="${equip.URL_Imagem}">Ver Imagem</button>` : '';
            const specButtonHTML = equip.Especificacoes ? `<button class="view-spec-btn" data-specs-file="${equip.Especificacoes}" data-name="${equip.NomeProduto}">Ver Especificações</button>` : '';
            const vendaPlans = equip.planos.filter(p => p.Tipo === 'Venda'); const locacaoPlans = equip.planos.filter(p => p.Tipo === 'Locação');
            let vendaHTML = ''; let locacaoHTML = '';
            if (vendaPlans.length > 0) { vendaHTML = `<div class="plans-section"><h4>Planos de Venda</h4>${vendaPlans.map(p => `<div class="plan"><span class="plan-name">${p.NomePlano}</span><span class="plan-price">${p.NumeroParcelas > 1 ? `${p.NumeroParcelas}x de ` : ''}${formatCurrency(p.ValorParcela)}</span></div>`).join('')}</div>`; }
            if (locacaoPlans.length > 0) { const groupedLocacao = locacaoPlans.reduce((acc, plan) => { (acc[plan.NomePlano] = acc[plan.NomePlano] || []).push(plan); return acc; }, {}); locacaoHTML = `<div class="plans-section"><h4>Planos de Locação</h4>${Object.keys(groupedLocacao).map(groupName => `<div class="plan-group"><strong class="group-name">${groupName}</strong>${groupedLocacao[groupName].sort((a, b) => (a.PlanoDados || '').localeCompare(b.PlanoDados || '')).map(p => `<div class="plan"><span class="plan-name data-plan">${p.PlanoDados || ''}</span><span class="plan-price">${formatCurrency(p.ValorParcela)} / mês</span></div>`).join('')}</div>`).join('')}</div>`; }
            card.innerHTML = `<div class="card-header"><h3>${equip.NomeProduto}</h3><div class="manufacturer-info">${logoHTML}<p>${equip.Fabricante} - Modelo: ${equip.Modelo}</p></div><p class="stock">Estoque: <strong>${equip.Estoque !== undefined && equip.Estoque !== '' ? equip.Estoque : 'N/D'}</strong></p><div class="button-container">${imageButtonHTML}${specButtonHTML}</div></div><div class="card-body">${vendaHTML}${locacaoHTML}</div>`;
            container.appendChild(card);
        });
    };
    
    // --- FUNÇÃO fetchData TOTALMENTE ATUALIZADA ---
    const fetchData = async () => {
        // Mostra o loader principal e ativa a animação do botão
        container.innerHTML = `<div class="loader"><div class="spinner"></div><p>Carregando equipamentos...</p></div>`;
        reloadDataBtn.classList.add('reloading');
        reloadDataBtn.disabled = true;

        try {
            // Adiciona um timestamp na URL para burlar o cache do navegador
            const response = await fetch(`${API_URL}?t=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`Falha na resposta: ${response.statusText}`);
            const data = await response.json();
            allEquipments = data;
            renderEquipments(allEquipments);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            container.innerHTML = '<p class="error-message">Falha ao carregar. Verifique a URL da API e as permissões.</p>';
        } finally {
            // Este bloco SEMPRE será executado, com sucesso ou erro.
            reloadDataBtn.classList.remove('reloading'); // Remove a animação
            reloadDataBtn.disabled = false; // Habilita o botão novamente
        }
    };
    
    // --- Lógica dos Eventos ---
    container.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-image-btn')) { openImageModal(event.target.dataset.imgSrc); }
        if (event.target.classList.contains('view-spec-btn')) { openSpecModal(event.target.dataset.specsFile, event.target.dataset.name); }
    });
    searchInput.addEventListener('input', (e) => { const term = e.target.value.toLowerCase(); const filtered = allEquipments.filter(equip => equip.NomeProduto.toLowerCase().includes(term) || equip.Fabricante.toLowerCase().includes(term) || equip.Modelo.toLowerCase().includes(term)); renderEquipments(filtered); });
    
    reloadDataBtn.addEventListener('click', fetchData);

    // Inicia a primeira busca de dados
    fetchData();
});
