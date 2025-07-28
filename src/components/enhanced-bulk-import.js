/**
 * Sistema de importação em massa aprimorado com batching dinâmico
 */
export class EnhancedBulkImport {
    constructor() {
        this.bulkData = [];
        this.batches = [];
        this.currentBatchIndex = 0;
        this.totalRecords = 0;
        this.processedRecords = 0;
        this.successfulRecords = 0;
        this.failedRecords = 0;
        this.isProcessing = false;
        this.isPaused = false;
        this.retryAttempts = {};
        this.maxRetries = 3;
        this.backoffDelays = [2000, 4000, 6000]; // 2s, 4s, 6s
        this.startTime = null;
        this.results = {
            success: [],
            errors: [],
            total: 0
        };
        
        console.log('🚀 Enhanced Bulk Import System inicializado');
    }

    // Determinar tamanho do lote baseado no número de registros
    determineBatchSize(totalRecords) {
        if (totalRecords <= 500) {
            return 100;
        } else if (totalRecords <= 2000) {
            return 50;
        } else {
            return 25;
        }
    }

    // Dividir dados em lotes
    createBatches(data) {
        const batchSize = this.determineBatchSize(data.length);
        const batches = [];
        
        for (let i = 0; i < data.length; i += batchSize) {
            batches.push({
                id: Math.floor(i / batchSize) + 1,
                data: data.slice(i, i + batchSize),
                status: 'pending', // pending, processing, success, error
                retryCount: 0,
                error: null
            });
        }
        
        console.log(`📦 Criados ${batches.length} lotes de ${batchSize} registros cada`);
        return batches;
    }

