document.addEventListener('DOMContentLoaded', () => {
    //
    // ============================= PASSO MAIS IMPORTANTE =============================
    //
    const API_URL = 'https://script.google.com/macros/s/AKfycbySWbWsnWKQuNAP4_FX0329gyuUZWEBIpH38C8pVvqn_CPqev5_3-BnPjP_ycLpdHeN/exec';
    //
    // =================================================================================

    // --- Referências aos elementos da página ---
    const container = document.getElementById('equipment-container');
    const searchInput = document.getElementById('searchInput');
    let allEquipments = [];

    // --- Referências aos elementos do MODAL ---
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');

    // --- Funções do MODAL ---
    const openModal = (imageUrl) => {
        modalImage.src = imageUrl;
        modal.style.display = 'flex';
    };

    const closeModal = () => {
        modal.style.display = 'none';
        modalImage.src = ''; // Limpa a imagem para não carregar em segundo plano
    };

    // --- Eventos para fechar o MODAL ---
    closeBtn.onclick = closeModal;
    modalOverlay.onclick = closeModal;
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    // --- Lógica principal da página ---
    const formatCurrency = (value) => {
        if (isNaN(value) || value === null) return 'R$ --';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const renderEquipments = (equipments) => {
        container.innerHTML = '';
        if (equipments.length === 0) {
            container.innerHTML = '<p class="not-found">Nenhum equipamento encontrado.</p>';
            return;
        }

        equipments.forEach(equip => {
            const card = document.createElement('div');
            card.className = 'equipment-card';

            // Gera o botão "Ver Imagem" apenas se a URL da imagem existir
            const imageButtonHTML = equip.URL_Imagem ?
                `<button class="view-image-btn" data-img-src="${equip.URL_Imagem}">Ver Imagem</button>` :
                '';

            const vendaPlans = equip.planos.filter(p => p.Tipo === 'Venda');
            const locacaoPlans = equip.planos.filter(p => p.Tipo === 'Locação');
            let vendaHTML = '';
            if (vendaPlans.length > 0) { /* ... lógica de planos de venda ... */ }
            let locacaoHTML = '';
            if (locacaoPlans.length > 0) { /* ... lógica de planos de locação ... */ }
            
            // Re-gerando a lógica dos planos aqui para ficar completo
            if (vendaPlans.length > 0) {
                vendaHTML = `<div class="plans-section"><h4>Planos de Venda</h4>${vendaPlans.map(p => `<div class="plan"><span class="plan-name">${p.NomePlano}</span><span class="plan-price">${p.NumeroParcelas > 1 ? `${p.NumeroParcelas}x de ` : ''}${formatCurrency(p.ValorParcela)}</span></div>`).join('')}</div>`;
            }
            if (locacaoPlans.length > 0) {
                const groupedLocacao = locacaoPlans.reduce((acc, plan) => { (acc[plan.NomePlano] = acc[plan.NomePlano] || []).push(plan); return acc; }, {});
                locacaoHTML = `<div class="plans-section"><h4>Planos de Locação</h4>${Object.keys(groupedLocacao).map(groupName => `<div class="plan-group"><strong class="group-name">${groupName}</strong>${groupedLocacao[groupName].sort((a, b) => (a.PlanoDados || '').localeCompare(b.PlanoDados || '')).map(p => `<div class="plan"><span class="plan-name data-plan">${p.PlanoDados || ''}</span><span class="plan-price">${formatCurrency(p.ValorParcela)} / mês</span></div>`).join('')}</div>`).join('')}</div>`;
            }


            card.innerHTML = `
                <div class="card-header">
                    <h3>${equip.NomeProduto}</h3>
                    <p>${equip.Fabricante} - Modelo: ${equip.Modelo}</p>
                    <p class="stock">Estoque: <strong>${equip.Estoque !== undefined && equip.Estoque !== '' ? equip.Estoque : 'N/D'}</strong></p>
                    ${imageButtonHTML}
                </div>
                <div class="card-body">
                    ${vendaHTML}
                    ${locacaoHTML}
                </div>
            `;
            container.appendChild(card);
        });
    };

    const fetchData = async () => { /* ... sua função fetchData existente ... */ };
    // Colando a função fetchData completa para garantir
    const fetchDataAsync = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`Falha na resposta da rede: ${response.statusText}`);
            const data = await response.json();
            allEquipments = data;
            renderEquipments(allEquipments);
        } catch (error) {
            console.error('Erro ao buscar os dados:', error);
            container.innerHTML = '<p class="error-message">Falha ao carregar os equipamentos. Verifique a URL da API e as permissões. Tente novamente mais tarde.</p>';
        }
    };


    // --- Delegação de Evento para os botões "Ver Imagem" ---
    container.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-image-btn')) {
            const imageUrl = event.target.dataset.imgSrc;
            openModal(imageUrl);
        }
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredEquipments = allEquipments.filter(equip =>
            equip.NomeProduto.toLowerCase().includes(searchTerm) ||
            equip.Fabricante.toLowerCase().includes(searchTerm) ||
            equip.Modelo.toLowerCase().includes(searchTerm)
        );
        renderEquipments(filteredEquipments);
    });

    fetchDataAsync(); // Chamando a função para iniciar
});
