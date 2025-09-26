/**
 * Google Sheets Dashboard - Main JavaScript Application
 * Verze: 2.0
 * Autor: Dashboard System
 */

class GoogleSheetsDashboard {
    constructor() {
        // Konfigurace
        this.config = {
            gasUrl: '',
            refreshInterval: 30,
            enableNotifications: true,
            maxRetries: 3,
            retryDelay: 5000
        };
        
        // Stav aplikace
        this.charts = {};
        this.data = {};
        this.refreshTimer = null;
        this.retryCount = 0;
        this.isLoading = false;
        
        // Pagination
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filteredData = [];
        
        // Event binding
        this.init();
    }
    
    /**
     * Inicializace aplikace
     */
    async init() {
        console.log('🚀 Inicializace Google Sheets Dashboard v2.0...');
        
        try {
            // Načtení konfigurace
            await this.loadConfig();
            
            // Nastavení UI event listenerů
            this.setupEventListeners();
            
            // Nastavení tématu
            this.loadTheme();
            
            // Skrytí preloader
            this.hidePreloader();
            
            // Kontrola konfigurace a načtení dat
            if (!this.config.gasUrl) {
                console.log('📝 Konfigurace chybí - zobrazuji config modal');
                this.showConfigModal();
            } else {
                console.log('✅ Konfigurace nalezena - načítám data');
                await this.loadAllData();
                this.setupAutoRefresh();
            }
            
        } catch (error) {
            console.error('❌ Chyba při inicializaci:', error);
            this.showError('Chyba při inicializaci aplikace: ' + error.message);
        }
    }
    
