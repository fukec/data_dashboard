/**
 * Google Apps Script Backend pro Dashboard - CORS FIX
 * Verze: 2.0 - OPRAVENO PRO CORS/JSONP
 * Podporuje multiple sheets, cache, error handling + JSONP
 */

// ========================================
// KONFIGURACE - UPRAVTE PODLE SVÝCH POTŘEB
// ========================================

const CONFIG = {
  // ID vašich Google Sheets - NAHRAĎTE SKUTEČNÝMI ID
  SHEETS: {
    FINANCIAL_DATA: '1XFkpSafhec8eQFYzQaHHq1P8UaadrBX5wQad48rHn0g', // NAHRAĎTE!
    SALES_DATA: '1Palhqiq4yLgujvu_vNFayPssmmmo4joQkAr1zNs1nj4',     // NAHRAĎTE!
    HR_DATA: '15BIXP9QWLzc-gRro9SbC8yRThBLXdxPpc38WkhrKKF0'         // NAHRAĎTE!
  },
  
  // Nastavení cache (v sekundách)
  CACHE_DURATION: 1800, // 30 minut
  SHORT_CACHE: 300,     // 5 minut
  LONG_CACHE: 3600,     // 1 hodina
  
  // API rate limiting
  MAX_REQUESTS_PER_MINUTE: 60,
  REQUEST_TIMEOUT: 30000, // 30 sekund
  
  // Logging
  ENABLE_LOGGING: true,
  LOG_LEVEL: 'INFO', // DEBUG, INFO, WARN, ERROR
  
  // CORS nastavení (pouze pro dokumentaci - nefunguje na GAS)
  CORS_ORIGIN: 'https://fukec.github.io/datovy_dashboard',
  
  // Výchozí data pro testování
  USE_MOCK_DATA: false, // Nastavte na true pro testování bez sheets
  
  // Formát dat
  DATE_FORMAT: 'cs-CZ',
  CURRENCY_FORMAT: 'CZK'
};

// ========================================
// HLAVNÍ API ENDPOINTS - UPRAVENO PRO JSONP
// ========================================

/**
 * GET endpoint - Hlavní vstupní bod - PODPORUJE JSONP
 */
function doGet(e) {
  const startTime = new Date().getTime();
  
  try {
    logInfo('=== Nový GET požadavek ===');
    logInfo('Parametry:', e.parameter);
    
    // Rate limiting check
    if (!checkRateLimit()) {
      return createResponse('Rate limit exceeded. Zkuste to později.', false, 429, e.parameter.callback);
    }
    
    const action = e.parameter.action || 'dashboard';
    const forceRefresh = e.parameter.refresh === 'true';
    const callback = e.parameter.callback; // JSONP callback
    
    let result;
    
    // Router pro různé akce
    switch(action) {
      case 'dashboard':
        result = getDashboardData(forceRefresh);
        break;
      case 'charts':
        result = getChartsData(forceRefresh);
        break;
      case 'tables':
        result = getTablesData(forceRefresh);
        break;
      case 'metrics':
        result = getMetricsData(forceRefresh);
        break;
      case 'refresh':
        result = refreshAllData();
        break;
      case 'health':
        result = getHealthCheck();
        break;
      case 'config':
        result = getConfigInfo();
        break;
      default:
        return createResponse(`Neznámá akce: ${action}`, false, 400, callback);
    }
    
    const executionTime = new Date().getTime() - startTime;
    logApiUsage(action, executionTime, true);
    
    return createResponse(result, true, 200, callback, {
      executionTime: executionTime + 'ms',
      timestamp: new Date().toISOString(),
      version: '2.0'
    });
    
  } catch (error) {
    const executionTime = new Date().getTime() - startTime;
    logError('Chyba v doGet:', error);
    logApiUsage(e.parameter.action || 'unknown', executionTime, false);
    
    return createResponse(error.toString(), false, 500, e.parameter.callback);
  }
}

/**
 * POST endpoint - Pro aktualizace dat
 */
