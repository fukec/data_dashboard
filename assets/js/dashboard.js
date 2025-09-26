/**
 * Google Sheets Dashboard - Main JavaScript Application - USER CONFIGURABLE
 * Verze: 2.1 - ROZŠÍŘENO O UŽIVATELSKOU KONFIGURACI
 * Autor: Dashboard System
 */

class GoogleSheetsDashboard {
    constructor() {
        // Základní konfigurace (ZACHOVÁNO)
        this.config = {
            gasUrl: '',
            refreshInterval: 30,
            enableNotifications: true,
            maxRetries: 3,
            retryDelay: 5000
        };
        
        // NOVÁ: Uživatelská konfigurace UI
        this.uiConfig = {
            // Metriky
            metrics: {
                enabled: ['revenue', 'users', 'income', 'growth'],
                order: ['revenue', 'users', 'income', 'growth'],
                colors: {
                    revenue: 'primary',
                    users: 'success', 
                    income: 'info',
                    growth: 'warning'
                }
            },
            // Grafy
            charts: {
                monthlyTrends: { enabled: true, type: 'line', position: 1 },
                categoryDistribution: { enabled: true, type: 'doughnut', position: 2 },
                performance: { enabled: true, type: 'bar', position: 3 },
                growth: { enabled: true, type: 'line', position: 4 }
            },
            // Tabulky
            tables: {
                employees: { enabled: true, columns: ['id', 'name', 'department', 'position', 'salary', 'performance'] },
                itemsPerPage: 10
            },
            // Barevné téma
            theme: {
                primaryColor: '#0d6efd',
                secondaryColor: '#6c757d',
                darkMode: false
            },
            // Layout
            layout: {
                metricsPerRow: 4,
                chartsLayout: 'grid', // 'grid' nebo 'list'
                showAnimations: true
            }
        };
        
        // Stav aplikace (ZACHOVÁNO)
        this.charts = {};
        this.data = {};
        this.refreshTimer = null;
        this.retryCount = 0;
        this.isLoading = false;
        
        // Pagination (ZACHOVÁNO)
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filteredData = [];
        
        // JSONP callback counter (ZACHOVÁNO)
        this.callbackCounter = 0;
        
        // Event binding
        this.init();
    }
    
    /**
     * Inicializace aplikace (ROZŠÍŘENO)
     */
    async init() {
        console.log('🚀 Inicializace Google Sheets Dashboard v2.1 - USER CONFIGURABLE...');
        
        try {
            // Načtení konfigurace (ZACHOVÁNO)
            await this.loadConfig();
            
            // NOVÉ: Načtení UI konfigurace
            await this.loadUIConfig();
            
            // Nastavení UI event listenerů (ROZŠÍŘENO)
            this.setupEventListeners();
            
            // Nastavení tématu (ROZŠÍŘENO)
            this.loadTheme();
            this.applyCustomTheme();
            
            // Skrytí preloader (ZACHOVÁNO)
            this.hidePreloader();
            
            // Kontrola konfigurace a načtení dat (ZACHOVÁNO)
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
     * NOVÉ: Načtení UI konfigurace z localStorage
     */
    async loadUIConfig() {
        const saved = localStorage.getItem('dashboardUIConfig');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.uiConfig = { ...this.uiConfig, ...config };
                console.log('✅ UI konfigurace načtena z localStorage');
            } catch (error) {
                console.warn('⚠️ Chyba při načítání UI konfigurace:', error);
            }
        }
    }
    
    /**
     * NOVÉ: Uložení UI konfigurace
     */
    saveUIConfig() {
        try {
            localStorage.setItem('dashboardUIConfig', JSON.stringify(this.uiConfig));
            console.log('✅ UI konfigurace uložena');
        } catch (error) {
            console.error('❌ Chyba při ukládání UI konfigurace:', error);
        }
    }
    