    /**
     * Nastavení event listenerů
     */
    setupEventListeners() {
        // Navigation controls
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadAllData();
        });
        
        document.getElementById('configBtn')?.addEventListener('click', () => {
            this.showConfigModal();
        });
        
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Configuration modal
        document.getElementById('saveConfig')?.addEventListener('click', () => {
            this.saveConfig();
        });
        
        // Error handling
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            this.loadAllData();
        });
        
        document.getElementById('showConfigFromError')?.addEventListener('click', () => {
            this.showConfigModal();
        });
        
        // Search and filter
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.filterTable(e.target.value);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.code === 'KeyC') {
                e.preventDefault();
                this.showConfigModal();
            }
            if (e.key === 'F5') {
                e.preventDefault();
                this.loadAllData();
            }
        });
        
        // Chart controls
        document.getElementById('chartFullscreen')?.addEventListener('click', () => {
            this.toggleChartFullscreen('monthlyChart');
        });
    }
    
    /**
     * Skrytí preloader
     */
    hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 300);
            }, 1000);
        }
    }
    
    /**
     * Načtení všech dat z Google Apps Script
     */
    async loadAllData() {
        if (this.isLoading) {
            console.log('⏳ Načítání již probíhá...');
            return;
        }
        
        this.isLoading = true;
        console.log('📊 Načítám data z Google Apps Script...');
        
        this.showLoading(true);
        this.hideError();
        this.updateLoadingProgress(0);
        
        try {
            // Paralelní načtení všech dat s progress tracking
            const dataPromises = [
                this.fetchFromGAS('dashboard').then(data => {
                    this.updateLoadingProgress(33);
                    return { key: 'dashboard', data };
                }),
                this.fetchFromGAS('charts').then(data => {
                    this.updateLoadingProgress(66);
                    return { key: 'charts', data };
                }),
                this.fetchFromGAS('tables').then(data => {
                    this.updateLoadingProgress(100);
                    return { key: 'tables', data };
                })
            ];
            
            const results = await Promise.all(dataPromises);
            
            // Zpracování výsledků
            this.data = {};
            results.forEach(result => {
                this.data[result.key] = result.data;
            });
            
            // Vykreslení všech komponent
            await this.renderAllComponents();
            
            // Úspěšné dokončení
            this.showLoading(false);
            this.retryCount = 0;
            this.updateLastRefreshTime();
            
            if (this.config.enableNotifications) {
                this.showSuccessToast('Data byla úspěšně načtena');
            }
            
            console.log('✅ Data byla úspěšně načtena a vykreslena');
            
        } catch (error) {
            console.error('❌ Chyba při načítání dat:', error);
            this.showError('Nepodařilo se načíst data: ' + error.message);
            this.showLoading(false);
            
            // Retry logika
            this.handleLoadError(error);
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * Aktualizace progress baru při načítání
     */
    updateLoadingProgress(percentage) {
        // Implementace progress bar update
        console.log(`📈 Progress: ${percentage}%`);
    }
    
    /**
     * HTTP fetch z Google Apps Script
     */
    async fetchFromGAS(action) {
        if (!this.config.gasUrl) {
            throw new Error('URL Google Apps Script není nakonfigurována');
        }
        
        const url = `${this.config.gasUrl}?action=${action}&t=${Date.now()}`;
        console.log(`🔗 Volám GAS API: ${action}`, url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Neznámá chyba z Google Apps Script');
            }
            
            console.log(`✅ Data pro ${action} úspěšně načtena:`, result.data);
            return result.data;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Požadavek vypršel (timeout 30s)');
            }
            
            throw error;
        }
    }
    
    /**
     * Vykreslení všech komponent
     */
    async renderAllComponents() {
        try {
            // Metrics cards
            if (this.data.dashboard?.metrics) {
                this.renderMetricsCards(this.data.dashboard.metrics);
            }
            
            // Charts
            if (this.data.charts) {
                await this.renderCharts(this.data.charts);
            }
            
            // Tables
            if (this.data.tables?.employees) {
                this.renderDataTable(this.data.tables.employees);
            }
            
        } catch (error) {
            console.error('❌ Chyba při vykreslování komponent:', error);
            throw error;
        }
    }
    
    /**
     * Vykreslení metrických karet
     */
    renderMetricsCards(metrics) {
        const container = document.getElementById('metricsCards');
        if (!container) return;
        
        container.innerHTML = '';
        
        metrics.forEach((metric, index) => {
            const card = document.createElement('div');
            card.className = 'col-lg-3 col-md-6 mb-4';
            card.style.animationDelay = `${index * 0.1}s`;
            
            const changeClass = metric.change?.startsWith('+') ? 'success' : 
                               metric.change?.startsWith('-') ? 'danger' : 'secondary';
            
            const changeIcon = metric.change?.startsWith('+') ? 'arrow-up' : 
                              metric.change?.startsWith('-') ? 'arrow-down' : 'minus';
            
            card.innerHTML = `
                <div class="card metric-card border-0 shadow-sm h-100" data-bs-toggle="tooltip" 
                     title="Klikněte pro detail">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <h6 class="text-muted mb-2 small">${metric.title}</h6>
                                <h3 class="mb-2 fw-bold">${metric.value}</h3>
                                ${metric.change ? `
                                <div class="d-flex align-items-center">
                                    <span class="badge bg-${changeClass} me-2">
                                        <i class="fas fa-${changeIcon} me-1"></i>
                                        ${metric.change}
                                    </span>
                                    <small class="text-muted">vs. minulý měsíc</small>
                                </div>
                                ` : ''}
                            </div>
                            <div class="icon-container bg-${metric.color} text-white">
                                <i class="fas fa-${metric.icon}"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Event listener pro detail
            card.addEventListener('click', () => {
                this.showMetricDetail(metric);
            });
            
            container.appendChild(card);
        });
        
        // Inicializace tooltipů
        this.initializeTooltips();
    }
    
    /**
     * Vykreslení grafů
     */
    async renderCharts(chartsData) {
        // Destroy existující grafy
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
        
        try {
            // Monthly trends
            if (chartsData.monthlyTrends) {
                this.charts.monthly = this.renderMonthlyChart(chartsData.monthlyTrends);
            }
            
            // Category distribution
            if (chartsData.categoryDistribution) {
                this.charts.category = this.renderCategoryChart(chartsData.categoryDistribution);
            }
            
            // Performance chart
            this.charts.performance = this.renderPerformanceChart(chartsData.monthlyTrends || []);
            
            // Growth chart
            this.charts.growth = this.renderGrowthChart(chartsData.monthlyTrends || []);
            
        } catch (error) {
            console.error('❌ Chyba při vykreslování grafů:', error);
            throw error;
        }
    }
    
    /**
     * Monthly trends line chart
     */
    renderMonthlyChart(data) {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return null;
        
        return new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: data.map(item => item.month || item.label),
                datasets: [
                    {
                        label: 'Prodeje',
                        data: data.map(item => item.sales || item.value1 || 0),
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#0d6efd',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Uživatelé',
                        data: data.map(item => item.users || item.value2 || 0),
                        borderColor: '#198754',
                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                        tension: 0.4,
                        fill: false,
                        pointBackgroundColor: '#198754',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Příjmy',
                        data: data.map(item => item.revenue || item.value3 || 0),
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        fill: false,
                        pointBackgroundColor: '#dc3545',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            padding: 15
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#ddd',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
    
    /**
     * Category doughnut chart
     */
    renderCategoryChart(data) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return null;
        
        return new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.category || item.label),
                datasets: [{
                    data: data.map(item => item.value || 0),
                    backgroundColor: data.map(item => item.color || this.getRandomColor()),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const value = data.datasets[0].data[i];
                                        const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        
                                        return {
                                            text: `${label} (${percentage}%)`,
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Performance bar chart
     */
    renderPerformanceChart(data) {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return null;
        
        const performanceData = data.map(item => {
            const sales = item.sales || 0;
            const users = item.users || 0;
            return users > 0 ? ((sales / users) * 100).toFixed(2) : 0;
        });
        
        return new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: data.map(item => item.month || item.label),
                datasets: [{
                    label: 'Konverzní poměr',
                    data: performanceData,
                    backgroundColor: 'rgba(255, 193, 7, 0.8)',
                    borderColor: '#ffc107',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Growth area chart
     */
    renderGrowthChart(data) {
        const ctx = document.getElementById('growthChart');
        if (!ctx) return null;
        
        // Výpočet growth rate month-over-month
        const growthData = [];
        for (let i = 1; i < data.length; i++) {
            const current = data[i].sales || 0;
            const previous = data[i-1].sales || 1;
            const growth = ((current - previous) / previous * 100);
            growthData.push(growth.toFixed(1));
        }
        
        return new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: data.slice(1).map(item => item.month || item.label),
                datasets: [{
                    label: 'Růst (%)',
                    data: growthData,
                    borderColor: '#20c997',
                    backgroundColor: 'rgba(32, 201, 151, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Vykreslení datové tabulky
     */
    renderDataTable(employees) {
        if (!employees || !Array.isArray(employees)) {
            console.warn('⚠️ Data pro tabulku nejsou k dispozici');
            return;
        }
        
        this.filteredData = [...employees];
        this.renderTableHeaders();
        this.renderTableBody();
        this.updateTableInfo();
    }
    
    /**
     * Vykreslení hlavičky tabulky
     */
    renderTableHeaders() {
        const headerRow = document.getElementById('tableHeader');
        if (!headerRow) return;
        
        headerRow.innerHTML = `
            <th class="sortable" data-field="id">
                <i class="fas fa-hashtag me-1"></i>ID
            </th>
            <th class="sortable" data-field="name">
                <i class="fas fa-user me-1"></i>Jméno
            </th>
            <th class="sortable" data-field="department">
                <i class="fas fa-building me-1"></i>Oddělení
            </th>
            <th class="sortable" data-field="position">
                <i class="fas fa-briefcase me-1"></i>Pozice
            </th>
            <th class="sortable" data-field="salary">
                <i class="fas fa-money-bill me-1"></i>Plat
            </th>
            <th class="sortable" data-field="performance">
                <i class="fas fa-chart-bar me-1"></i>Výkonnost
            </th>
        `;
        
        // Přidání event listenerů pro řazení
        headerRow.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                this.sortTable(th.dataset.field);
            });
        });
    }
    
    /**
     * Vykreslení těla tabulky
     */
    renderTableBody() {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        
        if (pageData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                        <i class="fas fa-search fa-2x mb-2"></i>
                        <br>Žádná data nenalezena
                    </td>
                </tr>
            `;
            return;
        }
        
        pageData.forEach((employee, index) => {
            const row = document.createElement('tr');
            row.className = 'table-row-animated';
            row.style.animationDelay = `${index * 0.05}s`;
            
            row.innerHTML = `
                <td><span class="badge bg-secondary">${employee.id || 'N/A'}</span></td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar me-2">
                            ${this.getAvatarHtml(employee.name)}
                        </div>
                        <strong>${employee.name || 'N/A'}</strong>
                    </div>
                </td>
                <td>
                    <span class="badge bg-primary">${employee.department || 'N/A'}</span>
                </td>
                <td>${employee.position || 'N/A'}</td>
                <td><strong>${this.formatCurrency(employee.salary || 0)}</strong></td>
                <td>
                    <div class="performance-container">
                        <div class="progress mb-1" style="height: 20px;">
                            <div class="progress-bar bg-${this.getPerformanceColor(employee.performance)}" 
                                 style="width: ${employee.performance || 0}%">
                                <small class="text-white fw-bold">${employee.performance || 0}%</small>
                            </div>
                        </div>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        this.updatePagination();
    }
    
    /**
     * Získání HTML pro avatar
     */
    getAvatarHtml(name) {
        if (!name) return '<i class="fas fa-user"></i>';
        
        const initials = name.split(' ')
            .map(n => n.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
            
        return `<span class="avatar-text">${initials}</span>`;
    }
    
    /**
     * Filtrování tabulky
     */
    filterTable(searchTerm) {
        if (!this.data.tables?.employees) return;
        
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            this.filteredData = [...this.data.tables.employees];
        } else {
            this.filteredData = this.data.tables.employees.filter(employee => {
                return Object.values(employee).some(value => 
                    String(value).toLowerCase().includes(term)
                );
            });
        }
        
        this.currentPage = 1;
        this.renderTableBody();
        this.updateTableInfo();
    }
    
    /**
     * Řazení tabulky
     */
    sortTable(field) {
        if (!this.filteredData.length) return;
        
        // Toggle sort direction
        const isCurrentSort = this.currentSortField === field;
        this.currentSortDirection = isCurrentSort && this.currentSortDirection === 'asc' ? 'desc' : 'asc';
        this.currentSortField = field;
        
        // Sort data
        this.filteredData.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            // Handle different data types
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            
            if (aVal < bVal) return this.currentSortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.currentSortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        
        // Update UI
        this.updateSortHeaders();
        this.renderTableBody();
    }
    
    /**
     * Aktualizace řazení v hlavičce
     */
    updateSortHeaders() {
        document.querySelectorAll('#tableHeader .sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.field === this.currentSortField) {
                th.classList.add(`sort-${this.currentSortDirection}`);
            }
        });
    }
    
    /**
     * Aktualizace informací o tabulce
     */
    updateTableInfo() {
        const totalRecords = this.data.tables?.employees?.length || 0;
        const filteredRecords = this.filteredData.length;
        
        const infoElement = document.getElementById('tableFooterInfo');
        if (infoElement) {
            const start = (this.currentPage - 1) * this.itemsPerPage + 1;
            const end = Math.min(start + this.itemsPerPage - 1, filteredRecords);
            
            infoElement.textContent = `Zobrazeno ${start}-${end} z ${filteredRecords} záznamů`;
            if (filteredRecords < totalRecords) {
                infoElement.textContent += ` (filtrováno z ${totalRecords})`;
            }
        }
        
        const tableInfo = document.getElementById('tableInfo');
        if (tableInfo) {
            tableInfo.textContent = `${filteredRecords} záznamů`;
        }
    }
    
    /**
     * Aktualizace pagination
     */
    updatePagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const pagination = document.getElementById('tablePagination');
        
        if (!pagination) return;
        
        pagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" data-page="${this.currentPage - 1}">Předchozí</a>`;
        pagination.appendChild(prevLi);
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            pagination.appendChild(li);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${this.currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" data-page="${this.currentPage + 1}">Další</a>`;
        pagination.appendChild(nextLi);
        
        // Event listeners
        pagination.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.tagName === 'A' && !e.target.parentElement.classList.contains('disabled')) {
                this.currentPage = parseInt(e.target.dataset.page);
                this.renderTableBody();
            }
        });
    }
    
    /**
     * Pomocné metody
     */
    getPerformanceColor(performance) {
        const perf = parseInt(performance) || 0;
        if (perf >= 90) return 'success';
        if (perf >= 70) return 'warning';
        if (perf >= 50) return 'info';
        return 'danger';
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK'
        }).format(amount || 0);
    }
    
    getRandomColor() {
        const colors = ['#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545', '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Konfigurace a nastavení
     */
    loadConfig() {
        const saved = localStorage.getItem('dashboardConfig');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.config = { ...this.config, ...config };
                console.log('✅ Konfigurace načtena z localStorage');
            } catch (error) {
                console.warn('⚠️ Chyba při načítání konfigurace:', error);
            }
        }
    }
    
    showConfigModal() {
        const modal = new bootstrap.Modal(document.getElementById('configModal'));
        
        // Předvyplnění formuláře
        document.getElementById('gasUrl').value = this.config.gasUrl || '';
        document.getElementById('refreshInterval').value = this.config.refreshInterval || 30;
        document.getElementById('enableNotifications').checked = this.config.enableNotifications !== false;
        
        modal.show();
    }
    
    saveConfig() {
        const gasUrl = document.getElementById('gasUrl').value.trim();
        const refreshInterval = parseInt(document.getElementById('refreshInterval').value) || 30;
        const enableNotifications = document.getElementById('enableNotifications').checked;
        
        if (!gasUrl) {
            alert('Prosím zadejte URL Google Apps Script');
            return;
        }
        
        // Validace URL
        try {
            new URL(gasUrl);
        } catch (error) {
            alert('Prosím zadejte platnou URL adresu');
            return;
        }
        
        // Uložení konfigurace
        this.config.gasUrl = gasUrl;
        this.config.refreshInterval = Math.max(1, Math.min(180, refreshInterval));
        this.config.enableNotifications = enableNotifications;
        
        localStorage.setItem('dashboardConfig', JSON.stringify(this.config));
        
        // Zavření modalu
        bootstrap.Modal.getInstance(document.getElementById('configModal')).hide();
        
        // Načtení dat a nastavení auto-refresh
        this.loadAllData();
        this.setupAutoRefresh();
        
        this.showSuccessToast('Konfigurace byla uložena');
        
        console.log('✅ Konfigurace uložena:', this.config);
    }
    
    /**
     * Auto-refresh functionality
     */
    setupAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        if (this.config.refreshInterval > 0) {
            const intervalMs = this.config.refreshInterval * 60 * 1000;
            this.refreshTimer = setInterval(() => {
                console.log('🔄 Auto-refresh dat...');
                this.loadAllData();
            }, intervalMs);
            
            console.log(`⏰ Auto-refresh nastaven na ${this.config.refreshInterval} minut`);
        }
    }
    
    /**
     * UI Helper methods
     */
    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        const content = document.getElementById('dashboardContent');
        
        if (indicator && content) {
            indicator.style.display = show ? 'block' : 'none';
            content.style.display = show ? 'none' : 'block';
        }
    }
    
    showError(message) {
        const errorDisplay = document.getElementById('errorDisplay');
        const errorMessage = document.getElementById('errorMessage');
        const dashboardContent = document.getElementById('dashboardContent');
        
        if (errorDisplay && errorMessage) {
            errorMessage.textContent = message;
            errorDisplay.style.display = 'block';
            if (dashboardContent) {
                dashboardContent.style.display = 'none';
            }
        }
        
        console.error('❌ Chyba zobrazena uživateli:', message);
    }
    
    hideError() {
        const errorDisplay = document.getElementById('errorDisplay');
        if (errorDisplay) {
            errorDisplay.style.display = 'none';
        }
    }
    
    showSuccessToast(message) {
        if (!this.config.enableNotifications) return;
        
        const toast = document.getElementById('successToast');
        const messageElement = document.getElementById('successMessage');
        
        if (toast && messageElement) {
            messageElement.textContent = message;
            new bootstrap.Toast(toast).show();
        }
    }
    
    updateLastRefreshTime() {
        const timeElement = document.getElementById('updateTime');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('cs-CZ');
        }
    }
    
    /**
     * Theme management
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('dashboardTheme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            this.updateThemeToggle(true);
        }
    }
    
    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        this.updateThemeToggle(isDark);
        localStorage.setItem('dashboardTheme', isDark ? 'dark' : 'light');
        
        console.log(`🎨 Téma změněno na: ${isDark ? 'tmavé' : 'světlé'}`);
    }
    
    updateThemeToggle(isDark) {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.innerHTML = isDark 
                ? '<i class="fas fa-sun"></i>' 
                : '<i class="fas fa-moon"></i>';
        }
    }
    
    /**
     * Error handling
     */
    handleLoadError(error) {
        if (this.retryCount < this.config.maxRetries) {
            this.retryCount++;
            const delay = this.config.retryDelay * this.retryCount;
            
            console.log(`🔄 Pokus ${this.retryCount}/${this.config.maxRetries} za ${delay/1000}s...`);
            
            setTimeout(() => {
                this.loadAllData();
            }, delay);
        } else {
            console.log('❌ Maximální počet pokusů vyčerpán');
            if (this.config.enableNotifications) {
                this.showSuccessToast('Nepodařilo se načíst data po několika pokusech');
            }
        }
    }
    
    /**
     * Advanced features
     */
    showMetricDetail(metric) {
        // Implementace detailu metriky - modalní okno s více informacemi
        console.log('📊 Detail metriky:', metric);
        // TODO: Implementovat detail modal
    }
    
    toggleChartFullscreen(chartId) {
        // Implementace fullscreen režimu pro grafy
        console.log('🔍 Fullscreen graf:', chartId);
        // TODO: Implementovat fullscreen modal
    }
    
    initializeTooltips() {
        // Inicializace Bootstrap tooltipů
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    /**
     * Debug helpers
     */
    getDebugInfo() {
        return {
            config: this.config,
            data: this.data,
            isLoading: this.isLoading,
            retryCount: this.retryCount,
            currentPage: this.currentPage,
            filteredDataCount: this.filteredData.length
        };
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM načten - inicializuji dashboard...');
    
    window.dashboard = new GoogleSheetsDashboard();
    
    // Debug helpers pro console
    window.debugDashboard = {
        reload: () => window.dashboard.loadAllData(),
        config: () => window.dashboard.showConfigModal(),
        data: () => window.dashboard.getDebugInfo(),
        theme: () => window.dashboard.toggleTheme()
    };
    
    console.log('🔧 Debug helpers dostupné: window.debugDashboard');
});

// Service Worker registration pro PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('🔧 Service Worker registrován');
            })
            .catch(error => {
                console.log('⚠️ Service Worker registrace selhala');
            });
    });
}