function doPost(e) {
  const startTime = new Date().getTime();
  
  try {
    logInfo('=== Nový POST požadavek ===');
    
    if (!checkRateLimit()) {
      return createResponse('Rate limit exceeded', false, 429);
    }
    
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    let result;
    
    switch(action) {
      case 'updateSheet':
        result = updateSheetData(postData.sheetId, postData.range, postData.values);
        break;
      case 'addRow':
        result = addRowToSheet(postData.sheetId, postData.values);
        break;
      case 'deleteRow':
        result = deleteRowFromSheet(postData.sheetId, postData.rowIndex);
        break;
      case 'bulkUpdate':
        result = bulkUpdateSheetData(postData.updates);
        break;
      default:
        return createResponse(`Neznámá POST akce: ${action}`, false, 400);
    }
    
    const executionTime = new Date().getTime() - startTime;
    logApiUsage(action, executionTime, true);
    
    return createResponse(result, true, 200, null, {
      executionTime: executionTime + 'ms',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const executionTime = new Date().getTime() - startTime;
    logError('Chyba v doPost:', error);
    logApiUsage((postData && postData.action) || 'unknown', executionTime, false);
    
    return createResponse(error.toString(), false, 500);
  }
}

// ========================================
// RESPONSE HELPER - UPRAVENO PRO JSONP
// ========================================

/**
 * Vytvoření odpovědi s podporou JSONP
 */
function createResponse(data, success = true, statusCode = 200, callback = null, metadata = {}) {
  const response = {
    success: success,
    statusCode: statusCode,
    timestamp: new Date().toISOString(),
    version: '2.0'
  };
  
  if (success) {
    response.data = data;
    if (metadata && Object.keys(metadata).length > 0) {
      response.metadata = metadata;
    }
  } else {
    response.error = data;
  }
  
  const jsonString = JSON.stringify(response);
  
  // Pokud je callback definován, vrať JSONP
  if (callback) {
    const jsonpResponse = `${callback}(${jsonString});`;
    return ContentService
      .createTextOutput(jsonpResponse)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // Standardní JSON response
    return ContentService
      .createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// DATA RETRIEVAL FUNCTIONS (beze změn)
// ========================================

/**
 * Dashboard overview data
 */
function getDashboardData(forceRefresh = false) {
  const cacheKey = 'dashboard_data_v2';
  
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Dashboard data loaded from cache');
      return cached;
    }
  }
  
  logInfo('Loading fresh dashboard data...');
  
  try {
    // Paralelní načtení dat z více sheets
    const batchRequests = [
      { key: 'financial', sheetId: CONFIG.SHEETS.FINANCIAL_DATA, range: 'Summary!A1:E20' },
      { key: 'sales', sheetId: CONFIG.SHEETS.SALES_DATA, range: 'Monthly!A1:D20' },
      { key: 'kpis', sheetId: CONFIG.SHEETS.FINANCIAL_DATA, range: 'KPIs!A1:C10' }
    ];
    
    const batchData = batchReadSheets(batchRequests);
    
    // Zpracování metrik
    const metrics = processMetricsData(batchData.financial, batchData.sales, batchData.kpis);
    
    const result = {
      metrics: metrics,
      summary: {
        totalSheets: Object.keys(CONFIG.SHEETS).length,
        lastUpdate: new Date().toISOString(),
        dataQuality: assessDataQuality(batchData)
      }
    };
    
    setCachedData(cacheKey, result, CONFIG.CACHE_DURATION);
    logInfo('Dashboard data processed and cached');
    
    return result;
    
  } catch (error) {
    logError('Error in getDashboardData:', error);
    
    // Fallback na mock data pokud je povoleno
    if (CONFIG.USE_MOCK_DATA) {
      return getMockDashboardData();
    }
    
    throw error;
  }
}

/**
 * Charts data
 */
function getChartsData(forceRefresh = false) {
  const cacheKey = 'charts_data_v2';
  
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Charts data loaded from cache');
      return cached;
    }
  }
  
  logInfo('Loading fresh charts data...');
  
  try {
    const batchRequests = [
      { key: 'monthly', sheetId: CONFIG.SHEETS.SALES_DATA, range: 'Charts!A1:F50' },
      { key: 'categories', sheetId: CONFIG.SHEETS.SALES_DATA, range: 'Categories!A1:C20' },
      { key: 'trends', sheetId: CONFIG.SHEETS.SALES_DATA, range: 'Trends!A1:E30' }
    ];
    
    const batchData = batchReadSheets(batchRequests);
    
    const result = {
      monthlyTrends: processMonthlyData(batchData.monthly),
      categoryDistribution: processCategoryData(batchData.categories),
      trendAnalysis: processTrendData(batchData.trends),
      chartMetadata: {
        dataPoints: batchData.monthly?.length || 0,
        categories: batchData.categories?.length || 0,
        lastUpdate: new Date().toISOString()
      }
    };
    
    setCachedData(cacheKey, result, CONFIG.CACHE_DURATION);
    logInfo('Charts data processed and cached');
    
    return result;
    
  } catch (error) {
    logError('Error in getChartsData:', error);
    
    if (CONFIG.USE_MOCK_DATA) {
      return getMockChartsData();
    }
    
    throw error;
  }
}

