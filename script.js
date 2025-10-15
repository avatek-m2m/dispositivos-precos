document.addEventListener('DOMContentLoaded', () => {
    //
    // !!!   PASSO MAIS IMPORTANTE   !!!
    // !!!   COLE AQUI A URL DO SEU APP DA WEB OBTIDA NO GOOGLE APPS SCRIPT   !!!
    //
    const API_URL = 'https://script.google.com/macros/s/AKfycbxlnIqb56B3gC9Xi7P6lgdhUk7luRxW3ggx7Kk4qkI7lLbr6qR27rstO27IVLre0eMv/exec';

    const container = document.getElementById('equipment-container');
    const searchInput = document.getElementById('searchInput');
    let allEquipments = []; // Array para guardar os dados originais e não perder na busca

    // Função para formatar números como moeda brasileira (BRL)
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Função que renderiza os cards na tela
    const renderEquipments = (equipments) => {
        container.innerHTML = ''; // Limpa o conteúdo atual

        if (equipments.length === 0) {
            container.innerHTML = '<p>Nenhum equipamento encontrado.</p>';
            return;
        }

        equipments.forEach(equip => {
            const card = document.createElement('div');
            card.className = 'equipment-card';

            // Separa os planos por tipo (Venda e Locação)
            const vendaPlans = equip.planos.filter(p => p.Tipo === 'Venda');
            const locacaoPlans = equip.planos.filter(p => p.Tipo === 'Locação');

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

            let locacaoHTML = '';
            if (locacaoPlans.length > 0) {
                locacaoHTML = `
                    <div class="plans-section">
                        <h4>Planos de Locação</h4>
                        ${locacaoPlans.map(p => `
                            <div class="plan">
                                <span class="plan-name">${p.NomePlano}</span>
                                <span class="plan-price">${formatCurrency(p.ValorParcela)} / mês</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // Monta o HTML final do card
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

    // Função principal para buscar os dados
    const fetchData = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Falha na resposta da rede.');
            }
            const data = await response.json();
            allEquipments = data; // Guarda os dados originais
            renderEquipments(allEquipments); // Renderiza todos os equipamentos
        } catch (error) {
            console.error('Erro ao buscar os dados:', error);
            container.innerHTML = '<p>Falha ao carregar os equipamentos. Verifique a URL da API e as permissões da planilha. Tente novamente mais tarde.</p>';
        }
    };

    // Evento para o campo de busca
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredEquipments = allEquipments.filter(equip =>
            equip.NomeProduto.toLowerCase().includes(searchTerm) ||
            equip.Fabricante.toLowerCase().includes(searchTerm) ||
            equip.Modelo.toLowerCase().includes(searchTerm)
        );
        renderEquipments(filteredEquipments);
    });

    // Inicia o processo buscando os dados
    fetchData();
});
