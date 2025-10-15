document.addEventListener('DOMContentLoaded', () => {
    //
    // ============================= PASSO MAIS IMPORTANTE =============================
    //
    // COLE AQUI A URL DO SEU APP DA WEB OBTIDA NO GOOGLE APPS SCRIPT
    // A URL deve estar entre as aspas simples.
    //
    const API_URL = 'https://script.google.com/macros/s/AKfycbySWbWsnWKQuNAP4_FX0329gyuUZWEBIpH38C8pVvqn_CPqev5_3-BnPjP_ycLpdHeN/exec';
    //
    // =================================================================================

    const container = document.getElementById('equipment-container');
    const searchInput = document.getElementById('searchInput');
    let allEquipments = []; // Array para guardar os dados originais para não perder na busca

    /**
     * Formata um número como moeda brasileira (BRL).
     * @param {number} value - O valor numérico a ser formatado.
     * @returns {string} O valor formatado como moeda (ex: R$ 1.234,56).
     */
    const formatCurrency = (value) => {
        // Se o valor não for um número, retorna um traço para evitar erros.
        if (isNaN(value) || value === null) {
            return 'R$ --';
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    /**
     * Renderiza a lista de equipamentos na tela, criando um card para cada um.
     * @param {Array<Object>} equipments - A lista de equipamentos a ser exibida.
     */
    const renderEquipments = (equipments) => {
        container.innerHTML = ''; // Limpa o conteúdo atual do container

        // Se a lista de equipamentos estiver vazia, exibe uma mensagem.
        if (equipments.length === 0) {
            container.innerHTML = '<p class="not-found">Nenhum equipamento encontrado.</p>';
            return;
        }

        equipments.forEach(equip => {
            const card = document.createElement('div');
            card.className = 'equipment-card';

            // Separa os planos por tipo para renderizá-los em seções diferentes
            const vendaPlans = equip.planos.filter(p => p.Tipo === 'Venda');
            const locacaoPlans = equip.planos.filter(p => p.Tipo === 'Locação');

            // --- GERA O HTML PARA OS PLANOS DE VENDA ---
            let vendaHTML = '';
            if (vendaPlans.length > 0) {
                vendaHTML = `
                    <div class="plans-section">
                        <h4>Planos de Venda</h4>
                        ${vendaPlans.map(p => `
                            <div class="plan">
                                <span class="plan-name">${p.NomePlano}</span>
                                <span class="plan-price">${p.NumeroParcelas > 1 ? `${p.NumeroParcelas}x de ` : ''}${formatCurrency(p.ValorParcela)}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // --- GERA O HTML PARA OS PLANOS DE LOCAÇÃO (COM A NOVA LÓGICA DE AGRUPAMENTO) ---
            let locacaoHTML = '';
            if (locacaoPlans.length > 0) {
                // Agrupa os planos por duração (ex: "12 Meses", "24 Meses")
                const groupedLocacao = locacaoPlans.reduce((acc, plan) => {
                    acc[plan.NomePlano] = acc[plan.NomePlano] || [];
                    acc[plan.NomePlano].push(plan);
                    return acc;
                }, {});

                locacaoHTML = `
                    <div class="plans-section">
                        <h4>Planos de Locação</h4>
                        ${Object.keys(groupedLocacao).map(groupName => `
                            <div class="plan-group">
                                <strong class="group-name">${groupName}</strong>
                                ${groupedLocacao[groupName].sort((a, b) => a.PlanoDados.localeCompare(b.PlanoDados)).map(p => `
                                    <div class="plan">
                                        <span class="plan-name data-plan">${p.PlanoDados || ''}</span>
                                        <span class="plan-price">${formatCurrency(p.ValorParcela)} / mês</span>
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // Monta o HTML final do card com todas as seções
            card.innerHTML = `
                <div class="card-header">
                    <h3>${equip.NomeProduto}</h3>
                    <p>${equip.Fabricante} - Modelo: ${equip.Modelo}</p>
                </div>
                <div class="card-body">
                    ${vendaHTML}
                    ${locacaoHTML}
                </div>
            `;
            container.appendChild(card);
        });
    };

    /**
     * Busca os dados da API do Google Apps Script.
     */
    const fetchData = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Falha na resposta da rede: ${response.statusText}`);
            }
            const data = await response.json();
            allEquipments = data; // Guarda os dados originais
            renderEquipments(allEquipments); // Renderiza todos os equipamentos na tela
        } catch (error) {
            console.error('Erro ao buscar os dados:', error);
            container.innerHTML = '<p class="error-message">Falha ao carregar os equipamentos. Verifique a URL da API no arquivo script.js e as permissões da planilha. Tente novamente mais tarde.</p>';
        }
    };

    // Adiciona o evento de "escuta" ao campo de busca
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        // Filtra a lista completa de equipamentos
        const filteredEquipments = allEquipments.filter(equip =>
            equip.NomeProduto.toLowerCase().includes(searchTerm) ||
            equip.Fabricante.toLowerCase().includes(searchTerm) ||
            equip.Modelo.toLowerCase().includes(searchTerm)
        );
        // Renderiza apenas os equipamentos filtrados
        renderEquipments(filteredEquipments);
    });

    // Inicia todo o processo buscando os dados da API
    fetchData();
});