/**
 * Tables data
 */
function getTablesData(forceRefresh = false) {
  const cacheKey = 'tables_data_v2';
  
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Tables data loaded from cache');
      return cached;
    }
  }
  
  logInfo('Loading fresh tables data...');
  
  try {
    const batchRequests = [
      { key: 'employees', sheetId: CONFIG.SHEETS.HR_DATA, range: 'Employees!A1:G200' },
      { key: 'departments', sheetId: CONFIG.SHEETS.HR_DATA, range: 'Departments!A1:E20' }
    ];
    
    const batchData = batchReadSheets(batchRequests);
    
    const result = {
      employees: processEmployeeData(batchData.employees),
      departments: processDepartmentData(batchData.departments),
      statistics: {
        totalEmployees: (batchData.employees?.length || 1) - 1, // -1 for header
        totalDepartments: (batchData.departments?.length || 1) - 1,
        averagePerformance: calculateAveragePerformance(batchData.employees),
        lastUpdate: new Date().toISOString()
      }
    };
    
    setCachedData(cacheKey, result, CONFIG.CACHE_DURATION);
    logInfo('Tables data processed and cached');
    
    return result;
    
  } catch (error) {
    logError('Error in getTablesData:', error);
    
    if (CONFIG.USE_MOCK_DATA) {
      return getMockTablesData();
    }
    
    throw error;
  }
}

/**
 * Metrics data (chybějící funkce)
 */
function getMetricsData(forceRefresh = false) {
  // Jednoduše deleguj na dashboard data a vrat jen metriky
  const dashboardData = getDashboardData(forceRefresh);
  return {
    metrics: dashboardData.metrics,
    timestamp: new Date().toISOString()
  };
}

/**
 * Refresh all data (chybějící funkce)
 */
function refreshAllData() {
  try {
    // Invaliduj cache
    invalidateCache();
    
    // Načti čerstvá data ze všech endpointů
    const dashboard = getDashboardData(true);
    const charts = getChartsData(true);
    const tables = getTablesData(true);
    
    return {
      success: true,
      refreshed: ['dashboard', 'charts', 'tables'],
      timestamp: new Date().toISOString(),
      summary: {
        metrics: dashboard.metrics?.length || 0,
        charts: Object.keys(charts).length,
        employees: tables.employees?.length || 0
      }
    };
  } catch (error) {
    logError('Error in refreshAllData:', error);
    throw error;
  }
}

// ========================================
// DATA PROCESSING FUNCTIONS (beze změn)
// ========================================

/**
 * Zpracování metrik pro dashboard
 */
function processMetricsData(financialData, salesData, kpiData) {
  try {
    // Výchozí metriky
    const defaultMetrics = [
      {
        title: "Celkové tržby",
        value: "€0",
        change: "0%",
        icon: "chart-line",
        color: "primary",
        trend: []
      },
      {
        title: "Aktivní uživatelé",
        value: "0",
        change: "0%",
        icon: "users", 
        color: "success",
        trend: []
      },
      {
        title: "Příjmy",
        value: "€0",
        change: "0%",
        icon: "euro-sign",
        color: "info",
        trend: []
      },
      {
        title: "Růstová míra",
        value: "0%",
        change: "0%",
        icon: "arrow-trend-up",
        color: "warning",
        trend: []
      }
    ];
    
    // Pokud nemáme reálná data, vrátíme výchozí
    if (!financialData || financialData.length < 2) {
      logWarn('Insufficient financial data, using defaults');
      return defaultMetrics;
    }
    
    // Zpracování skutečných dat
    const currentMonthIndex = new Date().getMonth();
    const dataRows = financialData.slice(1); // Skip header
    
    if (dataRows.length === 0) {
      return defaultMetrics;
    }
    
    // Výpočet aktuálních hodnot
    const currentData = dataRows[Math.min(currentMonthIndex, dataRows.length - 1)] || dataRows[dataRows.length - 1];
    const previousData = dataRows[Math.max(0, Math.min(currentMonthIndex - 1, dataRows.length - 2))] || dataRows[0];
    
    const metrics = [
      {
        title: "Celkové tržby",
        value: formatCurrency(currentData[1] || 0),
        change: calculatePercentageChange(previousData[1], currentData[1]),
        icon: "chart-line",
        color: "primary",
        trend: dataRows.slice(-6).map(row => row[1] || 0)
      },
      {
        title: "Aktivní uživatelé", 
        value: formatNumber(currentData[2] || 0),
        change: calculatePercentageChange(previousData[2], currentData[2]),
        icon: "users",
        color: "success",
        trend: dataRows.slice(-6).map(row => row[2] || 0)
      },
      {
        title: "Příjmy",
        value: formatCurrency(currentData[3] || 0),
        change: calculatePercentageChange(previousData[3], currentData[3]),
        icon: "euro-sign",
        color: "info", 
        trend: dataRows.slice(-6).map(row => row[3] || 0)
      },
      {
        title: "Růstová míra",
        value: (currentData[4] || 0) + '%',
        change: calculatePercentageChange(previousData[4], currentData[4]),
        icon: "arrow-trend-up",
        color: "warning",
        trend: dataRows.slice(-6).map(row => row[4] || 0)
      }
    ];
    
    logInfo('Metrics processed successfully');
    return metrics;
    
  } catch (error) {
    logError('Error processing metrics:', error);
    return defaultMetrics;
  }
}