    // Processar dados colados
    async processData(rawData) {
        console.log('📊 Processando dados para importação em massa...');
        
        try {
            // Parse dos dados (reutilizar lógica existente)
            const parsedData = this.parseRawData(rawData);
            
            this.totalRecords = parsedData.leads.length;
            this.bulkData = parsedData;
            
            console.log(`📈 Total de registros: ${this.totalRecords}`);
            
            // Criar lotes
            this.batches = this.createBatches(parsedData.leads);
            
            // Salvar no cache temporário
            this.saveToCache();
            
            return {
                success: true,
                totalRecords: this.totalRecords,
                totalBatches: this.batches.length,
                batchSize: this.determineBatchSize(this.totalRecords),
                duplicatesRemoved: parsedData.duplicatesRemoved.length
            };
            
        } catch (error) {
            console.error('❌ Erro ao processar dados:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Parse dos dados brutos (reutilizar lógica existente)
    parseRawData(rawData) {
        const lines = rawData.trim().split('\n').filter(line => line.trim());
        const leads = [];
        const duplicatesSet = new Set();
        const duplicatesRemoved = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const fields = line.split(/\t+|\s{2,}/).map(field => field.trim());
            
            if (fields.length < 4) {
                console.warn(`Linha ${i + 1} ignorada: poucos campos`);
                continue;
            }

            const [nome, email, telefone, cpf, produto, valor, rua, numero, complemento, bairro, cep, cidade, estado, pais] = fields;
            const cleanCPF = (cpf || '').replace(/[^\d]/g, '');

            if (duplicatesSet.has(cleanCPF)) {
                duplicatesRemoved.push({ nome, cpf: cleanCPF });
                continue;
            }
            duplicatesSet.add(cleanCPF);

            const endereco = this.buildAddressFromFields({
                rua: rua || '',
                numero: numero || '',
                complemento: complemento || '',
                bairro: bairro || '',
                cep: cep || '',
                cidade: cidade || '',
                estado: estado || '',
                pais: pais || 'BR'
            });

            leads.push({
                nome_completo: nome || '',
                email: email || '',
                telefone: telefone || '',
                cpf: cleanCPF,
                produto: produto || 'Kit 12 caixas organizadoras + brinde',
                valor_total: parseFloat(valor) || 67.9,
                endereco: endereco,
                meio_pagamento: 'PIX',
                origem: 'direto',
                etapa_atual: 1,
                status_pagamento: 'pendente',
                order_bumps: [],
                produtos: [{
                    nome: produto || 'Kit 12 caixas organizadoras + brinde',
                    preco: parseFloat(valor) || 67.9
                }],
                lineNumber: i + 1
            });
        }

        return {
            leads,
            duplicatesRemoved
        };
    }

    buildAddressFromFields({ rua, numero, complemento, bairro, cep, cidade, estado, pais }) {
        return `${rua}, ${numero}${complemento ? ` - ${complemento}` : ''} - ${bairro} - ${cidade}/${estado} - CEP: ${cep} - ${pais}`;
    }

    // Salvar no cache temporário
    saveToCache() {
        try {
            const cacheData = {
                batches: this.batches,
                totalRecords: this.totalRecords,
                currentBatchIndex: this.currentBatchIndex,
                processedRecords: this.processedRecords,
                results: this.results,
                timestamp: Date.now()
            };
            
            sessionStorage.setItem('bulk_import_cache', JSON.stringify(cacheData));
            console.log('💾 Dados salvos no cache temporário');
        } catch (error) {
            console.error('❌ Erro ao salvar cache:', error);
        }
    }

    // Carregar do cache temporário
    loadFromCache() {
        try {
            const cached = sessionStorage.getItem('bulk_import_cache');
            if (cached) {
                const cacheData = JSON.parse(cached);
                
                // Verificar se o cache não é muito antigo (1 hora)
                const cacheAge = Date.now() - cacheData.timestamp;
                if (cacheAge < 3600000) { // 1 hora
                    this.batches = cacheData.batches;
                    this.totalRecords = cacheData.totalRecords;
                    this.currentBatchIndex = cacheData.currentBatchIndex;
                    this.processedRecords = cacheData.processedRecords;
                    this.results = cacheData.results;
                    
                    console.log('📖 Dados carregados do cache temporário');
                    return true;
                }
            }
        } catch (error) {
            console.error('❌ Erro ao carregar cache:', error);
        }
        return false;
    }

    // Limpar cache
    clearCache() {
        sessionStorage.removeItem('bulk_import_cache');
        console.log('🧹 Cache temporário limpo');
    }

    // Iniciar importação
    async startImport() {
        if (this.isProcessing) {
            console.warn('⚠️ Importação já em andamento');
            return;
        }

        this.isProcessing = true;
        this.isPaused = false;
        this.startTime = Date.now();
        
        console.log('🚀 Iniciando importação em massa com batching dinâmico');
        
        // Desativar controles
        this.disableControls();
        
        // Mostrar barra de progresso
        this.showProgressBar();
        
        // Processar lotes sequencialmente
        await this.processBatches();
        
        // Finalizar
        this.finishImport();
    }

    // Processar lotes sequencialmente
    async processBatches() {
        while (this.currentBatchIndex < this.batches.length && !this.isPaused) {
            const batch = this.batches[this.currentBatchIndex];
            
            console.log(`📦 Processando lote ${batch.id}/${this.batches.length}`);
            
            // Atualizar UI
            this.updateProgressBar();
            
            // Processar lote com retry
            const success = await this.processBatchWithRetry(batch);
            
            if (success) {
                batch.status = 'success';
                this.processedRecords += batch.data.length;
                this.successfulRecords += batch.data.length;
            } else {
                batch.status = 'error';
                this.failedRecords += batch.data.length;
            }
            
            // Salvar progresso
            this.saveToCache();
            
            // Próximo lote
            this.currentBatchIndex++;
            
            // Pequeno delay entre lotes para não sobrecarregar
            if (this.currentBatchIndex < this.batches.length) {
                await this.delay(500);
            }
        }
    }

    // Processar lote com retry automático
    async processBatchWithRetry(batch) {
        let attempt = 0;
        
        while (attempt <= this.maxRetries) {
            try {
                batch.status = 'processing';
                this.updateProgressBar();
                
                console.log(`📤 Enviando lote ${batch.id}, tentativa ${attempt + 1}`);
                
                // Simular processamento (substituir pela lógica real de salvamento)
                const result = await this.saveBatchToDatabase(batch.data);
                
                if (result.success) {
                    console.log(`✅ Lote ${batch.id} processado com sucesso`);
                    this.results.success.push(...result.success);
                    return true;
                }
                
                throw new Error(result.error || 'Erro desconhecido');
                
            } catch (error) {
                console.error(`❌ Erro no lote ${batch.id}, tentativa ${attempt + 1}:`, error);
                
                batch.error = error.message;
                attempt++;
                
                if (attempt <= this.maxRetries) {
                    const delay = this.backoffDelays[attempt - 1] || 6000;
                    console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
                    await this.delay(delay);
                } else {
                    console.error(`💥 Lote ${batch.id} falhou após ${this.maxRetries} tentativas`);
                    this.results.errors.push({
                        batch: batch.id,
                        error: error.message,
                        records: batch.data.length
                    });
                    return false;
                }
            }
        }
        
        return false;
    }

    // Salvar lote no banco de dados (localStorage para este exemplo)
    async saveBatchToDatabase(batchData) {
        try {
            // Simular delay de rede
            await this.delay(Math.random() * 1000 + 500);
            
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const successfulSaves = [];
            const errors = [];
            
            for (const lead of batchData) {
                try {
                    // Verificar duplicatas
                    const existingLead = leads.find(l => l.cpf === lead.cpf);
                    if (existingLead) {
                        errors.push({
                            nome: lead.nome_completo,
                            cpf: lead.cpf,
                            error: 'CPF já existe no sistema'
                        });
                        continue;
                    }
                    
                    // Adicionar timestamps
                    lead.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                    lead.created_at = new Date().toISOString();
                    lead.updated_at = new Date().toISOString();
                    
                    leads.push(lead);
                    successfulSaves.push({
                        nome: lead.nome_completo,
                        cpf: lead.cpf,
                        id: lead.id
                    });
                    
                } catch (error) {
                    errors.push({
                        nome: lead.nome_completo,
                        cpf: lead.cpf,
                        error: error.message
                    });
                }
            }
            
            // Salvar no localStorage
            localStorage.setItem('leads', JSON.stringify(leads));
            
            return {
                success: true,
                success: successfulSaves,
                errors: errors
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Mostrar barra de progresso
    showProgressBar() {
        const container = document.getElementById('bulkResultsContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="import-progress-container" style="
                background: #f8f9fa;
                border: 2px solid #345C7A;
                border-radius: 12px;
                padding: 25px;
                margin-bottom: 20px;
            ">
                <div class="progress-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                ">
                    <h4 style="color: #345C7A; margin: 0;">
                        <i class="fas fa-upload"></i> Importação em Massa
                    </h4>
                    <div class="progress-controls">
                        <button id="pauseResumeBtn" class="control-button" style="margin-right: 10px;">
                            <i class="fas fa-pause"></i> Pausar
                        </button>
                        <button id="cancelImportBtn" class="control-button danger">
                            <i class="fas fa-stop"></i> Cancelar
                        </button>
                    </div>
                </div>
                
                <div class="progress-info" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                ">
                    <div class="progress-stat">
                        <div style="font-size: 0.9rem; color: #666;">Lote Atual</div>
                        <div id="currentBatch" style="font-size: 1.2rem; font-weight: 600; color: #345C7A;">
                            1/${this.batches.length}
                        </div>
                    </div>
                    <div class="progress-stat">
                        <div style="font-size: 0.9rem; color: #666;">Registros</div>
                        <div id="recordsProgress" style="font-size: 1.2rem; font-weight: 600; color: #345C7A;">
                            0/${this.totalRecords}
                        </div>
                    </div>
                    <div class="progress-stat">
                        <div style="font-size: 0.9rem; color: #666;">Sucessos</div>
                        <div id="successCount" style="font-size: 1.2rem; font-weight: 600; color: #27ae60;">
                            0
                        </div>
                    </div>
                    <div class="progress-stat">
                        <div style="font-size: 0.9rem; color: #666;">Erros</div>
                        <div id="errorCount" style="font-size: 1.2rem; font-weight: 600; color: #e74c3c;">
                            0
                        </div>
                    </div>
                    <div class="progress-stat">
                        <div style="font-size: 0.9rem; color: #666;">Tempo Restante</div>
                        <div id="timeRemaining" style="font-size: 1.2rem; font-weight: 600; color: #f39c12;">
                            Calculando...
                        </div>
                    </div>
                </div>
                
                <div class="progress-bar-container" style="
                    background: #e9ecef;
                    border-radius: 10px;
                    height: 20px;
                    overflow: hidden;
                    margin-bottom: 15px;
                ">
                    <div id="progressBar" style="
                        background: linear-gradient(45deg, #345C7A, #2c4a63);
                        height: 100%;
                        width: 0%;
                        transition: width 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 0.8rem;
                        font-weight: 600;
                    ">
                        0%
                    </div>
                </div>
                
                <div id="currentBatchInfo" style="
                    font-size: 0.9rem;
                    color: #666;
                    text-align: center;
                ">
                    Preparando importação...
                </div>
            </div>
            
            <div id="batchErrors" style="display: none;">
                <!-- Erros de lotes serão exibidos aqui -->
            </div>
        `;
        
        // Configurar eventos dos botões
        this.setupProgressControls();
        
        // Mostrar seção de resultados
        const resultsSection = document.getElementById('bulkResultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
    }

    // Configurar controles de progresso
    setupProgressControls() {
        const pauseResumeBtn = document.getElementById('pauseResumeBtn');
        const cancelImportBtn = document.getElementById('cancelImportBtn');
        
        if (pauseResumeBtn) {
            pauseResumeBtn.addEventListener('click', () => {
                this.togglePause();
            });
        }
        
        if (cancelImportBtn) {
            cancelImportBtn.addEventListener('click', () => {
                this.cancelImport();
            });
        }
    }

    // Atualizar barra de progresso
    updateProgressBar() {
        const currentBatch = document.getElementById('currentBatch');
        const recordsProgress = document.getElementById('recordsProgress');
        const successCount = document.getElementById('successCount');
        const errorCount = document.getElementById('errorCount');
        const timeRemaining = document.getElementById('timeRemaining');
        const progressBar = document.getElementById('progressBar');
        const currentBatchInfo = document.getElementById('currentBatchInfo');
        
        if (!currentBatch) return;
        
        // Atualizar estatísticas
        currentBatch.textContent = `${this.currentBatchIndex + 1}/${this.batches.length}`;
        recordsProgress.textContent = `${this.processedRecords}/${this.totalRecords}`;
        successCount.textContent = this.successfulRecords;
        errorCount.textContent = this.failedRecords;
        
        // Calcular progresso
        const progress = (this.processedRecords / this.totalRecords) * 100;
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${Math.round(progress)}%`;
        
        // Calcular tempo restante
        if (this.startTime && this.processedRecords > 0) {
            const elapsed = Date.now() - this.startTime;
            const rate = this.processedRecords / elapsed; // registros por ms
            const remaining = this.totalRecords - this.processedRecords;
            const estimatedTime = remaining / rate;
            
            timeRemaining.textContent = this.formatTime(estimatedTime);
        }
        
        // Atualizar info do lote atual
        if (this.currentBatchIndex < this.batches.length) {
            const currentBatchData = this.batches[this.currentBatchIndex];
            const status = currentBatchData.status === 'processing' ? 'Processando' : 'Aguardando';
            currentBatchInfo.textContent = `${status} lote ${currentBatchData.id} (${currentBatchData.data.length} registros)`;
        }
    }

    // Formatar tempo em formato legível
    formatTime(milliseconds) {
        const seconds = Math.ceil(milliseconds / 1000);
        
        if (seconds < 60) {
            return `~${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.ceil(seconds / 60);
            return `~${minutes}min`;
        } else {
            const hours = Math.ceil(seconds / 3600);
            return `~${hours}h`;
        }
    }

    // Pausar/Retomar importação
    togglePause() {
        const pauseResumeBtn = document.getElementById('pauseResumeBtn');
        if (!pauseResumeBtn) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            pauseResumeBtn.innerHTML = '<i class="fas fa-play"></i> Retomar';
            console.log('⏸️ Importação pausada');
        } else {
            pauseResumeBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
            console.log('▶️ Importação retomada');
            // Continuar processamento
            this.processBatches();
        }
    }

    // Cancelar importação
    cancelImport() {
        if (confirm('Tem certeza que deseja cancelar a importação? O progresso será perdido.')) {
            this.isPaused = true;
            this.isProcessing = false;
            this.clearCache();
            this.enableControls();
            
            console.log('🛑 Importação cancelada pelo usuário');
            
            // Mostrar resultados parciais
            this.showPartialResults();
        }
    }

    // Finalizar importação
    finishImport() {
        this.isProcessing = false;
        this.isPaused = false;
        
        const endTime = Date.now();
        const totalTime = endTime - this.startTime;
        
        console.log(`🏁 Importação finalizada em ${this.formatTime(totalTime)}`);
        console.log(`📊 Resultados: ${this.successfulRecords} sucessos, ${this.failedRecords} erros`);
        
        // Limpar cache
        this.clearCache();
        
        // Reativar controles
        this.enableControls();
        
        // Mostrar resultados finais
        this.showFinalResults();
    }

    // Mostrar resultados finais
    showFinalResults() {
        const container = document.getElementById('bulkResultsContainer');
        if (!container) return;
        
        const successRate = (this.successfulRecords / this.totalRecords) * 100;
        const totalTime = this.formatTime(Date.now() - this.startTime);
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px;">
                    <h4 style="color: #155724; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-check-circle"></i>
                        Registros Importados com Sucesso (${this.successfulRecords})
                    </h4>
                    ${this.results.success.length > 0 ? `
                        <ul style="margin: 0; padding-left: 20px; max-height: 200px; overflow-y: auto;">
                            ${this.results.success.slice(0, 10).map(record => `
                                <li style="margin-bottom: 5px; color: #155724;">
                                    <strong>${record.nome}</strong> - CPF: ${this.formatCPF(record.cpf)}
                                </li>
                            `).join('')}
                            ${this.results.success.length > 10 ? `
                                <li style="color: #666; font-style: italic;">
                                    ... e mais ${this.results.success.length - 10} registros
                                </li>
                            ` : ''}
                        </ul>
                    ` : '<p style="color: #856404; font-style: italic;">Nenhum registro foi importado com sucesso.</p>'}
                </div>
                
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px;">
                    <h4 style="color: #721c24; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Registros com Erro (${this.failedRecords})
                    </h4>
                    ${this.results.errors.length > 0 ? `
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${this.results.errors.map(error => `
                                <div style="margin-bottom: 10px; padding: 8px; background: #fdf2f2; border-radius: 4px;">
                                    <strong>Lote ${error.batch}:</strong> ${error.error}
                                    <br><small>${error.records} registros afetados</small>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p style="color: #155724; font-style: italic;">Nenhum erro encontrado! 🎉</p>'}
                </div>
            </div>
            
            <div style="background: #e2e3e5; border: 1px solid #d6d8db; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <h4 style="color: #383d41; margin-bottom: 15px;">📊 Resumo da Importação</h4>
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <strong style="color: #28a745; font-size: 1.5rem;">${this.successfulRecords}</strong>
                        <div style="color: #6c757d;">Sucessos</div>
                    </div>
                    <div>
                        <strong style="color: #dc3545; font-size: 1.5rem;">${this.failedRecords}</strong>
                        <div style="color: #6c757d;">Erros</div>
                    </div>
                    <div>
                        <strong style="color: #007bff; font-size: 1.5rem;">${this.totalRecords}</strong>
                        <div style="color: #6c757d;">Total</div>
                    </div>
                    <div>
                        <strong style="color: #28a745; font-size: 1.5rem;">${Math.round(successRate)}%</strong>
                        <div style="color: #6c757d;">Taxa de Sucesso</div>
                    </div>
                </div>
                <div style="color: #666; font-size: 0.9rem;">
                    ⏱️ Tempo total: ${totalTime} | 
                    📦 ${this.batches.length} lotes processados |
                    🚀 ${Math.round(this.totalRecords / ((Date.now() - this.startTime) / 1000))} registros/segundo
                </div>
            </div>
            
            <div style="text-align: center;">
                <button id="goToLeadsListButton" style="
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    margin-right: 10px;
                ">
                    <i class="fas fa-list"></i> Ir para Lista
                </button>
                
                ${this.failedRecords > 0 ? `
                    <button id="exportFailedButton" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                    ">
                        <i class="fas fa-download"></i> Exportar Erros
                    </button>
                ` : ''}
            </div>
        `;
        
        // Configurar eventos dos botões
        this.setupResultButtons();
    }

    // Mostrar resultados parciais (quando cancelado)
    showPartialResults() {
        const container = document.getElementById('bulkResultsContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h4 style="color: #856404; margin-bottom: 15px;">
                    <i class="fas fa-exclamation-triangle"></i> Importação Cancelada
                </h4>
                <p style="color: #856404; margin-bottom: 15px;">
                    A importação foi cancelada. Resultados parciais:
                </p>
                <div style="display: flex; justify-content: space-around; gap: 15px;">
                    <div>
                        <strong style="color: #28a745;">${this.successfulRecords}</strong>
                        <div style="color: #666;">Sucessos</div>
                    </div>
                    <div>
                        <strong style="color: #dc3545;">${this.failedRecords}</strong>
                        <div style="color: #666;">Erros</div>
                    </div>
                    <div>
                        <strong style="color: #6c757d;">${this.processedRecords}</strong>
                        <div style="color: #666;">Processados</div>
                    </div>
                    <div>
                        <strong style="color: #ffc107;">${this.totalRecords - this.processedRecords}</strong>
                        <div style="color: #666;">Pendentes</div>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <button id="resumeImportButton" style="
                    background: #ffc107;
                    color: #212529;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                    margin-right: 10px;
                ">
                    <i class="fas fa-play"></i> Retomar Importação
                </button>
                
                <button id="exportPendingButton" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                ">
                    <i class="fas fa-download"></i> Exportar Pendentes
                </button>
            </div>
        `;
        
        // Configurar eventos
        const resumeBtn = document.getElementById('resumeImportButton');
        const exportBtn = document.getElementById('exportPendingButton');
        
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.resumeImport();
            });
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportPendingRecords();
            });
        }
    }

    // Configurar botões de resultado
    setupResultButtons() {
        const goToListBtn = document.getElementById('goToLeadsListButton');
        const exportFailedBtn = document.getElementById('exportFailedButton');
        
        if (goToListBtn) {
            goToListBtn.addEventListener('click', () => {
                // Ir para lista de leads (assumindo que existe uma função global)
                if (window.adminPanel) {
                    window.adminPanel.showView('leadsView');
                    window.adminPanel.refreshLeads();
                }
            });
        }
        
        if (exportFailedBtn) {
            exportFailedBtn.addEventListener('click', () => {
                this.exportFailedRecords();
            });
        }
    }

    // Retomar importação
    resumeImport() {
        this.isPaused = false;
        this.isProcessing = true;
        
        console.log('▶️ Retomando importação...');
        
        // Mostrar barra de progresso novamente
        this.showProgressBar();
        this.updateProgressBar();
        
        // Continuar processamento
        this.processBatches();
    }

    // Exportar registros com falha
    exportFailedRecords() {
        const failedBatches = this.batches.filter(batch => batch.status === 'error');
        const failedData = failedBatches.flatMap(batch => batch.data);
        
        this.exportToCSV(failedData, 'registros_com_erro.csv');
    }

    // Exportar registros pendentes
    exportPendingRecords() {
        const pendingBatches = this.batches.slice(this.currentBatchIndex);
        const pendingData = pendingBatches.flatMap(batch => batch.data);
        
        this.exportToCSV(pendingData, 'registros_pendentes.csv');
    }

    // Exportar dados para CSV
    exportToCSV(data, filename) {
        const headers = ['Nome', 'Email', 'Telefone', 'CPF', 'Produto', 'Valor', 'Endereço'];
        const csvContent = [
            headers.join(','),
            ...data.map(record => [
                `"${record.nome_completo}"`,
                `"${record.email}"`,
                `"${record.telefone}"`,
                `"${record.cpf}"`,
                `"${record.produto}"`,
                record.valor_total,
                `"${record.endereco}"`
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`📁 Arquivo ${filename} exportado`);
    }

    // Desativar controles durante importação
    disableControls() {
        const controls = document.querySelectorAll('.control-button, .nav-button, .mass-action-button');
        controls.forEach(control => {
            if (!control.id.includes('pause') && !control.id.includes('cancel')) {
                control.disabled = true;
                control.style.opacity = '0.5';
                control.style.cursor = 'not-allowed';
            }
        });
        
        // Mostrar overlay de importação
        const importingOverlay = document.getElementById('importingOverlay');
        if (importingOverlay) {
            importingOverlay.style.display = 'flex';
        }
        
        console.log('🔒 Controles desativados durante importação');
    }

    // Reativar controles
    enableControls() {
        const controls = document.querySelectorAll('.control-button, .nav-button, .mass-action-button');
        controls.forEach(control => {
            control.disabled = false;
            control.style.opacity = '1';
            control.style.cursor = 'pointer';
        });
        
        // Ocultar overlay de importação
        const importingOverlay = document.getElementById('importingOverlay');
        if (importingOverlay) {
            importingOverlay.style.display = 'none';
        }
        
        console.log('🔓 Controles reativados');
    }

    // Formatar CPF
    formatCPF(cpf) {
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    // Delay helper
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Verificar se há importação pendente no cache
    hasPendingImport() {
        return this.loadFromCache() && this.currentBatchIndex < this.batches.length;
    }

    // Obter estatísticas da importação
    getStats() {
        return {
            totalRecords: this.totalRecords,
            processedRecords: this.processedRecords,
            successfulRecords: this.successfulRecords,
            failedRecords: this.failedRecords,
            totalBatches: this.batches.length,
            currentBatch: this.currentBatchIndex + 1,
            isProcessing: this.isProcessing,
            isPaused: this.isPaused,
            successRate: this.totalRecords > 0 ? (this.successfulRecords / this.totalRecords) * 100 : 0
        };
    }

    // Reset completo do sistema
    reset() {
        this.bulkData = [];
        this.batches = [];
        this.currentBatchIndex = 0;
        this.totalRecords = 0;
        this.processedRecords = 0;
        this.successfulRecords = 0;
        this.failedRecords = 0;
        this.isProcessing = false;
        this.isPaused = false;
        this.retryAttempts = {};
        this.startTime = null;
        this.results = {
            success: [],
            errors: [],
            total: 0
        };
        
        this.clearCache();
        this.enableControls();
        
        console.log('🔄 Sistema de importação resetado');
    }
}