document.addEventListener('DOMContentLoaded', () => {
    //
    // ============================= CONFIGURAÇÕES IMPORTANTES =============================
    //
    const API_URL = 'https://script.google.com/macros/s/AKfycbySWbWsnWKQuNAP4_FX0329gyuUZWEBIpH38C8pVvqn_CPqev5_3-BnPjP_ycLpdHeN/exec';

    // Verifique se o caminho para sua pasta de especificações está correto!
    // Assumindo que seu usuário é 'avatek-m2m' e o repositório é 'dispositivos-precos'
    const GITHUB_SPECS_URL_BASE = 'https://raw.githubusercontent.com/avatek-m2m/dispositivos-precos/main/especificacoes/';
    //
    // =====================================================================================

    // --- Referências aos elementos da página ---
    const container = document.getElementById('equipment-container');
    const searchInput = document.getElementById('searchInput');
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
    const openImageModal = (imageUrl) => {
        modalImage.src = imageUrl;
        imageModal.style.display = 'flex';
    };
    const closeImageModal = () => {
        imageModal.style.display = 'none';
        modalImage.src = '';
    };

    const openSpecModal = async (fileName, equipName) => {
        modalSpecTitle.textContent = `Especificações Técnicas - ${equipName}`;
        modalSpecs.innerHTML = 'Carregando...';
        specModal.style.display = 'flex';

        try {
            const response = await fetch(`${GITHUB_SPECS_URL_BASE}${fileName}`);
            if (!response.ok) throw new Error('Arquivo de especificação não encontrado.');
            const text = await response.text();
            
            // Converte o texto Markdown para HTML de forma simples
            const html = text
                .replace(/^# (.*$)/gm, '') // Remove o título principal H1 se houver
                .replace(/^## (.*$)/gm, '<h3>$1</h3>') // Converte H2 em h3
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negrito
                .replace(/^\* (.*$)/gm, '<li>$1</li>') // Itens de lista
                .replace(/(\r\n|\n|\r)/gm, '<br>'); // Converte quebras de linha

            // Limpa quebras de linha extras ao redor das tags
            const cleanHtml = html.replace(/<br>\s*<h/g, '<h').replace(/<\/li><br>/g, '</li>');

            modalSpecs.innerHTML = `<ul>${cleanHtml}</ul>`;
        } catch (error) {
            console.error('Erro ao buscar especificações:', error);
            modalSpecs.textContent = 'Não foi possível carregar as especificações.';
        }
    };
    const closeSpecModal = () => {
        specModal.style.display = 'none';
    };

    // --- Eventos para fechar os MODAIS ---
    closeImageBtn.onclick = closeImageModal;
    imageModalOverlay.onclick = closeImageModal;
    closeSpecBtn.onclick = closeSpecModal;
    specModalOverlay.onclick = closeSpecModal;
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeImageModal();
            closeSpecModal();
        }
    });

    // --- Lógica principal da página ---
    const formatCurrency = (value) => { if (isNaN(value) || value === null) return 'R$ --'; return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); };
    const renderEquipments = (equipments) => {
        container.innerHTML = '';
        if (equipments.length === 0) { container.innerHTML = '<p class="not-found">Nenhum equipamento encontrado.</p>'; return; }
        equipments.forEach(equip => {
            const card = document.createElement('div'); card.className = 'equipment-card';
            const imageButtonHTML = equip.URL_Imagem ? `<button class="view-image-btn" data-img-src="${equip.URL_Imagem}">Ver Imagem</button>` : '';
            const specButtonHTML = equip.Especificacoes ? `<button class="view-spec-btn" data-specs-file="${equip.Especificacoes}" data-name="${equip.NomeProduto}">Ver Especificações</button>` : '';
            const vendaPlans = equip.planos.filter(p => p.Tipo === 'Venda'); const locacaoPlans = equip.planos.filter(p => p.Tipo === 'Locação');
            let vendaHTML = ''; let locacaoHTML = '';
            if (vendaPlans.length > 0) { vendaHTML = `<div class="plans-section"><h4>Planos de Venda</h4>${vendaPlans.map(p => `<div class="plan"><span class="plan-name">${p.NomePlano}</span><span class="plan-price">${p.NumeroParcelas > 1 ? `${p.NumeroParcelas}x de ` : ''}${formatCurrency(p.ValorParcela)}</span></div>`).join('')}</div>`; }
            if (locacaoPlans.length > 0) { const groupedLocacao = locacaoPlans.reduce((acc, plan) => { (acc[plan.NomePlano] = acc[plan.NomePlano] || []).push(plan); return acc; }, {}); locacaoHTML = `<div class="plans-section"><h4>Planos de Locação</h4>${Object.keys(groupedLocacao).map(groupName => `<div class="plan-group"><strong class="group-name">${groupName}</strong>${groupedLocacao[groupName].sort((a, b) => (a.PlanoDados || '').localeCompare(b.PlanoDados || '')).map(p => `<div class="plan"><span class="plan-name data-plan">${p.PlanoDados || ''}</span><span class="plan-price">${formatCurrency(p.ValorParcela)} / mês</span></div>`).join('')}</div>`).join('')}</div>`; }
            card.innerHTML = `<div class="card-header"><h3>${equip.NomeProduto}</h3><p>${equip.Fabricante} - Modelo: ${equip.Modelo}</p><p class="stock">Estoque: <strong>${equip.Estoque !== undefined && equip.Estoque !== '' ? equip.Estoque : 'N/D'}</strong></p><div class="button-container">${imageButtonHTML}${specButtonHTML}</div></div><div class="card-body">${vendaHTML}${locacaoHTML}</div>`;
            container.appendChild(card);
        });
    };
    const fetchData = async () => { try { const response = await fetch(API_URL); if (!response.ok) throw new Error(`Falha na resposta: ${response.statusText}`); const data = await response.json(); allEquipments = data; renderEquipments(allEquipments); } catch (error) { console.error('Erro ao buscar dados:', error); container.innerHTML = '<p class="error-message">Falha ao carregar. Verifique a URL da API e as permissões.</p>'; } };
    
    // --- Delegação de Evento para AMBOS os tipos de botão ---
    container.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-image-btn')) {
            openImageModal(event.target.dataset.imgSrc);
        }
        if (event.target.classList.contains('view-spec-btn')) {
            const fileName = event.target.dataset.specsFile;
            const name = event.target.dataset.name;
            openSpecModal(fileName, name);
        }
    });

    searchInput.addEventListener('input', (e) => { const term = e.target.value.toLowerCase(); const filtered = allEquipments.filter(equip => equip.NomeProduto.toLowerCase().includes(term) || equip.Fabricante.toLowerCase().includes(term) || equip.Modelo.toLowerCase().includes(term)); renderEquipments(filtered); });
    fetchData();
});
