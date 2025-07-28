import"./modulepreload-polyfill-B5Qt9EMX.js";import{C as L}from"./cpf-validator-B4PsRAE6.js";import{D as k}from"./database-CTJo1PQf.js";class P{constructor(){this.bulkData=[],this.batches=[],this.currentBatchIndex=0,this.totalRecords=0,this.processedRecords=0,this.successfulRecords=0,this.failedRecords=0,this.isProcessing=!1,this.isPaused=!1,this.retryAttempts={},this.maxRetries=3,this.backoffDelays=[2e3,4e3,6e3],this.startTime=null,this.results={success:[],errors:[],total:0},console.log("🚀 Enhanced Bulk Import System inicializado")}determineBatchSize(e){return e<=500?100:e<=2e3?50:25}createBatches(e){const t=this.determineBatchSize(e.length),s=[];for(let o=0;o<e.length;o+=t)s.push({id:Math.floor(o/t)+1,data:e.slice(o,o+t),status:"pending",retryCount:0,error:null});return console.log(`📦 Criados ${s.length} lotes de ${t} registros cada`),s}async processData(e){console.log("📊 Processando dados para importação em massa...");try{const t=this.parseRawData(e);return this.totalRecords=t.leads.length,this.bulkData=t,console.log(`📈 Total de registros: ${this.totalRecords}`),this.batches=this.createBatches(t.leads),this.saveToCache(),{success:!0,totalRecords:this.totalRecords,totalBatches:this.batches.length,batchSize:this.determineBatchSize(this.totalRecords),duplicatesRemoved:t.duplicatesRemoved.length}}catch(t){return console.error("❌ Erro ao processar dados:",t),{success:!1,error:t.message}}}parseRawData(e){const t=e.trim().split(`
`).filter(i=>i.trim()),s=[],o=new Set,a=[];for(let i=0;i<t.length;i++){const r=t[i].trim();if(!r)continue;const n=r.split(/\t+|\s{2,}/).map(w=>w.trim());if(n.length<4){console.warn(`Linha ${i+1} ignorada: poucos campos`);continue}const[d,l,c,m,h,p,g,f,y,v,b,x,B,E]=n,u=(m||"").replace(/[^\d]/g,"");if(o.has(u)){a.push({nome:d,cpf:u});continue}o.add(u);const I=this.buildAddressFromFields({rua:g||"",numero:f||"",complemento:y||"",bairro:v||"",cep:b||"",cidade:x||"",estado:B||"",pais:E||"BR"});s.push({nome_completo:d||"",email:l||"",telefone:c||"",cpf:u,produto:h||"Kit 12 caixas organizadoras + brinde",valor_total:parseFloat(p)||67.9,endereco:I,meio_pagamento:"PIX",origem:"direto",etapa_atual:1,status_pagamento:"pendente",order_bumps:[],produtos:[{nome:h||"Kit 12 caixas organizadoras + brinde",preco:parseFloat(p)||67.9}],lineNumber:i+1})}return{leads:s,duplicatesRemoved:a}}buildAddressFromFields({rua:e,numero:t,complemento:s,bairro:o,cep:a,cidade:i,estado:r,pais:n}){return`${e}, ${t}${s?` - ${s}`:""} - ${o} - ${i}/${r} - CEP: ${a} - ${n}`}saveToCache(){try{const e={batches:this.batches,totalRecords:this.totalRecords,currentBatchIndex:this.currentBatchIndex,processedRecords:this.processedRecords,results:this.results,timestamp:Date.now()};sessionStorage.setItem("bulk_import_cache",JSON.stringify(e)),console.log("💾 Dados salvos no cache temporário")}catch(e){console.error("❌ Erro ao salvar cache:",e)}}loadFromCache(){try{const e=sessionStorage.getItem("bulk_import_cache");if(e){const t=JSON.parse(e);if(Date.now()-t.timestamp<36e5)return this.batches=t.batches,this.totalRecords=t.totalRecords,this.currentBatchIndex=t.currentBatchIndex,this.processedRecords=t.processedRecords,this.results=t.results,console.log("📖 Dados carregados do cache temporário"),!0}}catch(e){console.error("❌ Erro ao carregar cache:",e)}return!1}clearCache(){sessionStorage.removeItem("bulk_import_cache"),console.log("🧹 Cache temporário limpo")}async startImport(){if(this.isProcessing){console.warn("⚠️ Importação já em andamento");return}this.isProcessing=!0,this.isPaused=!1,this.startTime=Date.now(),console.log("🚀 Iniciando importação em massa com batching dinâmico"),this.disableControls(),this.showProgressBar(),await this.processBatches(),this.finishImport()}async processBatches(){for(;this.currentBatchIndex<this.batches.length&&!this.isPaused;){const e=this.batches[this.currentBatchIndex];console.log(`📦 Processando lote ${e.id}/${this.batches.length}`),this.updateProgressBar(),await this.processBatchWithRetry(e)?(e.status="success",this.processedRecords+=e.data.length,this.successfulRecords+=e.data.length):(e.status="error",this.failedRecords+=e.data.length),this.saveToCache(),this.currentBatchIndex++,this.currentBatchIndex<this.batches.length&&await this.delay(500)}}async processBatchWithRetry(e){let t=0;for(;t<=this.maxRetries;)try{e.status="processing",this.updateProgressBar(),console.log(`📤 Enviando lote ${e.id}, tentativa ${t+1}`);const s=await this.saveBatchToDatabase(e.data);if(s.success)return console.log(`✅ Lote ${e.id} processado com sucesso`),this.results.success.push(...s.success),!0;throw new Error(s.error||"Erro desconhecido")}catch(s){if(console.error(`❌ Erro no lote ${e.id}, tentativa ${t+1}:`,s),e.error=s.message,t++,t<=this.maxRetries){const o=this.backoffDelays[t-1]||6e3;console.log(`⏳ Aguardando ${o}ms antes da próxima tentativa...`),await this.delay(o)}else return console.error(`💥 Lote ${e.id} falhou após ${this.maxRetries} tentativas`),this.results.errors.push({batch:e.id,error:s.message,records:e.data.length}),!1}return!1}async saveBatchToDatabase(e){try{await this.delay(Math.random()*1e3+500);const t=JSON.parse(localStorage.getItem("leads")||"[]"),s=[],o=[];for(const a of e)try{if(t.find(r=>r.cpf===a.cpf)){o.push({nome:a.nome_completo,cpf:a.cpf,error:"CPF já existe no sistema"});continue}a.id=Date.now().toString()+Math.random().toString(36).substr(2,9),a.created_at=new Date().toISOString(),a.updated_at=new Date().toISOString(),t.push(a),s.push({nome:a.nome_completo,cpf:a.cpf,id:a.id})}catch(i){o.push({nome:a.nome_completo,cpf:a.cpf,error:i.message})}return localStorage.setItem("leads",JSON.stringify(t)),{success:!0,success:s,errors:o}}catch(t){return{success:!1,error:t.message}}}showProgressBar(){const e=document.getElementById("bulkResultsContainer");if(!e)return;e.innerHTML=`
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
        `,this.setupProgressControls();const t=document.getElementById("bulkResultsSection");t&&(t.style.display="block")}setupProgressControls(){const e=document.getElementById("pauseResumeBtn"),t=document.getElementById("cancelImportBtn");e&&e.addEventListener("click",()=>{this.togglePause()}),t&&t.addEventListener("click",()=>{this.cancelImport()})}updateProgressBar(){const e=document.getElementById("currentBatch"),t=document.getElementById("recordsProgress"),s=document.getElementById("successCount"),o=document.getElementById("errorCount"),a=document.getElementById("timeRemaining"),i=document.getElementById("progressBar"),r=document.getElementById("currentBatchInfo");if(!e)return;e.textContent=`${this.currentBatchIndex+1}/${this.batches.length}`,t.textContent=`${this.processedRecords}/${this.totalRecords}`,s.textContent=this.successfulRecords,o.textContent=this.failedRecords;const n=this.processedRecords/this.totalRecords*100;if(i.style.width=`${n}%`,i.textContent=`${Math.round(n)}%`,this.startTime&&this.processedRecords>0){const d=Date.now()-this.startTime,l=this.processedRecords/d,m=(this.totalRecords-this.processedRecords)/l;a.textContent=this.formatTime(m)}if(this.currentBatchIndex<this.batches.length){const d=this.batches[this.currentBatchIndex],l=d.status==="processing"?"Processando":"Aguardando";r.textContent=`${l} lote ${d.id} (${d.data.length} registros)`}}formatTime(e){const t=Math.ceil(e/1e3);return t<60?`~${t}s`:t<3600?`~${Math.ceil(t/60)}min`:`~${Math.ceil(t/3600)}h`}togglePause(){const e=document.getElementById("pauseResumeBtn");e&&(this.isPaused=!this.isPaused,this.isPaused?(e.innerHTML='<i class="fas fa-play"></i> Retomar',console.log("⏸️ Importação pausada")):(e.innerHTML='<i class="fas fa-pause"></i> Pausar',console.log("▶️ Importação retomada"),this.processBatches()))}cancelImport(){confirm("Tem certeza que deseja cancelar a importação? O progresso será perdido.")&&(this.isPaused=!0,this.isProcessing=!1,this.clearCache(),this.enableControls(),console.log("🛑 Importação cancelada pelo usuário"),this.showPartialResults())}finishImport(){this.isProcessing=!1,this.isPaused=!1;const t=Date.now()-this.startTime;console.log(`🏁 Importação finalizada em ${this.formatTime(t)}`),console.log(`📊 Resultados: ${this.successfulRecords} sucessos, ${this.failedRecords} erros`),this.clearCache(),this.enableControls(),this.showFinalResults()}showFinalResults(){const e=document.getElementById("bulkResultsContainer");if(!e)return;const t=this.successfulRecords/this.totalRecords*100,s=this.formatTime(Date.now()-this.startTime);e.innerHTML=`
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px;">
                    <h4 style="color: #155724; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-check-circle"></i>
                        Registros Importados com Sucesso (${this.successfulRecords})
                    </h4>
                    ${this.results.success.length>0?`
                        <ul style="margin: 0; padding-left: 20px; max-height: 200px; overflow-y: auto;">
                            ${this.results.success.slice(0,10).map(o=>`
                                <li style="margin-bottom: 5px; color: #155724;">
                                    <strong>${o.nome}</strong> - CPF: ${this.formatCPF(o.cpf)}
                                </li>
                            `).join("")}
                            ${this.results.success.length>10?`
                                <li style="color: #666; font-style: italic;">
                                    ... e mais ${this.results.success.length-10} registros
                                </li>
                            `:""}
                        </ul>
                    `:'<p style="color: #856404; font-style: italic;">Nenhum registro foi importado com sucesso.</p>'}
                </div>
                
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px;">
                    <h4 style="color: #721c24; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Registros com Erro (${this.failedRecords})
                    </h4>
                    ${this.results.errors.length>0?`
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${this.results.errors.map(o=>`
                                <div style="margin-bottom: 10px; padding: 8px; background: #fdf2f2; border-radius: 4px;">
                                    <strong>Lote ${o.batch}:</strong> ${o.error}
                                    <br><small>${o.records} registros afetados</small>
                                </div>
                            `).join("")}
                        </div>
                    `:'<p style="color: #155724; font-style: italic;">Nenhum erro encontrado! 🎉</p>'}
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
                        <strong style="color: #28a745; font-size: 1.5rem;">${Math.round(t)}%</strong>
                        <div style="color: #6c757d;">Taxa de Sucesso</div>
                    </div>
                </div>
                <div style="color: #666; font-size: 0.9rem;">
                    ⏱️ Tempo total: ${s} | 
                    📦 ${this.batches.length} lotes processados |
                    🚀 ${Math.round(this.totalRecords/((Date.now()-this.startTime)/1e3))} registros/segundo
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
                
                ${this.failedRecords>0?`
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
                `:""}
            </div>
        `,this.setupResultButtons()}showPartialResults(){const e=document.getElementById("bulkResultsContainer");if(!e)return;e.innerHTML=`
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
                        <strong style="color: #ffc107;">${this.totalRecords-this.processedRecords}</strong>
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
        `;const t=document.getElementById("resumeImportButton"),s=document.getElementById("exportPendingButton");t&&t.addEventListener("click",()=>{this.resumeImport()}),s&&s.addEventListener("click",()=>{this.exportPendingRecords()})}setupResultButtons(){const e=document.getElementById("goToLeadsListButton"),t=document.getElementById("exportFailedButton");e&&e.addEventListener("click",()=>{window.adminPanel&&(window.adminPanel.showView("leadsView"),window.adminPanel.refreshLeads())}),t&&t.addEventListener("click",()=>{this.exportFailedRecords()})}resumeImport(){this.isPaused=!1,this.isProcessing=!0,console.log("▶️ Retomando importação..."),this.showProgressBar(),this.updateProgressBar(),this.processBatches()}exportFailedRecords(){const t=this.batches.filter(s=>s.status==="error").flatMap(s=>s.data);this.exportToCSV(t,"registros_com_erro.csv")}exportPendingRecords(){const t=this.batches.slice(this.currentBatchIndex).flatMap(s=>s.data);this.exportToCSV(t,"registros_pendentes.csv")}exportToCSV(e,t){const o=[["Nome","Email","Telefone","CPF","Produto","Valor","Endereço"].join(","),...e.map(n=>[`"${n.nome_completo}"`,`"${n.email}"`,`"${n.telefone}"`,`"${n.cpf}"`,`"${n.produto}"`,n.valor_total,`"${n.endereco}"`].join(","))].join(`
`),a=new Blob([o],{type:"text/csv;charset=utf-8;"}),i=document.createElement("a"),r=URL.createObjectURL(a);i.setAttribute("href",r),i.setAttribute("download",t),i.style.visibility="hidden",document.body.appendChild(i),i.click(),document.body.removeChild(i),console.log(`📁 Arquivo ${t} exportado`)}disableControls(){document.querySelectorAll(".control-button, .nav-button, .mass-action-button").forEach(s=>{!s.id.includes("pause")&&!s.id.includes("cancel")&&(s.disabled=!0,s.style.opacity="0.5",s.style.cursor="not-allowed")});const t=document.getElementById("importingOverlay");t&&(t.style.display="flex"),console.log("🔒 Controles desativados durante importação")}enableControls(){document.querySelectorAll(".control-button, .nav-button, .mass-action-button").forEach(s=>{s.disabled=!1,s.style.opacity="1",s.style.cursor="pointer"});const t=document.getElementById("importingOverlay");t&&(t.style.display="none"),console.log("🔓 Controles reativados")}formatCPF(e){return e.replace(/[^\d]/g,"").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,"$1.$2.$3-$4")}delay(e){return new Promise(t=>setTimeout(t,e))}hasPendingImport(){return this.loadFromCache()&&this.currentBatchIndex<this.batches.length}getStats(){return{totalRecords:this.totalRecords,processedRecords:this.processedRecords,successfulRecords:this.successfulRecords,failedRecords:this.failedRecords,totalBatches:this.batches.length,currentBatch:this.currentBatchIndex+1,isProcessing:this.isProcessing,isPaused:this.isPaused,successRate:this.totalRecords>0?this.successfulRecords/this.totalRecords*100:0}}reset(){this.bulkData=[],this.batches=[],this.currentBatchIndex=0,this.totalRecords=0,this.processedRecords=0,this.successfulRecords=0,this.failedRecords=0,this.isProcessing=!1,this.isPaused=!1,this.retryAttempts={},this.startTime=null,this.results={success:[],errors:[],total:0},this.clearCache(),this.enableControls(),console.log("🔄 Sistema de importação resetado")}}class R{constructor(){this.dbService=new k,this.leads=[],this.filteredLeads=[],this.selectedLeads=new Set,this.currentPage=1,this.leadsPerPage=20,this.isLoggedIn=!1,this.systemMode="auto",this.bulkData=[],this.bulkResults=null,this.editingLead=null,this.enhancedBulkImport=new P,console.log("🔧 AdminPanel inicializado - Modo Local"),this.init()}async init(){console.log("🚀 Inicializando painel administrativo...");try{this.setupEventListeners(),this.checkLoginStatus(),this.isLoggedIn&&(this.loadLeads(),this.renderLeadsTable(),this.updateLeadsCount()),console.log("✅ Painel administrativo inicializado com sucesso")}catch(e){console.error("❌ Erro na inicialização do painel:",e)}}setupEventListeners(){const e=document.getElementById("loginForm");e&&e.addEventListener("submit",u=>this.handleLogin(u));const t=document.getElementById("logoutButton");t&&t.addEventListener("click",()=>this.handleLogout());const s=document.getElementById("showLeadsView");s&&s.addEventListener("click",()=>this.showView("leadsView"));const o=document.getElementById("showAddLeadView");o&&o.addEventListener("click",()=>this.showView("addLeadView"));const a=document.getElementById("showBulkAddView");a&&a.addEventListener("click",()=>this.showView("bulkAddView"));const i=document.getElementById("addLeadForm");i&&i.addEventListener("submit",u=>this.handleAddLead(u));const r=document.getElementById("previewBulkDataButton");r&&r.addEventListener("click",()=>this.previewBulkDataEnhanced());const n=document.getElementById("clearBulkDataButton");n&&n.addEventListener("click",()=>this.clearBulkDataEnhanced());const d=document.getElementById("confirmBulkImportButton");d&&d.addEventListener("click",()=>this.confirmBulkImportEnhanced());const l=document.getElementById("editBulkDataButton");l&&l.addEventListener("click",()=>this.editBulkDataEnhanced());let c=document.getElementById("refreshButton");c&&c.addEventListener("click",()=>this.refreshLeads());const m=document.getElementById("applyFiltersButton");m&&m.addEventListener("click",()=>this.applyFilters());const h=document.getElementById("massNextStage");h&&h.addEventListener("click",()=>this.handleMassAction("nextStage"));const p=document.getElementById("massPrevStage");p&&p.addEventListener("click",()=>this.handleMassAction("prevStage"));const g=document.getElementById("massSetStage");g&&g.addEventListener("click",()=>this.handleMassAction("setStage"));const f=document.getElementById("massDeleteLeads");f&&f.addEventListener("click",()=>this.handleMassAction("delete"));const y=document.getElementById("nextAllButton");y&&y.addEventListener("click",()=>this.handleSystemAction("nextAll"));const v=document.getElementById("prevAllButton");v&&v.addEventListener("click",()=>this.handleSystemAction("prevAll")),c=document.getElementById("refreshButton"),c&&c.addEventListener("click",()=>this.handleSystemAction("refresh"));const b=document.getElementById("clearAllButton");b&&b.addEventListener("click",()=>this.handleSystemAction("clearAll"));const x=document.getElementById("closeEditModal");x&&x.addEventListener("click",()=>this.closeEditModal());const B=document.getElementById("cancelEdit");B&&B.addEventListener("click",()=>this.closeEditModal());const E=document.getElementById("editForm");E&&E.addEventListener("submit",u=>this.handleEditSubmit(u))}checkLoginStatus(){localStorage.getItem("admin_logged_in")==="true"?(this.isLoggedIn=!0,this.showAdminPanel()):this.showLoginScreen()}handleLogin(e){e.preventDefault(),this.isLoggedIn=!0,localStorage.setItem("admin_logged_in","true"),this.showAdminPanel(),this.loadLeads()}handleLogout(){this.isLoggedIn=!1,localStorage.removeItem("admin_logged_in"),this.showLoginScreen()}showLoginScreen(){const e=document.getElementById("loginScreen"),t=document.getElementById("adminPanel");e&&(e.style.display="flex"),t&&(t.style.display="none")}showAdminPanel(){const e=document.getElementById("loginScreen"),t=document.getElementById("adminPanel");e&&(e.style.display="none"),t&&(t.style.display="block"),this.showView("leadsView")}showView(e){document.querySelectorAll(".admin-view").forEach(i=>{i.style.display="none"}),document.querySelectorAll(".nav-button").forEach(i=>{i.classList.remove("active")});const o=document.getElementById(e);o&&(o.style.display="block");const a=document.getElementById(`show${e.charAt(0).toUpperCase()+e.slice(1)}`);a&&a.classList.add("active")}loadLeads(){try{console.log("📊 Carregando leads do localStorage...");const e=localStorage.getItem("leads");this.leads=e?JSON.parse(e):[],this.filteredLeads=[...this.leads],console.log(`📦 ${this.leads.length} leads carregados do localStorage`),this.renderLeadsTable(),this.updateLeadsCount()}catch(e){console.error("❌ Erro ao carregar leads do localStorage:",e),this.leads=[],this.filteredLeads=[],this.renderLeadsTable(),this.updateLeadsCount()}}handleAddLead(e){var o,a,i,r,n,d,l,c;e.preventDefault();const t=new FormData(e.target),s={nome_completo:t.get("nome")||((o=document.getElementById("addLeadNome"))==null?void 0:o.value),cpf:(i=t.get("cpf")||((a=document.getElementById("addLeadCPF"))==null?void 0:a.value))==null?void 0:i.replace(/[^\d]/g,""),email:t.get("email")||((r=document.getElementById("addLeadEmail"))==null?void 0:r.value),telefone:t.get("telefone")||((n=document.getElementById("addLeadTelefone"))==null?void 0:n.value),endereco:this.buildAddress(t),produtos:[{nome:t.get("produto")||((d=document.getElementById("addLeadProduto"))==null?void 0:d.value)||"Kit 12 caixas organizadoras + brinde",preco:parseFloat(t.get("valor")||((l=document.getElementById("addLeadValor"))==null?void 0:l.value)||0)}],valor_total:parseFloat(t.get("valor")||((c=document.getElementById("addLeadValor"))==null?void 0:c.value)||0),meio_pagamento:"PIX",origem:"direto",etapa_atual:1,status_pagamento:"pendente",order_bumps:[],data_compra:new Date().toISOString(),created_at:new Date().toISOString(),updated_at:new Date().toISOString()};this.saveLeadToLocalStorage(s),this.loadLeads(),this.showView("leadsView"),e.target.reset(),this.showNotification("Lead criado com sucesso!","success")}saveLeadToLocalStorage(e){try{const t=JSON.parse(localStorage.getItem("leads")||"[]");e.id=Date.now().toString(),t.push(e),localStorage.setItem("leads",JSON.stringify(t)),console.log("✅ Lead salvo no localStorage")}catch(t){console.error("❌ Erro ao salvar lead:",t)}}buildAddress(e){var l,c,m,h,p,g,f,y;const t=e.get("endereco")||((l=document.getElementById("addLeadEndereco"))==null?void 0:l.value)||"",s=e.get("numero")||((c=document.getElementById("addLeadNumero"))==null?void 0:c.value)||"",o=e.get("complemento")||((m=document.getElementById("addLeadComplemento"))==null?void 0:m.value)||"",a=e.get("bairro")||((h=document.getElementById("addLeadBairro"))==null?void 0:h.value)||"",i=e.get("cep")||((p=document.getElementById("addLeadCEP"))==null?void 0:p.value)||"",r=e.get("cidade")||((g=document.getElementById("addLeadCidade"))==null?void 0:g.value)||"",n=e.get("estado")||((f=document.getElementById("addLeadEstado"))==null?void 0:f.value)||"",d=e.get("pais")||((y=document.getElementById("addLeadPais"))==null?void 0:y.value)||"BR";return`${t}, ${s}${o?` - ${o}`:""} - ${a} - ${r}/${n} - CEP: ${i} - ${d}`}previewBulkDataEnhanced(){const e=document.getElementById("bulkDataTextarea");if(!e||!e.value.trim()){this.showNotification("Por favor, cole os dados na caixa de texto","error");return}try{console.log("📊 Iniciando pré-visualização aprimorada...");const t=e.value.trim().split(`
`).filter(o=>o.trim());console.log(`📈 Total de linhas detectadas: ${t.length}`);const s=this.enhancedBulkImport.processData(e.value);if(s.success)this.displayEnhancedPreview(s);else throw new Error(s.error)}catch(t){console.error("❌ Erro ao processar dados:",t),this.showNotification("Erro ao processar dados: "+t.message,"error")}}displayEnhancedPreview(e){const t=document.getElementById("bulkPreviewSection"),s=document.getElementById("bulkPreviewContainer"),o=document.getElementById("confirmBulkImportButton"),a=document.getElementById("previewSummary");if(!t||!s)return;t.style.display="block";const i=this.enhancedBulkImport.determineBatchSize(e.totalRecords),r=Math.ceil(e.totalRecords/i);let n=`
            <div style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h4 style="color: #1976d2; margin-bottom: 10px;">
                    <i class="fas fa-info-circle"></i> Configuração de Importação Inteligente
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <strong>Total de Registros:</strong> ${e.totalRecords}
                    </div>
                    <div>
                        <strong>Tamanho do Lote:</strong> ${i} registros
                    </div>
                    <div>
                        <strong>Total de Lotes:</strong> ${r}
                    </div>
                    <div>
                        <strong>Duplicatas Removidas:</strong> ${e.duplicatesRemoved}
                    </div>
                </div>
                <div style="margin-top: 10px; padding: 10px; background: rgba(255, 255, 255, 0.7); border-radius: 4px;">
                    <small style="color: #666;">
                        <i class="fas fa-lightbulb"></i> 
                        <strong>Estratégia:</strong> Os dados serão processados em ${r} lotes de ${i} registros cada, 
                        com retry automático em caso de falha e progresso em tempo real.
                    </small>
                </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Nome</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Email</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Telefone</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">CPF</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Produto</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Valor</th>
                    </tr>
                </thead>
                <tbody>
        `;this.enhancedBulkImport.bulkData.leads.slice(0,10).forEach((l,c)=>{const m=c%2===0?"background: #f9f9f9;":"";n+=`
                <tr style="${m}">
                    <td style="padding: 6px; border: 1px solid #ddd;">${l.nome_completo}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${l.email}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${l.telefone}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${this.formatCPF(l.cpf)}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${l.produto}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">R$ ${l.valor_total.toFixed(2)}</td>
                </tr>
            `}),n+="</tbody></table>",e.totalRecords>10&&(n+=`
                <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; text-align: center;">
                    <small style="color: #856404;">
                        <i class="fas fa-info-circle"></i> 
                        Mostrando apenas os primeiros 10 registros. Total: <strong>${e.totalRecords} registros</strong>
                    </small>
                </div>
            `),s.innerHTML=n,a&&(a.textContent=`${e.totalRecords} registros para importar em ${r} lotes${e.duplicatesRemoved>0?`, ${e.duplicatesRemoved} duplicatas removidas`:""}`),o&&(o.style.display="inline-block",o.innerHTML='<i class="fas fa-rocket"></i> Iniciar Importação Inteligente')}async confirmBulkImportEnhanced(){if(!this.enhancedBulkImport.bulkData||!this.enhancedBulkImport.bulkData.leads.length){this.showNotification("Nenhum dado para importar","error");return}if(!document.getElementById("confirmBulkImportButton"))return;const t=this.enhancedBulkImport.getStats();if(!confirm(`Iniciar importação inteligente?

• ${t.totalRecords} registros
• ${this.enhancedBulkImport.batches.length} lotes
• Retry automático em caso de falha
• Progresso em tempo real

Continuar?`))return;console.log("🚀 Iniciando importação inteligente...");const o=document.getElementById("bulkPreviewSection");o&&(o.style.display="none"),await this.enhancedBulkImport.startImport()}clearBulkDataEnhanced(){const e=document.getElementById("bulkDataTextarea"),t=document.getElementById("bulkPreviewSection"),s=document.getElementById("bulkResultsSection");e&&(e.value=""),t&&(t.style.display="none"),s&&(s.style.display="none"),this.enhancedBulkImport.reset(),this.showNotification("Dados limpos com sucesso","success")}editBulkDataEnhanced(){const e=document.getElementById("bulkPreviewSection");e&&(e.style.display="none");const t=document.getElementById("bulkDataTextarea");t&&t.focus(),this.enhancedBulkImport.batches=[],this.enhancedBulkImport.currentBatchIndex=0,this.enhancedBulkImport.clearCache()}previewBulkData(){const e=document.getElementById("bulkDataTextarea");if(!e||!e.value.trim()){this.showNotification("Por favor, cole os dados na caixa de texto","error");return}try{this.bulkData=this.parseBulkData(e.value),this.displayBulkPreview()}catch(t){console.error("❌ Erro ao processar dados:",t),this.showNotification("Erro ao processar dados: "+t.message,"error")}}parseBulkData(e){const t=e.trim().split(`
`).filter(i=>i.trim()),s=[],o=new Set,a=[];for(let i=0;i<t.length;i++){const r=t[i].trim();if(!r)continue;const n=r.split(/\t+|\s{2,}/).map(w=>w.trim());if(n.length<4){console.warn(`Linha ${i+1} ignorada: poucos campos`);continue}const[d,l,c,m,h,p,g,f,y,v,b,x,B,E]=n,u=(m||"").replace(/[^\d]/g,"");if(o.has(u)){a.push({nome:d,cpf:u});continue}o.add(u);const I=this.buildAddressFromFields({rua:g||"",numero:f||"",complemento:y||"",bairro:v||"",cep:b||"",cidade:x||"",estado:B||"",pais:E||"BR"});s.push({nome_completo:d||"",email:l||"",telefone:c||"",cpf:u,produto:h||"Kit 12 caixas organizadoras + brinde",valor_total:parseFloat(p)||67.9,endereco:I,meio_pagamento:"PIX",origem:"direto",etapa_atual:1,status_pagamento:"pendente",order_bumps:[],produtos:[{nome:h||"Kit 12 caixas organizadoras + brinde",preco:parseFloat(p)||67.9}],lineNumber:i+1})}return console.log(`📊 Dados processados: ${s.length} leads, ${a.length} duplicatas removidas`),{leads:s,duplicatesRemoved:a}}buildAddressFromFields({rua:e,numero:t,complemento:s,bairro:o,cep:a,cidade:i,estado:r,pais:n}){return`${e}, ${t}${s?` - ${s}`:""} - ${o} - ${i}/${r} - CEP: ${a} - ${n}`}displayBulkPreview(){const e=document.getElementById("bulkPreviewSection"),t=document.getElementById("bulkPreviewContainer"),s=document.getElementById("confirmBulkImportButton"),o=document.getElementById("previewSummary");if(!e||!t)return;e.style.display="block";let a=`
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Nome</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Email</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Telefone</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">CPF</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Produto</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Valor</th>
                    </tr>
                </thead>
                <tbody>
        `;this.bulkData.leads.forEach((i,r)=>{const n=r%2===0?"background: #f9f9f9;":"";a+=`
                <tr style="${n}">
                    <td style="padding: 6px; border: 1px solid #ddd;">${i.nome_completo}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${i.email}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${i.telefone}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${L.formatCPF(i.cpf)}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${i.produto}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">R$ ${i.valor_total.toFixed(2)}</td>
                </tr>
            `}),a+="</tbody></table>",this.bulkData.duplicatesRemoved.length>0&&(a+=`
                <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                    <strong>📋 Duplicatas Removidas (${this.bulkData.duplicatesRemoved.length}):</strong>
                    <ul style="margin: 5px 0 0 20px;">
                        ${this.bulkData.duplicatesRemoved.map(i=>`<li>${i.nome} - CPF: ${this.formatCPF(i.cpf)}</li>`).join("")}
                    </ul>
                </div>
            `),t.innerHTML=a,o&&(o.textContent=`${this.bulkData.leads.length} leads para importar${this.bulkData.duplicatesRemoved.length>0?`, ${this.bulkData.duplicatesRemoved.length} duplicatas removidas`:""}`),s&&(s.style.display="inline-block")}async confirmBulkImport(){if(!this.bulkData||!this.bulkData.leads.length){this.showNotification("Nenhum dado para importar","error");return}const e=document.getElementById("confirmBulkImportButton");if(!e)return;const t=e.innerHTML;e.innerHTML='<i class="fas fa-spinner fa-spin"></i> Importando...',e.disabled=!0;try{const s=await this.processBulkImport();this.displayBulkResults(s)}catch(s){console.error("❌ Erro na importação em massa:",s),this.showNotification("Erro na importação: "+s.message,"error")}finally{e.innerHTML=t,e.disabled=!1}}processBulkImport(){const e={success:[],errors:[],total:this.bulkData.leads.length};return this.bulkData.leads.forEach(t=>{try{const s=this.validateLeadData(t);if(!s.isValid){e.errors.push({nome:t.nome_completo,cpf:t.cpf,error:s.error,type:"validation"});return}const o=JSON.parse(localStorage.getItem("leads")||"[]");if(o.find(i=>i.cpf===t.cpf)){e.errors.push({nome:t.nome_completo,cpf:t.cpf,error:"CPF já existe no sistema",type:"duplicate"});return}t.id=Date.now().toString()+Math.random().toString(36).substr(2,9),o.push(t),localStorage.setItem("leads",JSON.stringify(o)),e.success.push({nome:t.nome_completo,cpf:t.cpf,id:t.id})}catch(s){e.errors.push({nome:t.nome_completo,cpf:t.cpf,error:s.message,type:"exception"})}}),e}validateLeadData(e){return!e.nome_completo||e.nome_completo.trim().length<2?{isValid:!1,error:"Nome completo é obrigatório (mínimo 2 caracteres)"}:!e.email||!this.isValidEmail(e.email)?{isValid:!1,error:"Email é obrigatório e deve ter formato válido"}:!e.telefone||e.telefone.length<10?{isValid:!1,error:"Telefone é obrigatório (mínimo 10 dígitos)"}:!e.cpf||e.cpf.length!==11?{isValid:!1,error:"CPF é obrigatório e deve ter 11 dígitos"}:this.isValidCPF(e.cpf)?{isValid:!0}:{isValid:!1,error:"CPF inválido (formato ou dígitos verificadores incorretos)"}}isValidCPF(e){const t=e.replace(/[^\d]/g,"");return!(t.length!==11||/^(\d)\1{10}$/.test(t))}isValidEmail(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}displayBulkResults(e){const t=document.getElementById("bulkResultsSection"),s=document.getElementById("bulkResultsContainer");if(!t||!s)return;t.style.display="block";let o=`
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        `;o+=`
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px;">
                <h4 style="color: #155724; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-check-circle"></i>
                    Pedidos Postados com Sucesso (${e.success.length})
                </h4>
        `,e.success.length>0?(o+='<ul style="margin: 0; padding-left: 20px; max-height: 200px; overflow-y: auto;">',e.success.forEach(r=>{o+=`<li style="margin-bottom: 5px; color: #155724;">
                    <strong>${r.nome}</strong> - CPF: ${L.formatCPF(r.cpf)}
                </li>`}),o+="</ul>",o+=`
                <div style="margin-top: 15px; text-align: center;">
                    <button id="goToLeadsListButton" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">
                        <i class="fas fa-list"></i> Ir para Lista
                    </button>
                </div>
            `):o+='<p style="color: #856404; font-style: italic;">Nenhum pedido foi postado com sucesso.</p>',o+="</div>",o+=`
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px;">
                <h4 style="color: #721c24; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Pedidos com Erro (${e.errors.length})
                </h4>
        `,e.errors.length>0?(o+=`
                <div style="max-height: 200px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: #f5c6cb;">
                                <th style="padding: 6px; border: 1px solid #f1b0b7; text-align: left;">Nome</th>
                                <th style="padding: 6px; border: 1px solid #f1b0b7; text-align: left;">CPF</th>
                                <th style="padding: 6px; border: 1px solid #f1b0b7; text-align: left;">Motivo do Erro</th>
                            </tr>
                        </thead>
                        <tbody>
            `,e.errors.forEach((r,n)=>{const d=n%2===0?"background: #fdf2f2;":"";o+=`
                    <tr style="${d}">
                        <td style="padding: 6px; border: 1px solid #f1b0b7;">${r.nome}</td>
                        <td style="padding: 6px; border: 1px solid #f1b0b7;">${this.formatCPF(r.cpf)}</td>
                        <td style="padding: 6px; border: 1px solid #f1b0b7; color: #721c24;">
                            <strong>${this.getErrorTypeLabel(r.type)}:</strong> ${r.error}
                        </td>
                    </tr>
                `}),o+="</tbody></table></div>"):o+='<p style="color: #155724; font-style: italic;">Nenhum erro encontrado! 🎉</p>',o+="</div></div>",o+=`
            <div style="background: #e2e3e5; border: 1px solid #d6d8db; border-radius: 8px; padding: 15px; text-align: center;">
                <h4 style="color: #383d41; margin-bottom: 10px;">📊 Resumo da Importação</h4>
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <strong style="color: #28a745;">${e.success.length}</strong>
                        <span style="color: #6c757d;"> Sucessos</span>
                    </div>
                    <div>
                        <strong style="color: #dc3545;">${e.errors.length}</strong>
                        <span style="color: #6c757d;"> Erros</span>
                    </div>
                    <div>
                        <strong style="color: #007bff;">${e.total}</strong>
                        <span style="color: #6c757d;"> Total Processados</span>
                    </div>
                    <div>
                        <strong style="color: #ffc107;">${this.bulkData.duplicatesRemoved.length}</strong>
                        <span style="color: #6c757d;"> Duplicatas Removidas</span>
                    </div>
                </div>
            </div>
        `,s.innerHTML=o;const a=document.getElementById("goToLeadsListButton");a&&a.addEventListener("click",()=>{this.showView("leadsView"),this.refreshLeads()});const i=document.getElementById("bulkPreviewSection");i&&(i.style.display="none"),this.bulkResults=e}getErrorTypeLabel(e){return{validation:"Dados Inválidos",duplicate:"Duplicidade",database:"Erro de Banco",exception:"Erro Interno"}[e]||"Erro"}clearBulkData(){const e=document.getElementById("bulkDataTextarea"),t=document.getElementById("bulkPreviewSection"),s=document.getElementById("bulkResultsSection");e&&(e.value=""),t&&(t.style.display="none"),s&&(s.style.display="none"),this.bulkData=[],this.bulkResults=null}editBulkData(){const e=document.getElementById("bulkPreviewSection");e&&(e.style.display="none");const t=document.getElementById("bulkDataTextarea");t&&t.focus()}checkPendingImport(){if(this.enhancedBulkImport.hasPendingImport()){const e=this.enhancedBulkImport.getStats();confirm(`Importação pendente detectada!

• ${e.processedRecords}/${e.totalRecords} registros processados
• ${e.successfulRecords} sucessos, ${e.failedRecords} erros
• Lote atual: ${e.currentBatch}/${e.totalBatches}

Deseja continuar a importação?`)?(this.showView("bulkAddView"),setTimeout(()=>{this.enhancedBulkImport.resumeImport()},500)):this.enhancedBulkImport.clearCache()}}refreshLeads(){console.log("🔄 Atualizando lista de leads..."),this.loadLeads(),this.showNotification("Lista atualizada com sucesso!","success"),this.checkPendingImport()}applyFilters(){console.log("🔍 Aplicando filtros...");const e=document.getElementById("searchInput"),t=document.getElementById("dateFilter"),s=document.getElementById("stageFilter"),o=e?e.value.toLowerCase().trim():"",a=t?t.value:"",i=s?s.value:"all";console.log("Filtros aplicados:",{searchTerm:o,dateValue:a,stageValue:i}),this.filteredLeads=this.leads.filter(r=>{if(o){const n=(r.nome_completo||"").toLowerCase().includes(o),d=(r.cpf||"").replace(/[^\d]/g,"").includes(o.replace(/[^\d]/g,""));if(!n&&!d)return!1}if(a){const n=new Date(r.created_at),d=new Date(a);if(n.toDateString()!==d.toDateString())return!1}return!(i!=="all"&&(r.etapa_atual||1).toString()!==i)}),console.log(`Filtros aplicados: ${this.filteredLeads.length} de ${this.leads.length} leads`),this.currentPage=1,this.renderLeadsTable(),this.updateLeadsCount(),this.showNotification(`Filtros aplicados: ${this.filteredLeads.length} leads encontrados`,"info")}async handleSystemAction(e){console.log(`🔧 Executando ação do sistema: ${e}`),this.applyFilters();const t=this.filteredLeads;if(e==="refresh"){this.showLoadingButton("refreshButton","Atualizando...");try{this.refreshLeads(),this.showNotification("Lista atualizada com sucesso!","success")}finally{this.hideLoadingButton("refreshButton",'<i class="fas fa-sync"></i> Atualizar Lista')}return}if(e==="clearAll"){if(t.length===0){this.showNotification("Nenhum lead encontrado com os filtros aplicados","error");return}if(!confirm(`Tem certeza que deseja excluir ${t.length} leads filtrados? Esta ação é irreversível.`))return;this.showLoadingButton("clearAllButton","Excluindo...");try{await this.deleteFilteredLeads(t),this.showNotification(`${t.length} leads excluídos com sucesso!`,"success")}catch(o){console.error("❌ Erro ao excluir leads:",o),this.showNotification("Erro ao excluir leads: "+o.message,"error")}finally{this.hideLoadingButton("clearAllButton",'<i class="fas fa-trash"></i> Limpar Todos')}return}if(e==="nextAll"||e==="prevAll"){if(t.length===0){this.showNotification("Nenhum lead encontrado com os filtros aplicados","error");return}const s=e==="nextAll"?"avançar":"voltar",o=e==="nextAll"?"nextAllButton":"prevAllButton",a=e==="nextAll"?'<i class="fas fa-forward"></i> Avançar Todos':'<i class="fas fa-backward"></i> Voltar Todos';if(!confirm(`Tem certeza que deseja ${s} ${t.length} leads filtrados?`))return;this.showLoadingButton(o,`${s==="avançar"?"Avançando":"Voltando"}...`);try{await this.updateFilteredLeadsStage(t,e==="nextAll"?1:-1),this.showNotification(`${t.length} leads ${s==="avançar"?"avançados":"voltados"} com sucesso!`,"success")}catch(r){console.error(`❌ Erro ao ${s} leads:`,r),this.showNotification(`Erro ao ${s} leads: `+r.message,"error")}finally{this.hideLoadingButton(o,a)}}}showLoadingButton(e,t){const s=document.getElementById(e);s&&(s.dataset.originalText=s.innerHTML,s.innerHTML=`<i class="fas fa-spinner fa-spin"></i> ${t}`,s.disabled=!0)}hideLoadingButton(e,t){const s=document.getElementById(e);s&&(s.innerHTML=t||s.dataset.originalText||s.innerHTML,s.disabled=!1,delete s.dataset.originalText)}async updateFilteredLeadsStage(e,t){try{const s=JSON.parse(localStorage.getItem("leads")||"[]");let o=0;return e.forEach(a=>{const i=s.findIndex(r=>(r.id||r.cpf)===(a.id||a.cpf));if(i!==-1){const r=s[i].etapa_atual||1,n=Math.max(1,Math.min(16,r+t));n!==r&&(s[i].etapa_atual=n,s[i].updated_at=new Date().toISOString(),o++)}}),localStorage.setItem("leads",JSON.stringify(s)),this.loadLeads(),console.log(`✅ ${o} leads atualizados`),o}catch(s){throw console.error("❌ Erro ao atualizar etapas:",s),s}}async deleteFilteredLeads(e){try{const t=JSON.parse(localStorage.getItem("leads")||"[]"),s=e.map(a=>a.id||a.cpf),o=t.filter(a=>!s.includes(a.id||a.cpf));return localStorage.setItem("leads",JSON.stringify(o)),this.loadLeads(),console.log(`✅ ${e.length} leads excluídos`),e.length}catch(t){throw console.error("❌ Erro ao excluir leads:",t),t}}renderLeadsTable(){const e=document.getElementById("leadsTableBody"),t=document.getElementById("emptyState");if(!e)return;if(this.filteredLeads.length===0){e.innerHTML="",t&&(t.style.display="block");return}t&&(t.style.display="none");const s=(this.currentPage-1)*this.leadsPerPage,o=s+this.leadsPerPage,a=this.filteredLeads.slice(s,o);let i="";a.forEach(r=>{const n=this.selectedLeads.has(r.id||r.cpf),d=Array.isArray(r.produtos)?r.produtos:[],l=d.length>0?d[0].nome:"Produto não informado",c=this.formatCPF(r.cpf||"");i+=`
                <tr style="${n?"background-color: #e3f2fd;":""}">
                    <td>
                        <input type="checkbox" ${n?"checked":""} 
                               onchange="adminPanel.toggleLeadSelection('${r.id||r.cpf}', this.checked)">
                    </td>
                    <td>${r.nome_completo||"N/A"}</td>
                    <td>${c}</td>
                    <td>${r.email||"N/A"}</td>
                    <td>${r.telefone||"N/A"}</td>
                    <td>${l}</td>
                    <td>R$ ${(r.valor_total||0).toFixed(2)}</td>
                    <td>${this.formatDate(r.created_at)}</td>
                    <td>
                        <span class="stage-badge ${this.getStageClass(r.etapa_atual)}">
                            ${r.etapa_atual||1}
                        </span>
                    </td>
                    <td>${this.formatDate(r.updated_at)}</td>
                    <td>
                        <div class="lead-actions">
                            <button class="action-button edit" onclick="adminPanel.editLead('${r.id||r.cpf}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-button next" onclick="adminPanel.nextStage('${r.id||r.cpf}')">
                                <i class="fas fa-forward"></i>
                            </button>
                            <button class="action-button prev" onclick="adminPanel.prevStage('${r.id||r.cpf}')">
                                <i class="fas fa-backward"></i>
                            </button>
                            <button class="action-button delete" onclick="adminPanel.deleteLead('${r.id||r.cpf}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `}),e.innerHTML=i,this.updateSelectedCount()}formatCPF(e){const t=e.replace(/[^\d]/g,"");return t.length<=11?t.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,"$1.$2.$3-$4"):e}toggleLeadSelection(e,t){t?this.selectedLeads.add(e):this.selectedLeads.delete(e),this.updateSelectedCount()}toggleSelectAll(e){const t=document.querySelectorAll('#leadsTableBody input[type="checkbox"]');e?this.filteredLeads.forEach(s=>{this.selectedLeads.add(s.id||s.cpf)}):this.selectedLeads.clear(),t.forEach(s=>{s.checked=e}),this.renderLeadsTable(),this.updateSelectedCount()}updateSelectedCount(){const e=document.getElementById("selectedCount"),t=document.querySelectorAll(".mass-action-button"),s=document.querySelectorAll(".action-count"),o=this.selectedLeads.size;e&&(e.textContent=`${o} selecionados`),t.forEach(a=>{a.disabled=o===0,o===0?(a.style.opacity="0.5",a.style.cursor="not-allowed"):(a.style.opacity="1",a.style.cursor="pointer")}),s.forEach(a=>{a.textContent=`(${o} leads)`})}updateLeadsCount(){const e=document.getElementById("leadsCount");e&&(e.textContent=`${this.filteredLeads.length} leads`)}formatDate(e){if(!e)return"N/A";try{return new Date(e).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return"Data inválida"}}getStageClass(e){return e>=12?"completed":e>=6?"pending":""}showNotification(e,t="info"){const s=document.createElement("div");switch(s.style.cssText=`
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 9999;
            animation: slideInRight 0.3s ease;
        `,t){case"success":s.style.background="#28a745";break;case"error":s.style.background="#dc3545";break;default:s.style.background="#007bff"}s.textContent=e,document.body.appendChild(s),setTimeout(()=>{s.style.animation="slideOutRight 0.3s ease",setTimeout(()=>{s.parentNode&&s.remove()},300)},3e3)}handleMassAction(e){if(this.selectedLeads.size===0){this.showNotification("Nenhum lead selecionado","error");return}switch(console.log(`🔧 Ação em massa: ${e} para ${this.selectedLeads.size} leads`),e){case"nextStage":this.massNextStage();break;case"prevStage":this.massPrevStage();break;case"setStage":this.massSetStage();break;case"delete":this.massDeleteLeads();break;default:console.warn("Ação não reconhecida:",e)}}async massNextStage(){if(this.selectedLeads.size===0){this.showNotification("Nenhum lead selecionado","error");return}const e=`Tem certeza que deseja avançar ${this.selectedLeads.size} lead(s) para a próxima etapa?`;if(confirm(e))try{const t=JSON.parse(localStorage.getItem("leads")||"[]");let s=0;this.selectedLeads.forEach(o=>{const a=t.findIndex(i=>(i.id||i.cpf)===o);if(a!==-1){const i=t[a].etapa_atual||1,r=Math.min(16,i+1);t[a].etapa_atual=r,t[a].updated_at=new Date().toISOString(),s++}}),localStorage.setItem("leads",JSON.stringify(t)),this.selectedLeads.clear(),this.loadLeads(),this.showNotification(`${s} lead(s) avançado(s) com sucesso!`,"success"),console.log(`✅ ${s} leads avançados para próxima etapa`)}catch(t){console.error("❌ Erro ao avançar leads:",t),this.showNotification("Erro ao avançar leads: "+t.message,"error")}}async massPrevStage(){if(this.selectedLeads.size===0){this.showNotification("Nenhum lead selecionado","error");return}const e=`Tem certeza que deseja retroceder ${this.selectedLeads.size} lead(s) para a etapa anterior?`;if(confirm(e))try{const t=JSON.parse(localStorage.getItem("leads")||"[]");let s=0;this.selectedLeads.forEach(o=>{const a=t.findIndex(i=>(i.id||i.cpf)===o);if(a!==-1){const i=t[a].etapa_atual||1,r=Math.max(1,i-1);t[a].etapa_atual=r,t[a].updated_at=new Date().toISOString(),s++}}),localStorage.setItem("leads",JSON.stringify(t)),this.selectedLeads.clear(),this.loadLeads(),this.showNotification(`${s} lead(s) retrocedido(s) com sucesso!`,"success"),console.log(`✅ ${s} leads retrocedidos para etapa anterior`)}catch(t){console.error("❌ Erro ao retroceder leads:",t),this.showNotification("Erro ao retroceder leads: "+t.message,"error")}}async massSetStage(){if(this.selectedLeads.size===0){this.showNotification("Nenhum lead selecionado","error");return}const e=prompt(`Digite a etapa desejada (1-16) para ${this.selectedLeads.size} lead(s):`);if(!e)return;const t=parseInt(e);if(isNaN(t)||t<1||t>16){this.showNotification("Etapa inválida. Digite um número entre 1 e 16.","error");return}const s=`Tem certeza que deseja definir a etapa ${t} para ${this.selectedLeads.size} lead(s)?`;if(confirm(s))try{const o=JSON.parse(localStorage.getItem("leads")||"[]");let a=0;this.selectedLeads.forEach(i=>{const r=o.findIndex(n=>(n.id||n.cpf)===i);r!==-1&&(o[r].etapa_atual=t,o[r].updated_at=new Date().toISOString(),a++)}),localStorage.setItem("leads",JSON.stringify(o)),this.selectedLeads.clear(),this.loadLeads(),this.showNotification(`${a} lead(s) definido(s) para etapa ${t} com sucesso!`,"success"),console.log(`✅ ${a} leads definidos para etapa ${t}`)}catch(o){console.error("❌ Erro ao definir etapa dos leads:",o),this.showNotification("Erro ao definir etapa dos leads: "+o.message,"error")}}async massDeleteLeads(){if(this.selectedLeads.size===0){this.showNotification("Nenhum lead selecionado","error");return}const e=`⚠️ ATENÇÃO: Tem certeza que deseja EXCLUIR ${this.selectedLeads.size} lead(s)?

Esta ação não pode ser desfeita!`;if(confirm(e))try{const t=JSON.parse(localStorage.getItem("leads")||"[]");let s=0;const o=t.filter(a=>{const i=a.id||a.cpf;return this.selectedLeads.has(i)?(s++,!1):!0});localStorage.setItem("leads",JSON.stringify(o)),this.selectedLeads.clear(),this.loadLeads(),this.showNotification(`${s} lead(s) excluído(s) com sucesso!`,"success"),console.log(`✅ ${s} leads excluídos`)}catch(t){console.error("❌ Erro ao excluir leads:",t),this.showNotification("Erro ao excluir leads: "+t.message,"error")}}async editLead(e){console.log(`✏️ Editando lead: ${e}`);try{const s=JSON.parse(localStorage.getItem("leads")||"[]").find(o=>(o.id||o.cpf)===e);if(!s){this.showNotification("Lead não encontrado","error");return}this.editingLead=s,this.populateEditForm(s),this.showEditModal()}catch(t){console.error("❌ Erro ao carregar lead para edição:",t),this.showNotification("Erro ao carregar dados do lead","error")}}populateEditForm(e){if(document.getElementById("editName").value=e.nome_completo||"",document.getElementById("editCPF").value=e.cpf||"",document.getElementById("editEmail").value=e.email||"",document.getElementById("editPhone").value=e.telefone||"",document.getElementById("editAddress").value=e.endereco||"",document.getElementById("editStage").value=e.etapa_atual||1,e.updated_at){const t=new Date(e.updated_at),s=new Date(t.getTime()-t.getTimezoneOffset()*6e4).toISOString().slice(0,16);document.getElementById("editStageDateTime").value=s}else{const t=new Date,s=new Date(t.getTime()-t.getTimezoneOffset()*6e4).toISOString().slice(0,16);document.getElementById("editStageDateTime").value=s}}showEditModal(){const e=document.getElementById("editModal");e&&(e.style.display="flex",document.body.style.overflow="hidden")}closeEditModal(){const e=document.getElementById("editModal");e&&(e.style.display="none",document.body.style.overflow="auto"),this.editingLead=null}async handleEditSubmit(e){if(e.preventDefault(),!this.editingLead){this.showNotification("Nenhum lead selecionado para edição","error");return}try{const t=new FormData(e.target),s={...this.editingLead,nome_completo:document.getElementById("editName").value,cpf:document.getElementById("editCPF").value.replace(/[^\d]/g,""),email:document.getElementById("editEmail").value,telefone:document.getElementById("editPhone").value,endereco:document.getElementById("editAddress").value,etapa_atual:parseInt(document.getElementById("editStage").value),updated_at:new Date().toISOString()},o=JSON.parse(localStorage.getItem("leads")||"[]"),a=o.findIndex(i=>(i.id||i.cpf)===(this.editingLead.id||this.editingLead.cpf));if(a!==-1)o[a]=s,localStorage.setItem("leads",JSON.stringify(o)),this.closeEditModal(),this.loadLeads(),this.showNotification("Lead atualizado com sucesso!","success");else throw new Error("Lead não encontrado para atualização")}catch(t){console.error("❌ Erro ao atualizar lead:",t),this.showNotification("Erro ao atualizar lead: "+t.message,"error")}}async nextStage(e){console.log(`⏭️ Próxima etapa para lead: ${e}`),await this.updateLeadStage(e,1)}async prevStage(e){console.log(`⏮️ Etapa anterior para lead: ${e}`),await this.updateLeadStage(e,-1)}async updateLeadStage(e,t){try{const s=JSON.parse(localStorage.getItem("leads")||"[]"),o=s.findIndex(a=>(a.id||a.cpf)===e);if(o!==-1){const a=s[o].etapa_atual||1,i=Math.max(1,Math.min(16,a+t));s[o].etapa_atual=i,s[o].updated_at=new Date().toISOString(),localStorage.setItem("leads",JSON.stringify(s)),this.loadLeads();const r=t>0?"avançada":"retrocedida";this.showNotification(`Etapa ${r} com sucesso! Nova etapa: ${i}`,"success"),console.log(`✅ Etapa atualizada para ${i}`)}else throw new Error("Lead não encontrado")}catch(s){console.error("❌ Erro ao atualizar etapa:",s),this.showNotification("Erro ao atualizar etapa: "+s.message,"error")}}async deleteLead(e){if(confirm("Tem certeza que deseja excluir este lead?")){console.log(`🗑️ Excluindo lead: ${e}`);try{const t=JSON.parse(localStorage.getItem("leads")||"[]"),s=t.filter(o=>(o.id||o.cpf)!==e);if(t.length===s.length)throw new Error("Lead não encontrado para exclusão");localStorage.setItem("leads",JSON.stringify(s)),this.loadLeads(),this.showNotification("Lead excluído com sucesso!","success")}catch(t){console.error("❌ Erro ao excluir lead:",t),this.showNotification("Erro ao excluir lead","error")}}}}let S=null;document.addEventListener("DOMContentLoaded",()=>{S=new R,window.adminPanel=S});