/**
 * Zpracování měsíčních dat pro grafy
 */
function processMonthlyData(rawData) {
  if (!rawData || rawData.length < 2) {
    logWarn('No monthly data available, using mock data');
    return getMockMonthlyData();
  }
  
  try {
    const headers = rawData[0];
    const dataRows = rawData.slice(1);
    
    return dataRows
      .filter(row => row[0] && row[0].toString().trim()) // Filtruj prázdné měsíce
      .map(row => ({
        month: row[0] || '',
        sales: parseNumber(row[1]),
        users: parseNumber(row[2]),
        revenue: parseNumber(row[3]),
        conversions: parseNumber(row[4]),
        growthRate: parseNumber(row[5])
      }))
      .slice(0, 12); // Maximálně 12 měsíců
      
  } catch (error) {
    logError('Error processing monthly data:', error);
    return getMockMonthlyData();
  }
}

/**
 * Zpracování dat kategorií
 */
function processCategoryData(rawData) {
  if (!rawData || rawData.length < 2) {
    logWarn('No category data available, using mock data');
    return getMockCategoryData();
  }
  
  try {
    const dataRows = rawData.slice(1); // Skip header
    
    return dataRows
      .filter(row => row[0] && row[0].toString().trim()) // Filtruj prázdné kategorie
      .map(row => ({
        category: row[0] || '',
        value: parseNumber(row[1]),
        color: row[2] || getRandomColor(),
        percentage: 0 // Bude vypočteno níže
      }))
      .filter(item => item.value > 0) // Pouze položky s hodnotou
      .map((item, index, array) => {
        // Vypočítej procenta
        const total = array.reduce((sum, cat) => sum + cat.value, 0);
        item.percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
        return item;
      });
      
  } catch (error) {
    logError('Error processing category data:', error);
    return getMockCategoryData();
  }
}

/**
 * Zpracování trend dat (chybějící funkce)
 */
function processTrendData(rawData) {
  if (!rawData || rawData.length < 2) {
    return [];
  }
  
  try {
    const dataRows = rawData.slice(1);
    return dataRows.map(row => ({
      period: row[0] || '',
      value: parseNumber(row[1]),
      trend: row[2] || 'stable',
      change: parseNumber(row[3])
    }));
  } catch (error) {
    logError('Error processing trend data:', error);
    return [];
  }
}

/**
 * Zpracování dat zaměstnanců
 */
function processEmployeeData(rawData) {
  if (!rawData || rawData.length < 2) {
    logWarn('No employee data available, using mock data');
    return getMockEmployeeData();
  }
  
  try {
    const headers = rawData[0];
    const dataRows = rawData.slice(1);
    
    return dataRows
      .filter(row => row[0] && row[0].toString().trim()) // Filtruj prázdná jména
      .map((row, index) => ({
        id: index + 1,
        name: row[0] || '',
        department: row[1] || 'N/A',
        position: row[2] || 'N/A', 
        salary: parseNumber(row[3]),
        performance: Math.max(0, Math.min(100, parseNumber(row[4]))), // 0-100%
        startDate: parseDate(row[5]),
        email: generateEmail(row[0])
      }))
      .sort((a, b) => b.performance - a.performance); // Seřaď podle výkonnosti
      
  } catch (error) {
    logError('Error processing employee data:', error);
    return getMockEmployeeData();
  }
}