    /**
     * Nastavení event listenerů (ROZŠÍŘENO)
     */
    setupEventListeners() {
        // Navigation controls (ZACHOVÁNO)
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadAllData();
        });
        
        document.getElementById('configBtn')?.addEventListener('click', () => {
            this.showConfigModal();
        });
        
        // NOVÉ: Tlačítko pro UI konfiguraci
        document.getElementById('uiConfigBtn')?.addEventListener('click', () => {
            this.showUIConfigModal();
        });
        
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Configuration modal (ZACHOVÁNO)
        document.getElementById('saveConfig')?.addEventListener('click', () => {
            this.saveConfig();
        });
        
        // NOVÉ: UI Configuration modal
        document.getElementById('saveUIConfig')?.addEventListener('click', () => {
            this.saveUIConfigFromModal();
        });
        
        document.getElementById('resetUIConfig')?.addEventListener('click', () => {
            this.resetUIConfig();
        });
        
        document.getElementById('exportUIConfig')?.addEventListener('click', () => {
            this.exportUIConfig();
        });
        
        document.getElementById('importUIConfig')?.addEventListener('change', (e) => {
            this.importUIConfig(e);
        });
        
        // Error handling (ZACHOVÁNO)
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            this.loadAllData();
        });
        
        document.getElementById('showConfigFromError')?.addEventListener('click', () => {
            this.showConfigModal();
        });
        
        // Search and filter (ZACHOVÁNO)
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.filterTable(e.target.value);
        });
        
        // Keyboard shortcuts (ROZŠÍŘENO)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.code === 'KeyC') {
                e.preventDefault();
                this.showConfigModal();
            }
            if (e.ctrlKey && e.altKey && e.code === 'KeyU') {
                e.preventDefault();
                this.showUIConfigModal();
            }
            if (e.key === 'F5') {
                e.preventDefault();
                this.loadAllData();
            }
        });
        
        // Chart controls (ZACHOVÁNO)
        document.getElementById('chartFullscreen')?.addEventListener('click', () => {
            this.toggleChartFullscreen('monthlyChart');
        });
    }
    
    // [VŠECHNY PŮVODNÍ FUNKCE ZŮSTÁVAJÍ BEZE ZMĚN - loadAllData, fetchFromGASJsonp, atd.]
    
    /**
     * Načtení všech dat z Google Apps Script - ZACHOVÁNO
     */
    async loadAllData() {
        if (this.isLoading) {
            console.log('⏳ Načítání již probíhá...');
            return;
        }
        
        this.isLoading = true;
        console.log('📊 Načítám data z Google Apps Script - CORS FIX...');
        
        this.showLoading(true);
        this.hideError();
        this.updateLoadingProgress(0);
        
        try {
            // Sekvenční načítání dat s JSONP (ZACHOVÁNO)
            console.log('🔗 Volám GAS API pomocí JSONP...');
            
            const dashboardData = await this.fetchFromGASJsonp('dashboard');
            this.updateLoadingProgress(33);
            
            const chartsData = await this.fetchFromGASJsonp('charts');
            this.updateLoadingProgress(66);
            
            const tablesData = await this.fetchFromGASJsonp('tables');
            this.updateLoadingProgress(100);
            
            // Zpracování výsledků (ZACHOVÁNO)
            this.data = {
                dashboard: dashboardData,
                charts: chartsData,
                tables: tablesData
            };
            
            // Vykreslení všech komponent (UPRAVENO - nyní respektuje UI config)
            await this.renderAllComponents();
            
            // Úspěšné dokončení (ZACHOVÁNO)
            this.showLoading(false);
            this.retryCount = 0;
            this.updateLastRefreshTime();
            
            if (this.config.enableNotifications) {
                this.showSuccessToast('Data byla úspěšně načtena');
            }
            
            console.log('✅ Data byla úspěšně načtena pomocí JSONP');
            
        } catch (error) {
            console.error('❌ Chyba při načítání dat:', error);
            this.showError('Nepodařilo se načíst data: ' + error.message);
            this.showLoading(false);
            
            // Retry logika (ZACHOVÁNO)
            this.handleLoadError(error);
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * ZACHOVÁNO: JSONP fetch pro obcházení CORS
     */
    fetchFromGASJsonp(action) {
        return new Promise((resolve, reject) => {
            if (!this.config.gasUrl) {
                reject(new Error('URL Google Apps Script není nakonfigurována'));
                return;
            }
            
            // Vytvoř jedinečný callback název
            this.callbackCounter++;
            const callbackName = `gasCallback${this.callbackCounter}`;
            
            // Vytvoř URL s callback parametrem
            const url = `${this.config.gasUrl}?action=${action}&callback=${callbackName}&t=${Date.now()}`;
            console.log(`🔗 JSONP volání: ${action}`, url);
            
            // Timeout pro požadavek
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Požadavek vypršel (timeout 30s)'));
            }, 30000);
            
            // Cleanup funkce
            const cleanup = () => {
                if (window[callbackName]) {
                    delete window[callbackName];
                }
                if (script && script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                clearTimeout(timeout);
            };
            
            // Vytvoř globální callback funkci
            window[callbackName] = (data) => {
                cleanup();
                
                if (data && data.success) {
                    console.log(`✅ JSONP data pro ${action} úspěšně načtena:`, data.data);
                    resolve(data.data);
                } else {
                    reject(new Error(data?.error || 'Neznámá chyba z Google Apps Script'));
                }
            };
            
            // Vytvoř script tag pro JSONP
            const script = document.createElement('script');
            script.src = url;
            script.onerror = () => {
                cleanup();
                reject(new Error('Síťová chyba při načítání ze skriptu'));
            };
            
            // Přidej script do DOM
            document.head.appendChild(script);
        });
    }
    
    /**
     * Vykreslení všech komponent (UPRAVENO - respektuje UI config)
     */
    async renderAllComponents() {
        try {
            // Metrics cards - pouze povolené (UPRAVENO)
            if (this.data.dashboard?.metrics && this.uiConfig.metrics.enabled.length > 0) {
                const filteredMetrics = this.filterMetricsByConfig(this.data.dashboard.metrics);
                this.renderMetricsCards(filteredMetrics);
            }
            
            // Charts - pouze povolené (UPRAVENO)
            if (this.data.charts) {
                await this.renderChartsWithConfig(this.data.charts);
            }
            
            // Tables - pouze povolené (UPRAVENO)  
            if (this.data.tables?.employees && this.uiConfig.tables.employees.enabled) {
                this.renderDataTable(this.data.tables.employees);
            }
            
        } catch (error) {
            console.error('❌ Chyba při vykreslování komponent:', error);
            throw error;
        }
    }
    
    /**
     * NOVÉ: Filtrování metrik podle UI konfigurace
     */
    filterMetricsByConfig(metrics) {
        const metricMap = {
            'revenue': 'Celkové tržby',
            'users': 'Aktivní uživatelé', 
            'income': 'Příjmy',
            'growth': 'Růstová míra'
        };
        
        return this.uiConfig.metrics.order
            .filter(key => this.uiConfig.metrics.enabled.includes(key))
            .map(key => {
                const metric = metrics.find(m => m.title === metricMap[key]);
                if (metric) {
                    // Aplikuj vlastní barvu
                    metric.color = this.uiConfig.metrics.colors[key] || metric.color;
                }
                return metric;
            })
            .filter(m => m); // Odstraň undefined
    }
    
    /**
     * NOVÉ: Vykreslování grafů podle UI konfigurace
     */
    async renderChartsWithConfig(chartsData) {
        // Destroy existující grafy (ZACHOVÁNO)
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
        
        // Skryj všechny chart containery
        this.hideAllChartContainers();
        
        try {
            // Seřaď grafy podle pozice v konfiguraci
            const enabledCharts = Object.entries(this.uiConfig.charts)
                .filter(([key, config]) => config.enabled)
                .sort(([,a], [,b]) => a.position - b.position);
            
            // Vykresli pouze povolené grafy
            for (const [chartKey, chartConfig] of enabledCharts) {
                await this.renderSingleChart(chartKey, chartConfig, chartsData);
            }
            
        } catch (error) {
            console.error('❌ Chyba při vykreslování grafů:', error);
            throw error;
        }
    }
    
    /**
     * NOVÉ: Vykreslení jednotlivého grafu
     */
    async renderSingleChart(chartKey, chartConfig, chartsData) {
        const containerId = this.getChartContainerId(chartKey);
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.warn(`Container pro graf ${chartKey} nenalezen`);
            return;
        }
        
        // Zobraz container
        container.style.display = 'block';
        
        switch(chartKey) {
            case 'monthlyTrends':
                if (chartsData.monthlyTrends) {
                    this.charts.monthly = this.renderMonthlyChart(chartsData.monthlyTrends, chartConfig.type);
                }
                break;
            case 'categoryDistribution':
                if (chartsData.categoryDistribution) {
                    this.charts.category = this.renderCategoryChart(chartsData.categoryDistribution, chartConfig.type);
                }
                break;
            case 'performance':
                this.charts.performance = this.renderPerformanceChart(chartsData.monthlyTrends || [], chartConfig.type);
                break;
            case 'growth':
                this.charts.growth = this.renderGrowthChart(chartsData.monthlyTrends || [], chartConfig.type);
                break;
        }
    }
    
    /**
     * NOVÉ: Získání ID containeru pro graf
     */
    getChartContainerId(chartKey) {
        const containerMap = {
            'monthlyTrends': 'monthlyChartContainer',
            'categoryDistribution': 'categoryChartContainer', 
            'performance': 'performanceChartContainer',
            'growth': 'growthChartContainer'
        };
        return containerMap[chartKey];
    }
    
    /**
     * NOVÉ: Skrytí všech chart containerů
     */
    hideAllChartContainers() {
        const containers = ['monthlyChartContainer', 'categoryChartContainer', 'performanceChartContainer', 'growthChartContainer'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.style.display = 'none';
            }
        });
    }
    
    /**
     * NOVÉ: Zobrazení UI konfiguračního modalu
     */
    showUIConfigModal() {
        // Předvyplnění aktuálních hodnot
        this.populateUIConfigModal();
        
        const modal = new bootstrap.Modal(document.getElementById('uiConfigModal'));
        modal.show();
    }
    
    /**
     * NOVÉ: Předvyplnění UI konfiguračního modalu
     */
    populateUIConfigModal() {
        // Metriky checkboxy
        const metricsEnabled = this.uiConfig.metrics.enabled;
        ['revenue', 'users', 'income', 'growth'].forEach(metric => {
            const checkbox = document.getElementById(`metric_${metric}`);
            if (checkbox) {
                checkbox.checked = metricsEnabled.includes(metric);
            }
            
            // Barvy
            const colorSelect = document.getElementById(`color_${metric}`);
            if (colorSelect) {
                colorSelect.value = this.uiConfig.metrics.colors[metric] || 'primary';
            }
        });
        
        // Grafy checkboxy a typy
        Object.entries(this.uiConfig.charts).forEach(([chartKey, config]) => {
            const checkbox = document.getElementById(`chart_${chartKey}`);
            if (checkbox) {
                checkbox.checked = config.enabled;
            }
            
            const typeSelect = document.getElementById(`chartType_${chartKey}`);
            if (typeSelect) {
                typeSelect.value = config.type;
            }
        });
        
        // Tabulka
        const tableCheckbox = document.getElementById('table_employees');
        if (tableCheckbox) {
            tableCheckbox.checked = this.uiConfig.tables.employees.enabled;
        }
        
        // Téma
        const primaryColor = document.getElementById('primaryColor');
        if (primaryColor) {
            primaryColor.value = this.uiConfig.theme.primaryColor;
        }
        
        const darkMode = document.getElementById('darkModeToggle');
        if (darkMode) {
            darkMode.checked = this.uiConfig.theme.darkMode;
        }
        
        // Layout
        const metricsPerRow = document.getElementById('metricsPerRow');
        if (metricsPerRow) {
            metricsPerRow.value = this.uiConfig.layout.metricsPerRow;
        }
        
        const showAnimations = document.getElementById('showAnimations');
        if (showAnimations) {
            showAnimations.checked = this.uiConfig.layout.showAnimations;
        }
    }
    
    /**
     * NOVÉ: Uložení UI konfigurace z modalu
     */
    saveUIConfigFromModal() {
        try {
            // Metriky
            const enabledMetrics = [];
            ['revenue', 'users', 'income', 'growth'].forEach(metric => {
                const checkbox = document.getElementById(`metric_${metric}`);
                if (checkbox && checkbox.checked) {
                    enabledMetrics.push(metric);
                }
                
                // Barvy
                const colorSelect = document.getElementById(`color_${metric}`);
                if (colorSelect) {
                    this.uiConfig.metrics.colors[metric] = colorSelect.value;
                }
            });
            this.uiConfig.metrics.enabled = enabledMetrics;
            
            // Grafy
            Object.keys(this.uiConfig.charts).forEach(chartKey => {
                const checkbox = document.getElementById(`chart_${chartKey}`);
                if (checkbox) {
                    this.uiConfig.charts[chartKey].enabled = checkbox.checked;
                }
                
                const typeSelect = document.getElementById(`chartType_${chartKey}`);
                if (typeSelect) {
                    this.uiConfig.charts[chartKey].type = typeSelect.value;
                }
            });
            
            // Tabulka
            const tableCheckbox = document.getElementById('table_employees');
            if (tableCheckbox) {
                this.uiConfig.tables.employees.enabled = tableCheckbox.checked;
            }
            
            // Téma
            const primaryColor = document.getElementById('primaryColor');
            if (primaryColor) {
                this.uiConfig.theme.primaryColor = primaryColor.value;
            }
            
            const darkMode = document.getElementById('darkModeToggle');
            if (darkMode) {
                this.uiConfig.theme.darkMode = darkMode.checked;
            }
            
            // Layout
            const metricsPerRow = document.getElementById('metricsPerRow');
            if (metricsPerRow) {
                this.uiConfig.layout.metricsPerRow = parseInt(metricsPerRow.value);
            }
            
            const showAnimations = document.getElementById('showAnimations');
            if (showAnimations) {
                this.uiConfig.layout.showAnimations = showAnimations.checked;
            }
            
            // Uložení
            this.saveUIConfig();
            
            // Aplikování změn
            this.applyCustomTheme();
            this.renderAllComponents();
            
            // Zavření modalu
            bootstrap.Modal.getInstance(document.getElementById('uiConfigModal')).hide();
            
            this.showSuccessToast('UI konfigurace byla uložena');
            
        } catch (error) {
            console.error('❌ Chyba při ukládání UI konfigurace:', error);
            alert('Chyba při ukládání konfigurace: ' + error.message);
        }
    }
    
    /**
     * NOVÉ: Reset UI konfigurace na výchozí
     */
    resetUIConfig() {
        if (confirm('Opravdu chcete resetovat UI konfiguraci na výchozí hodnoty?')) {
            // Smazání z localStorage
            localStorage.removeItem('dashboardUIConfig');
            
            // Reset na výchozí hodnoty
            this.uiConfig = {
                metrics: {
                    enabled: ['revenue', 'users', 'income', 'growth'],
                    order: ['revenue', 'users', 'income', 'growth'],
                    colors: {
                        revenue: 'primary',
                        users: 'success',
                        income: 'info', 
                        growth: 'warning'
                    }
                },
                charts: {
                    monthlyTrends: { enabled: true, type: 'line', position: 1 },
                    categoryDistribution: { enabled: true, type: 'doughnut', position: 2 },
                    performance: { enabled: true, type: 'bar', position: 3 },
                    growth: { enabled: true, type: 'line', position: 4 }
                },
                tables: {
                    employees: { enabled: true, columns: ['id', 'name', 'department', 'position', 'salary', 'performance'] },
                    itemsPerPage: 10
                },
                theme: {
                    primaryColor: '#0d6efd',
                    secondaryColor: '#6c757d',
                    darkMode: false
                },
                layout: {
                    metricsPerRow: 4,
                    chartsLayout: 'grid',
                    showAnimations: true
                }
            };
            
            this.populateUIConfigModal();
            this.applyCustomTheme();
            this.renderAllComponents();
            
            this.showSuccessToast('UI konfigurace byla resetována');
        }
    }
    
    /**
     * NOVÉ: Export UI konfigurace
     */
    exportUIConfig() {
        try {
            const configJson = JSON.stringify(this.uiConfig, null, 2);
            const blob = new Blob([configJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-ui-config-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSuccessToast('UI konfigurace byla exportována');
            
        } catch (error) {
            console.error('❌ Chyba při exportu:', error);
            alert('Chyba při exportu konfigurace: ' + error.message);
        }
    }
    
    /**
     * NOVÉ: Import UI konfigurace
     */
    importUIConfig(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                
                // Validace základní struktury
                if (config.metrics && config.charts && config.tables && config.theme && config.layout) {
                    this.uiConfig = { ...this.uiConfig, ...config };
                    this.saveUIConfig();
                    this.populateUIConfigModal();
                    this.applyCustomTheme();
                    this.renderAllComponents();
                    
                    this.showSuccessToast('UI konfigurace byla importována');
                } else {
                    throw new Error('Neplatný formát konfiguračního souboru');
                }
                
            } catch (error) {
                console.error('❌ Chyba při importu:', error);
                alert('Chyba při importu konfigurace: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }
    
    /**
     * NOVÉ: Aplikování vlastního tématu
     */
    applyCustomTheme() {
        const root = document.documentElement;
        
        // Aplikuj primární barvu
        root.style.setProperty('--primary-color', this.uiConfig.theme.primaryColor);
        
        // Aplikuj dark mode
        if (this.uiConfig.theme.darkMode) {
            document.body.classList.add('dark-theme');
            this.updateThemeToggle(true);
        } else {
            document.body.classList.remove('dark-theme');
            this.updateThemeToggle(false);
        }
        
        // Aplikuj animace
        if (!this.uiConfig.layout.showAnimations) {
            root.style.setProperty('--animation-duration', '0s');
        } else {
            root.style.setProperty('--animation-duration', '0.3s');
        }
        
        // Aplikuj metriky per row
        const metricsContainer = document.getElementById('metricsCards');
        if (metricsContainer) {
            const colClass = `col-lg-${12 / this.uiConfig.layout.metricsPerRow}`;
            // Tuto logiku by bylo potřeba implementovat detailněji
        }
    }
    
    // [VŠECHNY OSTATNÍ PŮVODNÍ FUNKCE ZŮSTÁVAJÍ BEZE ZMĚN]
    // renderMetricsCards, renderMonthlyChart, renderCategoryChart, atd.
    // loadConfig, saveConfig, setupAutoRefresh, atd.
    // showLoading, showError, hideError, showSuccessToast, atd.
    // loadTheme, toggleTheme, updateThemeToggle, atd.
    // handleLoadError, showMetricDetail, toggleChartFullscreen, atd.
    
    /**
     * Vykreslení metrických karet (MÍRNĚ UPRAVENO pro UI config)
     */
    renderMetricsCards(metrics) {
        const container = document.getElementById('metricsCards');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Aplikuj metriky per row z konfigurace
        const colClass = `col-lg-${12 / this.uiConfig.layout.metricsPerRow} col-md-6 mb-4`;
        
        metrics.forEach((metric, index) => {
            const card = document.createElement('div');
            card.className = colClass;
            
            if (this.uiConfig.layout.showAnimations) {
                card.style.animationDelay = `${index * 0.1}s`;
            }
            
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
     * Monthly trends line chart (MÍRNĚ UPRAVENO pro chart type)
     */
    renderMonthlyChart(data, chartType = 'line') {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return null;
        
        return new Chart(ctx.getContext('2d'), {
            type: chartType,
            data: {
                labels: data.map(item => item.month || item.label),
                datasets: [
                    {
                        label: 'Prodeje',
                        data: data.map(item => item.sales || item.value1 || 0),
                        borderColor: this.uiConfig.theme.primaryColor,
                        backgroundColor: this.hexToRgba(this.uiConfig.theme.primaryColor, 0.1),
                        tension: chartType === 'line' ? 0.4 : 0,
                        fill: chartType === 'line' ? true : false,
                        pointBackgroundColor: this.uiConfig.theme.primaryColor,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Uživatelé',
                        data: data.map(item => item.users || item.value2 || 0),
                        borderColor: '#198754',
                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                        tension: chartType === 'line' ? 0.4 : 0,
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
                        tension: chartType === 'line' ? 0.4 : 0,
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
     * Category chart (MÍRNĚ UPRAVENO pro chart type)
     */
    renderCategoryChart(data, chartType = 'doughnut') {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return null;
        
        return new Chart(ctx.getContext('2d'), {
            type: chartType,
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
     * Performance chart (MÍRNĚ UPRAVENO pro chart type)
     */
    renderPerformanceChart(data, chartType = 'bar') {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return null;
        
        const performanceData = data.map(item => {
            const sales = item.sales || 0;
            const users = item.users || 0;
            return users > 0 ? ((sales / users) * 100).toFixed(2) : 0;
        });
        
        return new Chart(ctx.getContext('2d'), {
            type: chartType,
            data: {
                labels: data.map(item => item.month || item.label),
                datasets: [{
                    label: 'Konverzní poměr',
                    data: performanceData,
                    backgroundColor: 'rgba(255, 193, 7, 0.8)',
                    borderColor: '#ffc107',
                    borderWidth: 1,
                    tension: chartType === 'line' ? 0.4 : 0
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
     * Growth chart (MÍRNĚ UPRAVENO pro chart type)
     */
    renderGrowthChart(data, chartType = 'line') {
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
            type: chartType,
            data: {
                labels: data.slice(1).map(item => item.month || item.label),
                datasets: [{
                    label: 'Růst (%)',
                    data: growthData,
                    borderColor: '#20c997',
                    backgroundColor: 'rgba(32, 201, 151, 0.1)',
                    fill: chartType === 'line' ? true : false,
                    tension: chartType === 'line' ? 0.4 : 0
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
     * NOVÉ: Pomocná funkce pro hex to rgba konverzi
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16); 
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // [VŠECHNY OSTATNÍ PŮVODNÍ FUNKCE POKRAČUJÍ BEZ ZMĚN...]
    // updateLoadingProgress, renderDataTable, renderTableHeaders, renderTableBody,
    // getAvatarHtml, filterTable, sortTable, updateSortHeaders, updateTableInfo,
    // updatePagination, getPerformanceColor, formatCurrency, getRandomColor,
    // loadConfig, showConfigModal, saveConfig, setupAutoRefresh, showLoading,
    // showError, hideError, showSuccessToast, updateLastRefreshTime, loadTheme,
    // toggleTheme, updateThemeToggle, handleLoadError, showMetricDetail,
    // toggleChartFullscreen, initializeTooltips, getDebugInfo
    
    // [POKRAČOVÁNÍ VŠECH PŮVODNÍCH FUNKCÍ...]
    
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
    
    updateLoadingProgress(percentage) {
        console.log(`📈 Progress: ${percentage}%`);
    }
    
    renderDataTable(employees) {
        if (!employees || !Array.isArray(employees)) {
            console.warn('⚠️ Data pro tabulku nejsou k dispozici');
            return;
        }
        
        this.filteredData = [...employees];
        this.itemsPerPage = this.uiConfig.tables.itemsPerPage || 10;
        this.renderTableHeaders();
        this.renderTableBody();
        this.updateTableInfo();
    }
    
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
            if (this.uiConfig.layout.showAnimations) {
                row.style.animationDelay = `${index * 0.05}s`;
            }
            
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
    
    getAvatarHtml(name) {
        if (!name) return '<i class="fas fa-user"></i>';
        
        const initials = name.split(' ')
            .map(n => n.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
            
        return `<span class="avatar-text">${initials}</span>`;
    }
    
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
    
    updateSortHeaders() {
        document.querySelectorAll('#tableHeader .sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.field === this.currentSortField) {
                th.classList.add(`sort-${this.currentSortDirection}`);
            }
        });
    }
    
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
        
        // Aktualizuj UI konfiguraci
        this.uiConfig.theme.darkMode = isDark;
        this.saveUIConfig();
        
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
    
    showMetricDetail(metric) {
        console.log('📊 Detail metriky:', metric);
    }
    
    toggleChartFullscreen(chartId) {
        console.log('🔍 Fullscreen graf:', chartId);
    }
    
    initializeTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    getDebugInfo() {
        return {
            config: this.config,
            uiConfig: this.uiConfig,
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
    console.log('🏁 DOM načten - inicializuji dashboard s USER CONFIG...');
    
    window.dashboard = new GoogleSheetsDashboard();
    
    // Debug helpers pro console (ROZŠÍŘENO)
    window.debugDashboard = {
        reload: () => window.dashboard.loadAllData(),
        config: () => window.dashboard.showConfigModal(),
        uiConfig: () => window.dashboard.showUIConfigModal(),
        data: () => window.dashboard.getDebugInfo(),
        theme: () => window.dashboard.toggleTheme(),
        exportConfig: () => window.dashboard.exportUIConfig(),
        resetConfig: () => window.dashboard.resetUIConfig()
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
