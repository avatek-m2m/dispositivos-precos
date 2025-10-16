document.addEventListener('DOMContentLoaded', () => {
    //
    // ============================= CONFIGURAÇÕES IMPORTANTES =============================
    //
    // Cole aqui a MESMA URL da API que você usa no site principal
    const API_URL = 'https://script.google.com/macros/s/AKfycbyg5zVjh4YIb-vvpDNv7-nYosu1OGgV-zjIBSfROjdGG928zDP53aQPKfBPPwE_76dO/exec';
    
    // IMPORTANTE: Cole sua chave de API secreta aqui.
    // Como esta página não será pública, podemos colocar a chave diretamente no código.
    const API_KEY = 'avatek@123';
    //
    // =====================================================================================

    const container = document.getElementById('admin-container');
    const searchInput = document.getElementById('searchInput');
    const reloadDataBtn = document.getElementById('reloadDataBtn');
    let allEquipmentsData = [];

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
        if (!API_KEY || API_KEY === 'SUA_CHAVE_DE_API_SECRETA_AQUI') {
            showToast("Erro: Chave de API não configurada no arquivo admin.js.");
            return;
        }
        payload.apiKey = API_KEY;

        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors', // Importante para Apps Script POST
                body: JSON.stringify(payload)
            });
            showToast("Atualização enviada! A planilha pode levar um momento para refletir.");
        } catch (error) {
            console.error('Erro no update:', error);
            showToast("Erro ao enviar atualização.");
        }
    };
    
    // Nova função para formatar a data de forma amigável
    const formatDate = (dateString) => {
        if (!dateString) return 'Nunca alterado';
        return new Date(dateString).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
    };

    const renderAdminUI = (data) => {
        container.innerHTML = '';
        data.forEach(equip => {
            const card = document.createElement('div');
            card.className = 'equipment-admin-card';

            const internalDataHTML = `
                <div class="update-section">
                    <h4>Dados Internos <span class="last-updated">(Última alteração: ${formatDate(equip.DataAlteracao)})</span></h4>
                    <table>
                      <tr>
                        <td>Valor Compra: <input type="number" step="0.01" id="valorCompra-${equip.ID_Equipamento}" value="${equip['Valor Compra']}"></td>
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
                                <td>${p.Tipo} - ${p.NomePlano} ${p.PlanoDados || ''}<br><span class="last-updated">(${formatDate(p.DataAlteracao)})</span></td>
                                <td>Parcela: <input type="number" step="0.01" id="valorParcela-${p.ID_Plano}" value="${p.ValorParcela}"></td>
                                <td>Total: <input type="number" step="0.01" id="valorTotal-${p.ID_Plano}" value="${p.ValorTotal}"></td>
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
        container.innerHTML = "<p>Carregando...</p>";
        reloadDataBtn.classList.add('reloading');
        reloadDataBtn.disabled = true;

        try {
            // Adicionamos um timestamp na URL para burlar o cache do navegador
            const response = await fetch(`${API_URL}?t=${new Date().getTime()}`);
            allEquipmentsData = await response.json();
            renderAdminUI(allEquipmentsData);
        } catch (error) {
            container.innerHTML = "<p>Erro ao carregar dados. Verifique a URL da API e se ela está implantada.</p>";
        } finally {
            reloadDataBtn.classList.remove('reloading');
            reloadDataBtn.disabled = false;
        }
    };

    searchInput.addEventListener('input', () => {
        const term = searchInput.value.toLowerCase();
        const filtered = allEquipmentsData.filter(e => e.NomeProduto.toLowerCase().includes(term));
        renderAdminUI(filtered);
    });

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

    reloadDataBtn.addEventListener('click', fetchAndRenderData);

    // Carrega os dados assim que a página abre
    fetchAndRenderData();
});