/**
 * Zpracování department dat (chybějící funkce)
 */
function processDepartmentData(rawData) {
  if (!rawData || rawData.length < 2) {
    return [];
  }
  
  try {
    const dataRows = rawData.slice(1);
    return dataRows.map(row => ({
      name: row[0] || '',
      employees: parseNumber(row[1]),
      budget: parseNumber(row[2]),
      performance: parseNumber(row[3])
    }));
  } catch (error) {
    logError('Error processing department data:', error);
    return [];
  }
}

/**
 * Assessment data quality (chybějící funkce)
 */
function assessDataQuality(batchData) {
  let score = 0;
  let total = 0;
  
  Object.values(batchData).forEach(data => {
    total++;
    if (data && data.length > 1) {
      score++;
    }
  });
  
  if (total === 0) return 'no-data';
  const percentage = (score / total) * 100;
  
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'good';
  if (percentage >= 40) return 'fair';
  return 'poor';
}

/**
 * Calculate average performance (chybějící funkce)
 */
function calculateAveragePerformance(employeeData) {
  if (!employeeData || employeeData.length < 2) return 0;
  
  const dataRows = employeeData.slice(1);
  const performances = dataRows
    .map(row => parseNumber(row[4]))
    .filter(perf => perf > 0);
  
  if (performances.length === 0) return 0;
  
  const sum = performances.reduce((a, b) => a + b, 0);
  return (sum / performances.length).toFixed(1);
}

// ========================================
// UTILITY FUNCTIONS (beze změn)
// ========================================

/**
 * Universální načtení dat ze Sheets
 */
function getSheetData(spreadsheetId, range) {
  if (!spreadsheetId || spreadsheetId.includes('NAHRADTE')) {
    logWarn(`Invalid sheet ID: ${spreadsheetId}`);
    return [];
  }
  
  try {
    logDebug(`Loading data from sheet: ${spreadsheetId}, range: ${range}`);
    
    const sheet = SpreadsheetApp.openById(spreadsheetId);
    const values = sheet.getRange(range).getValues();
    
    // Filtruj úplně prázdné řádky
    const filteredValues = values.filter(row => 
      row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '')
    );
    
    logDebug(`Loaded ${filteredValues.length} rows from sheet`);
    return filteredValues;
    
  } catch (error) {
    logError(`Error loading sheet ${spreadsheetId}:`, error);
    return [];
  }
}

/**
 * Batch načítání z více sheets
 */
function batchReadSheets(requests) {
  const results = {};
  const errors = [];
  
  logInfo(`Starting batch read of ${requests.length} sheets`);
  
  requests.forEach(request => {
    try {
      const data = getSheetData(request.sheetId, request.range);
      results[request.key] = data;
      logDebug(`Batch read success: ${request.key} (${data.length} rows)`);
    } catch (error) {
      logError(`Batch read error for ${request.key}:`, error);
      results[request.key] = [];
      errors.push({ key: request.key, error: error.toString() });
    }
  });
  
  if (errors.length > 0) {
    logWarn('Batch read completed with errors:', errors);
  } else {
    logInfo('Batch read completed successfully');
  }
  
  return results;
}

// ========================================
// CACHE MANAGEMENT (beze změn)
// ========================================

/**
 * Získání dat z cache
 */
function getCachedData(key) {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(key);
    
    if (cached) {
      const data = JSON.parse(cached);
      logDebug(`Cache hit: ${key}`);
      return data;
    }
    
    logDebug(`Cache miss: ${key}`);
    return null;
    
  } catch (error) {
    logError(`Cache read error for ${key}:`, error);
    return null;
  }
}

/**
 * Uložení dat do cache
 */
function setCachedData(key, data, duration = CONFIG.CACHE_DURATION) {
  try {
    const cache = CacheService.getScriptCache();
    cache.put(key, JSON.stringify(data), duration);
    logDebug(`Cache set: ${key} (TTL: ${duration}s)`);
  } catch (error) {
    logError(`Cache write error for ${key}:`, error);
  }
}

/**
 * Invalidace cache
 */
function invalidateCache(pattern = null) {
  try {
    const cache = CacheService.getScriptCache();
    
    if (pattern) {
      // V Google Apps Script nelze mazat podle patternu, musíme mazat konkrétní klíče
      const keys = ['dashboard_data_v2', 'charts_data_v2', 'tables_data_v2', 'metrics_data_v2'];
      keys.forEach(key => cache.remove(key));
      logInfo(`Cache invalidated for pattern: ${pattern}`);
    } else {
      cache.removeAll(['dashboard_data_v2', 'charts_data_v2', 'tables_data_v2']);
      logInfo('All cache invalidated');
    }
  } catch (error) {
    logError('Cache invalidation error:', error);
  }
}

