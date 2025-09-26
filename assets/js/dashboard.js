<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Sheets Dashboard</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.min.js"></script>
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
    
    <!-- Preloader styles -->
    <style>
        .preloader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, var(--color-primary), var(--color-teal-600));
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            transition: opacity 0.3s ease;
        }
        .module-config-panel {
            max-height: 400px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <!-- Preloader -->
    <div id="preloader" class="preloader">
        <div class="spinner-border text-light mb-3" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Načítání...</span>
        </div>
        <h4>Google Sheets Dashboard</h4>
        <p class="text-light">Inicializace aplikace...</p>
    </div>

    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background-color: var(--color-primary);">
        <div class="container-fluid">
            <a class="navbar-brand fw-bold" href="#">
                <i class="fas fa-chart-dashboard me-2"></i>
                Dashboard
            </a>
            
            <div class="navbar-nav ms-auto d-flex flex-row">
                <span class="navbar-text me-3">
                    <small>Poslední aktualizace: <span id="updateTime">--:--</span></small>
                </span>
                
                <!-- NOVÉ: Tlačítko pro moduly -->
                <button class="btn btn-outline-light btn-sm me-2" id="modulesBtn" title="Správa modulů" data-bs-toggle="modal" data-bs-target="#modulesModal">
                    <i class="fas fa-cubes"></i>
                </button>
                
                <button class="btn btn-outline-light btn-sm me-2" id="configBtn" title="Konfigurace (Ctrl+Alt+C)">
                    <i class="fas fa-cog"></i>
                </button>
                
                <button class="btn btn-outline-light btn-sm me-2" id="refreshBtn" title="Obnovit data (F5)">
                    <i class="fas fa-sync-alt"></i>
                </button>
                
                <button class="btn btn-outline-light btn-sm" id="themeToggle" title="Přepnout téma">
                    <i class="fas fa-moon"></i>
                </button>
            </div>
        </div>
    </nav>

    <!-- Loading Indicator -->
    <div id="loadingIndicator" class="container-fluid mt-5 pt-4" style="display: none;">
        <div class="row justify-content-center">
            <div class="col-md-6 text-center">
                <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Načítání dat...</span>
                </div>
                <h4>Načítám data z Google Sheets...</h4>
                <p class="text-muted">Připojuji se k datovým zdrojům...</p>
            </div>
        </div>
    </div>

    <!-- Error Display -->
    <div id="errorDisplay" class="container-fluid mt-5 pt-4" style="display: none;">
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Nastala chyba!
                    </h4>
                    <p id="errorMessage">Nepodařilo se načíst data</p>
                    <hr>
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-outline-danger" id="retryBtn">
                            <i class="fas fa-redo me-1"></i>
                            Zkusit znovu
                        </button>
                        <button class="btn btn-danger" id="showConfigFromError">
                            <i class="fas fa-cog me-1"></i>
                            Zkontrolujte konfiguraci a zkuste to znovu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Dashboard Content -->
    <div id="dashboardContent" class="dashboard-content">
        <div class="container-fluid">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="display-6">
                    <i class="fas fa-tachometer-alt me-3"></i>
                    Dashboard přehled
                </h1>
                <p class="lead text-muted">Real-time data z Google Sheets</p>
            </div>

            <!-- NOVÉ: Dynamický obsah modulů -->
            <div id="moduleContainer">
                <!-- Zde se budou vykreslovat aktivní moduly -->
            </div>

            <!-- ZACHOVÁNO: Původní obsah jako fallback -->
            <div id="originalContent">
                <!-- Metrics Cards -->
                <div class="row mb-4">
                    <div class="col-12">
                        <h2 class="section-title">
                            <i class="fas fa-chart-simple me-2"></i>
                            Klíčové metriky
                        </h2>
                    </div>
                </div>
                <div class="row" id="metricsCards">
                    <!-- Dynamicky generované metrické karty -->
                </div>

                <!-- Charts Section -->
                <div class="row">
                    <div class="col-12">
                        <h2 class="section-title">
                            <i class="fas fa-chart-line me-2"></i>
                            Grafy a analýzy
                        </h2>
                    </div>
                </div>

                <!-- Charts Grid -->
                <div class="row">
                    <!-- Monthly Trends Chart -->
                    <div class="col-lg-8 mb-4">
                        <div class="card chart-card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-chart-line me-2"></i>
                                    Měsíční trendy
                                </h5>
                                <small class="text-muted">Prodeje, uživatelé a příjmy</small>
                                <div class="chart-controls">
                                    <button class="btn btn-sm btn-outline-primary" id="chartFullscreen">
                                        <i class="fas fa-expand"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="card-body">
                                <canvas id="monthlyChart" height="300"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Category Distribution Chart -->
                    <div class="col-lg-4 mb-4">
                        <div class="card chart-card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-chart-pie me-2"></i>
                                    Rozložení kategorií
                                </h5>
                                <small class="text-muted">Distribuční analýza</small>
                            </div>
                            <div class="card-body">
                                <canvas id="categoryChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <!-- Performance Chart -->
                    <div class="col-lg-6 mb-4">
                        <div class="card chart-card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-chart-bar me-2"></i>
                                    Výkonnostní analýza
                                </h5>
                                <small class="text-muted">KPI trendy</small>
                            </div>
                            <div class="card-body">
                                <canvas id="performanceChart" height="200"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Growth Chart -->
                    <div class="col-lg-6 mb-4">
                        <div class="card chart-card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-chart-area me-2"></i>
                                    Růstová analýza
                                </h5>
                                <small class="text-muted">Month-over-month růst</small>
                            </div>
                            <div class="card-body">
                                <canvas id="growthChart" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Data Table Section -->
                <div class="row">
                    <div class="col-12">
                        <h2 class="section-title">
                            <i class="fas fa-table me-2"></i>
                            Detailní data
                        </h2>
                    </div>
                    
                    <div class="col-12">
                        <div class="card table-card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title mb-0">
                                        <i class="fas fa-users me-2"></i>
                                        Data z Google Sheets
                                    </h5>
                                    <small class="text-muted" id="tableInfo">Načítám...</small>
                                </div>
                                <div class="d-flex align-items-center table-controls">
                                    <input type="text" class="form-control form-control-sm" 
                                           id="searchInput" placeholder="Vyhledat..." style="width: 200px;">
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr id="tableHeader">
                                                <!-- Dynamicky generované hlavičky -->
                                            </tr>
                                        </thead>
                                        <tbody id="tableBody">
                                            <!-- Dynamicky generované řádky -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="card-footer d-flex justify-content-between align-items-center">
                                <small class="text-muted" id="tableFooterInfo">Zobrazeno 0 z 0 záznamů</small>
                                <nav>
                                    <ul class="pagination pagination-sm mb-0" id="tablePagination">
                                        <!-- Dynamicky generované stránkování -->
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Configuration Modal (ZACHOVÁNO) -->
    <div class="modal fade" id="configModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-cog me-2"></i>
                        Konfigurace Dashboard
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form>
                        <div class="mb-3">
                            <label for="gasUrl" class="form-label">
                                <i class="fas fa-link me-1"></i>
                                URL Google Apps Script
                            </label>
                            <input type="url" class="form-control" id="gasUrl" 
                                   placeholder="https://script.google.com/macros/s/.../exec">
                            <div class="form-text">
                                Vložte URL vašeho nasazeného Google Apps Script Web App
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="refreshInterval" class="form-label">
                                <i class="fas fa-clock me-1"></i>
                                Interval obnovování
                            </label>
                            <select class="form-select" id="refreshInterval">
                                <option value="0">Pouze manuálně</option>
                                <option value="5">5 minut</option>
                                <option value="10">10 minut</option>
                                <option value="15">15 minut</option>
                                <option value="30">30 minut</option>
                                <option value="60">1 hodina</option>
                            </select>
                            <div class="form-text">
                                Jak často se mají data automaticky obnovovat
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="enableNotifications" checked>
                                <label class="form-check-label" for="enableNotifications">
                                    <i class="fas fa-bell me-1"></i>
                                    Povolit notifikace
                                </label>
                            </div>
                            <div class="form-text">
                                Zobrazit oznámení při úspěšném načtení nebo chybách
                            </div>
                        </div>

                        <div class="alert alert-info">
                            <h6><i class="fas fa-info-circle me-2"></i>Návod</h6>
                            <ol class="mb-0">
                                <li>Vytvořte Google Apps Script</li>
                                <li>Vložte poskytnutý backend kód</li>
                                <li>Nastavte sheet ID v konfiguraci</li>
                                <li>Nasaďte jako Web App</li>
                                <li>Zkopírujte URL sem</li>
                            </ol>
                            <hr>
                            <p class="mb-0"><strong>Tip:</strong> Pro testování použijte <kbd>Ctrl+Alt+C</kbd> kdykoli pro otevření konfigurace.</p>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="fas fa-times me-1"></i>
                        Zrušit
                    </button>
                    <button type="button" class="btn btn-primary" id="saveConfig">
                        <i class="fas fa-save me-1"></i>
                        Uložit konfiguraci
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- NOVÝ: Modules Modal -->
    <div class="modal fade" id="modulesModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-cubes me-2"></i>
                        Správa modulů
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p class="text-muted">Vyberte, které moduly chcete zobrazovat v dashboardu:</p>
                    <div class="module-config-panel" id="moduleConfigPanel">
                        <!-- Zde se načtou dostupné moduly -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="fas fa-times me-1"></i>
                        Zrušit
                    </button>
                    <button type="button" class="btn btn-primary" id="saveModules">
                        <i class="fas fa-save me-1"></i>
                        Uložit moduly
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Success Toast -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="successToast" class="toast" role="alert">
            <div class="toast-header">
                <i class="fas fa-check-circle text-success me-2"></i>
                <strong class="me-auto">Úspěch</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body" id="successMessage">
                Operace byla úspěšně dokončena.
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Dashboard JS -->
    <script src="assets/js/dashboard.js"></script>
</body>
</html>
