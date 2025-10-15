document.addEventListener('DOMContentLoaded', () => {
    // Cole aqui a MESMA URL da API que você usa no site principal
    const API_URL = 'https://script.google.com/macros/s/AKfycbxlnIqb56B3gC9Xi7P6lgdhUk7luRxW3ggx7Kk4qkI7lLbr6qR27rstO27IVLre0eMv/exec';

    const apiKeyInput = document.getElementById('apiKey');
    const container = document.getElementById('admin-container');
    const searchInput = document.getElementById('searchInput');
    let allEquipmentsData = [];

    // Salva a chave de API no navegador para não precisar digitar sempre
    apiKeyInput.value = localStorage.getItem('tabelaPrecosApiKey') || '';
    apiKeyInput.addEventListener('change', () => {
        localStorage.setItem('tabelaPrecosApiKey', apiKeyInput.value);
        fetchAndRenderData();
    });

    const showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 500);
        }, 3000);
    };

    const sendUpdateRequest = async (payload) => {
        const apiKey = apiKeyInput.value;
        if (!apiKey) {
            showToast("Erro: Chave de API é necessária.");
            return;
        }
        payload.apiKey = apiKey;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors', // Importante para Apps Script POST
                cache: 'no-cache',
                redirect: 'follow',
                body: JSON.stringify(payload)
            });
            // A resposta de no-cors é opaca, então confiamos que funcionou e damos feedback
            showToast("Atualização enviada! A planilha pode levar um momento para refletir.");
        } catch (error) {
            console.error('Erro no update:', error);
            showToast("Erro ao enviar atualização.");
        }
    };

    const renderAdminUI = (data) => {
        container.innerHTML = '';
        data.forEach(equip => {
            const card = document.createElement('div');
            card.className = 'equipment-admin-card';

            const internalDataHTML = `
                <div class="update-section">
                    <h4>Dados Internos</h4>
                    <table>
                      <tr>
                        <td>Valor Compra: <input type="number" id="valorCompra-${equip.ID_Equipamento}" value="${equip['Valor Compra']}"></td>
                        <td>Estoque: <input type="number" id="estoque-${equip.ID_Equipamento}" value="${equip.Estoque}"></td>
                        <td><button data-id="${equip.ID_Equipamento}" class="update-internals">Salvar</button></td>
                      </tr>
                    </table>
                </div>`;

            const plansHTML = `
                <div class="update-section">
                    <h4>Planos</h4>
                    <table>
                        ${equip.planos.map(p => `
                            <tr>
                                <td>${p.Tipo} - ${p.NomePlano} ${p.PlanoDados || ''}</td>
                                <td>Parcela: <input type="number" id="valorParcela-${p.ID_Plano}" value="${p.ValorParcela}"></td>
                                <td>Total: <input type="number" id="valorTotal-${p.ID_Plano}" value="${p.ValorTotal}"></td>
                                <td><button data-id="${p.ID_Plano}" class="update-plan">Salvar</button></td>
                            </tr>
                        `).join('')}
                    </table>
                </div>`;

            card.innerHTML = `
                <div class="card-header"><h3>${equip.NomeProduto}</h3></div>
                <div class="card-body">
                    ${internalDataHTML}
                    ${plansHTML}
                </div>`;
            container.appendChild(card);
        });
    };

    const fetchAndRenderData = async () => {
        if (!apiKeyInput.value) return;
        container.innerHTML = "<p>Carregando...</p>";
        try {
            const response = await fetch(API_URL);
            allEquipmentsData = await response.json();
            renderAdminUI(allEquipmentsData);
        } catch (error) {
            container.innerHTML = "<p>Erro ao carregar dados. Verifique a URL da API e se ela está implantada.</p>";
        }
    };

    searchInput.addEventListener('input', () => {
        const term = searchInput.value.toLowerCase();
        const filtered = allEquipmentsData.filter(e => e.NomeProduto.toLowerCase().includes(term));
        renderAdminUI(filtered);
    });

    // Event listener para os botões de salvar
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('update-internals')) {
            const id = e.target.dataset.id;
            const valorCompra = document.getElementById(`valorCompra-${id}`).value;
            const estoque = document.getElementById(`estoque-${id}`).value;
            sendUpdateRequest({ action: 'update_internals', id, valorCompra, estoque });
        }
        if (e.target.classList.contains('update-plan')) {
            const id = e.target.dataset.id;
            const valorParcela = document.getElementById(`valorParcela-${id}`).value;
            const valorTotal = document.getElementById(`valorTotal-${id}`).value;
            sendUpdateRequest({ action: 'update_plan', id, valorParcela, valorTotal });
        }
    });

    if (apiKeyInput.value) {
        fetchAndRenderData();
    }
});