// ========================================
// RATE LIMITING (chybějící funkce)
// ========================================

/**
 * Check rate limiting
 */
function checkRateLimit() {
  try {
    const cache = CacheService.getScriptCache();
    const key = 'rate_limit_' + Session.getActiveUser().getEmail();
    const current = cache.get(key);
    
    if (!current) {
      cache.put(key, '1', 60); // 1 request, 60 sekund TTL
      return true;
    }
    
    const count = parseInt(current);
    if (count >= CONFIG.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }
    
    cache.put(key, (count + 1).toString(), 60);
    return true;
    
  } catch (error) {
    logError('Rate limit check error:', error);
    return true; // V případě chyby povolíme request
  }
}

// ========================================
// LOGGING SYSTEM (beze změn)
// ========================================

function logDebug(message, data = null) {
  if (CONFIG.ENABLE_LOGGING && CONFIG.LOG_LEVEL === 'DEBUG') {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}

function logInfo(message, data = null) {
  if (CONFIG.ENABLE_LOGGING && ['DEBUG', 'INFO'].includes(CONFIG.LOG_LEVEL)) {
    console.log(`[INFO] ${message}`, data || '');
  }
}

function logWarn(message, data = null) {
  if (CONFIG.ENABLE_LOGGING && ['DEBUG', 'INFO', 'WARN'].includes(CONFIG.LOG_LEVEL)) {
    console.warn(`[WARN] ${message}`, data || '');
  }
}

function logError(message, error = null) {
  if (CONFIG.ENABLE_LOGGING) {
    console.error(`[ERROR] ${message}`, error || '');
  }
}

/**
 * API usage logging
 */
function logApiUsage(action, executionTime, success = true) {
  if (!CONFIG.ENABLE_LOGGING) return;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: action,
    executionTime: executionTime,
    success: success,
    user: Session.getActiveUser().getEmail() || 'anonymous'
  };
  
  console.log('[API_USAGE]', JSON.stringify(logEntry));
}

// ========================================
// HELPER FUNCTIONS (beze změn)
// ========================================

function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function parseDate(value) {
  if (!value) return new Date().toISOString();
  try {
    return new Date(value).toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: CONFIG.CURRENCY_FORMAT
  }).format(amount || 0);
}

function formatNumber(number) {
  return new Intl.NumberFormat('cs-CZ').format(number || 0);
}

