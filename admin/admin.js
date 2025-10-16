document.addEventListener('DOMContentLoaded', () => {
    //
    // ============================= CONFIGURAÇÕES IMPORTANTES =============================
    //
    const API_URL = 'https://script.google.com/macros/s/AKfycbxdLedZAMb-zN64kivWw4zHChHtCFZYu19Jw3NrCAjc98PaIFL_Rayuv8Q7VIrw5FNz/exec';
    const API_KEY = 'avatek@123';
    //
    // =====================================================================================

    // --- NOVO MAPA DE LOGOS ---
    // Mapeia o nome do fabricante (exatamente como está na planilha) para a URL do logo.
    const supplierLogos = {
        'TELTONIKA': 'https://logo.clearbit.com/teltonika-gps.com',
        'SUNTECH': 'https://logo.clearbit.com/suntechdobrasil.com.br',
        'RUPTELA': 'https://logo.clearbit.com/ruptela.com',
        'TOPFLY': 'https://logo.clearbit.com/topflytech.com',
        'QUECLINK': 'https://logo.clearbit.com/queclink.com',
        'CONCOX': 'https://logo.clearbit.com/iconcox.com',
        'JIMI IoT': 'https://logo.clearbit.com/jimilab.com'
    };

    const container = document.getElementById('admin-container');
    const searchInput = document.getElementById('searchInput');
    const reloadDataBtn = document.getElementById('reloadDataBtn');
    let allEquipmentsData = [];

    const showToast = (message, isSuccess = true) => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        if (!isSuccess) toast.style.backgroundColor = '#dc3545';
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 500);
        }, 3000);
    };

    const sendUpdateRequest = async (payload) => {
        if (!API_KEY || API_KEY === 'SUA_CHAVE_DE_API_SECRETA_AQUI') {
            showToast("Erro: Chave de API não configurada no admin.js.", false);
            return false;
        }
        payload.apiKey = API_KEY;
        try {
            await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
            showToast("Atualização enviada com sucesso!");
            return true;
        } catch (error) {
            console.error('Erro no update:', error);
            showToast(`Erro ao salvar: ${error.message}`, false);
            return false;
        }
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'Nunca alterado';
        return new Date(dateString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    };

    const renderAdminUI = (data) => {
        container.innerHTML = '';
        data.forEach(equip => {
            const card = document.createElement('div');
            card.className = 'equipment-admin-card';
            card.id = `card-${equip.ID_Equipamento}`;

            // --- LÓGICA ATUALIZADA PARA OS LOGOS ---
            const logoUrl = supplierLogos[equip.Fabricante];
            const logoHTML = logoUrl ? `<img src="${logoUrl}" alt="Logo ${equip.Fabricante}" class="supplier-logo">` : '';

            const internalDataHTML = `
                <div class="update-section">
                    <h4>Dados Internos <span class="last-updated">(Última alteração: ${formatDate(equip.DataAlteracao)})</span></h4>
                    <table>
                      <tr>
                        <td>Valor Compra: <input type="number" step="0.01" value="${equip['Valor Compra']}"></td>
                        <td>Estoque: <input type="number" value="${equip.Estoque}"></td>
                      </tr>
                    </table>
                </div>`;

            const plansHTML = `
                <div class="update-section">
                    <h4>Planos</h4>
                    <table>
                        ${equip.planos.map(p => `
                            <tr data-plan-id="${p.ID_Plano}">
                                <td>${p.Tipo} - ${p.NomePlano} ${p.PlanoDados || ''}<br><span class="last-updated">(${formatDate(p.DataAlteracao)})</span></td>
                                <td>Parcela: <input type="number" step="0.01" value="${p.ValorParcela}"></td>
                                <td>Total: <input type="number" step="0.01" value="${p.ValorTotal}"></td>
                            </tr>
                        `).join('')}
                    </table>
                </div>`;
            
            // --- card.innerHTML ATUALIZADO ---
            card.innerHTML = `
                <div class="card-header">
                    <h3>${equip.NomeProduto}</h3>
                    <div class="manufacturer-info">
                        ${logoHTML}
                        <span>${equip.Fabricante} - Modelo: ${equip.Modelo}</span>
                    </div>
                </div>
                <div class="card-body">
                    ${internalDataHTML}
                    ${plansHTML}
                </div>
                <div class="card-footer">
                    <button class="save-all-btn" data-id="${equip.ID_Equipamento}">Salvar Alterações</button>
                </div>`;
            container.appendChild(card);
        });
    };

    const fetchAndRenderData = async () => {
        container.innerHTML = "<p>Carregando...</p>";
        reloadDataBtn.classList.add('reloading');
        reloadDataBtn.disabled = true;
        try {
            const response = await fetch(`${API_URL}?t=${new Date().getTime()}`);
            allEquipmentsData = await response.json();
            renderAdminUI(allEquipmentsData);
        } catch (error) {
            container.innerHTML = "<p>Erro ao carregar dados. Verifique a URL da API.</p>";
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

    container.addEventListener('click', async (e) => {
        if (e.target.classList.contains('save-all-btn')) {
            const button = e.target;
            button.textContent = 'Salvando...';
            button.disabled = true;
            const equipId = button.dataset.id;
            const card = document.getElementById(`card-${equipId}`);
            const valorCompra = card.querySelectorAll('input[type="number"]')[0].value;
            const estoque = card.querySelectorAll('input[type="number"]')[1].value;
            const planos = [];
            card.querySelectorAll('table tr[data-plan-id]').forEach(row => {
                const planId = row.dataset.planId;
                const valorParcela = row.querySelectorAll('input[type="number"]')[0].value;
                const valorTotal = row.querySelectorAll('input[type="number"]')[1].value;
                planos.push({ id: planId, valorParcela, valorTotal });
            });
            const payload = { action: 'update_product_all', id: equipId, valorCompra, estoque, planos };
            const success = await sendUpdateRequest(payload);
            if (success) {
                setTimeout(() => { fetchAndRenderData(); }, 1500);
            } else {
                button.textContent = 'Salvar Alterações';
                button.disabled = false;
            }
        }
    });

    reloadDataBtn.addEventListener('click', fetchAndRenderData);
    fetchAndRenderData();
});