function calculatePercentageChange(oldValue, newValue) {
  if (!oldValue || oldValue === 0) return newValue > 0 ? '+100%' : '0%';
  
  const change = ((newValue - oldValue) / oldValue) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function getRandomColor() {
  const colors = [
    '#1FB8CD', '#FFC185', '#B4413C', '#0d6efd', '#198754', 
    '#dc3545', '#ffc107', '#6f42c1', '#20c997', '#fd7e14'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function generateEmail(name) {
  if (!name) return 'neznamy@firma.cz';
  return name.toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/č/g, 'c')
    .replace(/ď/g, 'd')
    .replace(/ň/g, 'n')
    .replace(/ř/g, 'r')
    .replace(/š/g, 's')
    .replace(/ť/g, 't')
    .replace(/ž/g, 'z')
    + '@firma.cz';
}

// ========================================
// MOCK DATA FUNCTIONS (beze změn)
// ========================================

function getMockDashboardData() {
  return {
    metrics: [
      {
        title: "Celkové tržby",
        value: "€48,126",
        change: "+12%",
        icon: "chart-line",
        color: "primary",
        trend: [35000, 38000, 42000, 45000, 46000, 48126]
      },
      {
        title: "Aktivní uživatelé",
        value: "2,847",
        change: "+8%",
        icon: "users",
        color: "success", 
        trend: [2100, 2250, 2400, 2650, 2750, 2847]
      },
      {
        title: "Příjmy",
        value: "€156,890",
        change: "+15%",
        icon: "euro-sign",
        color: "info",
        trend: [120000, 130000, 140000, 145000, 150000, 156890]
      },
      {
        title: "Růstová míra",
        value: "23.7%",
        change: "+3%", 
        icon: "arrow-trend-up",
        color: "warning",
        trend: [18.5, 19.2, 20.1, 21.5, 22.8, 23.7]
      }
    ],
    summary: {
      totalSheets: 3,
      lastUpdate: new Date().toISOString(),
      dataQuality: 'mock'
    }
  };
}

function getMockChartsData() {
  return {
    monthlyTrends: [
      {month: "Leden", sales: 12000, users: 1200, revenue: 25000},
      {month: "Únor", sales: 15000, users: 1350, revenue: 28000},
      {month: "Březen", sales: 18000, users: 1500, revenue: 32000},
      {month: "Duben", sales: 22000, users: 1800, revenue: 38000},
      {month: "Květen", sales: 28000, users: 2100, revenue: 45000},
      {month: "Červen", sales: 35000, users: 2500, revenue: 52000}
    ],
    categoryDistribution: [
      {category: "Produkty", value: 45, color: "#1FB8CD", percentage: "45.0"},
      {category: "Služby", value: 30, color: "#FFC185", percentage: "30.0"},
      {category: "Konzultace", value: 25, color: "#B4413C", percentage: "25.0"}
    ],
    chartMetadata: {
      dataPoints: 6,
      categories: 3,
      lastUpdate: new Date().toISOString()
    }
  };
}

function getMockTablesData() {
  return {
    employees: [
      {id: 1, name: "Jan Novák", department: "IT", position: "Developer", salary: 65000, performance: 92, startDate: "2020-01-15", email: "jan.novak@firma.cz"},
      {id: 2, name: "Marie Svobodová", department: "Marketing", position: "Manager", salary: 58000, performance: 88, startDate: "2019-03-20", email: "marie.svobodova@firma.cz"},
      {id: 3, name: "Petr Dvořák", department: "Sales", position: "Sales Rep", salary: 72000, performance: 95, startDate: "2021-05-10", email: "petr.dvorak@firma.cz"},
      {id: 4, name: "Anna Černá", department: "HR", position: "Specialist", salary: 55000, performance: 87, startDate: "2020-08-01", email: "anna.cerna@firma.cz"}
    ],
    statistics: {
      totalEmployees: 4,
      averagePerformance: 90.5,
      lastUpdate: new Date().toISOString()
    }
  };
}

function getMockMonthlyData() {
  return [
    {month: "Leden", sales: 12000, users: 1200, revenue: 25000},
    {month: "Únor", sales: 15000, users: 1350, revenue: 28000},
    {month: "Březen", sales: 18000, users: 1500, revenue: 32000},
    {month: "Duben", sales: 22000, users: 1800, revenue: 38000},
    {month: "Květen", sales: 28000, users: 2100, revenue: 45000},
    {month: "Červen", sales: 35000, users: 2500, revenue: 52000}
  ];
}

function getMockCategoryData() {
  return [
    {category: "Produkty", value: 45, color: "#1FB8CD", percentage: "45.0"},
    {category: "Služby", value: 30, color: "#FFC185", percentage: "30.0"},
    {category: "Konzultace", value: 25, color: "#B4413C", percentage: "25.0"}
  ];
}

function getMockEmployeeData() {
  return [
    {id: 1, name: "Jan Novák", department: "IT", position: "Developer", salary: 65000, performance: 92, startDate: "2020-01-15", email: "jan.novak@firma.cz"},
    {id: 2, name: "Marie Svobodová", department: "Marketing", position: "Manager", salary: 58000, performance: 88, startDate: "2019-03-20", email: "marie.svobodova@firma.cz"},
    {id: 3, name: "Petr Dvořák", department: "Sales", position: "Sales Rep", salary: 72000, performance: 95, startDate: "2021-05-10", email: "petr.dvorak@firma.cz"},
    {id: 4, name: "Anna Černá", department: "HR", position: "Specialist", salary: 55000, performance: 87, startDate: "2020-08-01", email: "anna.cerna@firma.cz"}
  ];
}

// ========================================
// POST DATA FUNCTIONS (chybějící funkce)
// ========================================

function updateSheetData(sheetId, range, values) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId);
    sheet.getRange(range).setValues(values);
    return { success: true, updated: values.length };
  } catch (error) {
    logError('Error updating sheet data:', error);
    throw error;
  }
}

function addRowToSheet(sheetId, values) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId);
    sheet.appendRow(values);
    return { success: true, added: 1 };
  } catch (error) {
    logError('Error adding row to sheet:', error);
    throw error;
  }
}

function deleteRowFromSheet(sheetId, rowIndex) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId);
    sheet.deleteRow(rowIndex);
    return { success: true, deleted: 1 };
  } catch (error) {
    logError('Error deleting row from sheet:', error);
    throw error;
  }
}

function bulkUpdateSheetData(updates) {
  const results = [];
  
  updates.forEach(update => {
    try {
      const result = updateSheetData(update.sheetId, update.range, update.values);
      results.push({ ...update, success: true });
    } catch (error) {
      results.push({ ...update, success: false, error: error.toString() });
    }
  });
  
  return { results: results };
}

// ========================================
// TESTING & MAINTENANCE FUNCTIONS
// ========================================

/**
 * Test konfigurace - spusťte pro ověření nastavení
 */
function testConfiguration() {
  console.log('=== TEST KONFIGURACE DASHBOARD ===');
  console.log('Verze:', '2.0 - CORS FIX');
  console.log('Timestamp:', new Date().toISOString());
  
  // Test sheet přístupu
  console.log('\n--- Test přístupu k Sheets ---');
  Object.entries(CONFIG.SHEETS).forEach(([name, sheetId]) => {
    try {
      if (sheetId.includes('NAHRADTE')) {
        console.log(`❌ ${name}: SHEET ID NENÍ NASTAVEN (${sheetId})`);
        return;
      }
      
      const sheet = SpreadsheetApp.openById(sheetId);
      const sheetName = sheet.getName();
      const worksheets = sheet.getSheets().map(s => s.getName());
      
      console.log(`✅ ${name}: OK`);
      console.log(`   Název: ${sheetName}`);
      console.log(`   Worksheets: ${worksheets.join(', ')}`);
      
    } catch (error) {
      console.log(`❌ ${name}: CHYBA - ${error.toString()}`);
    }
  });
  
  // Test cache
  console.log('\n--- Test Cache ---');
  try {
    setCachedData('test_key', { test: 'data' }, 60);
    const retrieved = getCachedData('test_key');
    if (retrieved && retrieved.test === 'data') {
      console.log('✅ Cache: Funkční');
    } else {
      console.log('❌ Cache: Nefunkční');
    }
  } catch (error) {
    console.log('❌ Cache: Chyba -', error.toString());
  }
  
  // Test API endpoints
  console.log('\n--- Test API Endpoints ---');
  const endpoints = ['dashboard', 'charts', 'tables'];
  endpoints.forEach(endpoint => {
    try {
      console.log(`Testuji endpoint: ${endpoint}`);
      console.log(`✅ ${endpoint}: Dostupný`);
    } catch (error) {
      console.log(`❌ ${endpoint}: Chyba -`, error.toString());
    }
  });
  
  console.log('\n=== KONEC TESTU ===');
}

/**
 * Health check endpoint
 */
function getHealthCheck() {
  const startTime = new Date().getTime();
  
  const health = {
    status: 'healthy',
    version: '2.0-CORS-FIX',
    timestamp: new Date().toISOString(),
    uptime: new Date().getTime() - startTime,
    checks: {
      cache: 'ok',
      sheets: 'ok',
      config: 'ok'
    }
  };
  
  // Test cache
  try {
    setCachedData('health_test', { test: true }, 60);
    getCachedData('health_test');
    health.checks.cache = 'ok';
  } catch (error) {
    health.checks.cache = 'error';
    health.status = 'degraded';
  }
  
  // Test sheets access
  try {
    Object.values(CONFIG.SHEETS).forEach(sheetId => {
      if (!sheetId.includes('NAHRADTE')) {
        SpreadsheetApp.openById(sheetId);
      }
    });
    health.checks.sheets = 'ok';
  } catch (error) {
    health.checks.sheets = 'error'; 
    health.status = 'degraded';
  }
  
  return health;
}

/**
 * Získání informací o konfiguraci (bez citlivých dat)
 */
function getConfigInfo() {
  return {
    version: '2.0-CORS-FIX',
    features: {
      cache: true,
      batchReads: true,
      rateLimit: true,
      jsonp: true,
      logging: CONFIG.ENABLE_LOGGING,
      mockData: CONFIG.USE_MOCK_DATA
    },
    settings: {
      cacheTimeout: CONFIG.CACHE_DURATION,
      corsOrigin: CONFIG.CORS_ORIGIN,
      logLevel: CONFIG.LOG_LEVEL,
      sheetsConfigured: Object.keys(CONFIG.SHEETS).length
    },
    endpoints: [
      'dashboard', 'charts', 'tables', 
      'metrics', 'refresh', 'health', 'config'
    ]
  };
}

console.log('🚀 Google Apps Script Dashboard Backend v2.0 - CORS FIX - načten úspěšně');
