class UserConfig {
  static KEY = 'dashboardModulesConfig';

  static load() {
    const saved = localStorage.getItem(this.KEY);
    return saved ? JSON.parse(saved) : {
      active: ['metricRevenue','metricUsers','chartMonthly','tableEmployees'],
      order: ['metricRevenue','metricUsers','chartMonthly','tableEmployees'],
      params: {
        metricRevenue:{color:'primary'},
        metricUsers:{color:'success'},
        chartMonthly:{type:'line'},
        tableEmployees:{itemsPerPage:10}
      },
      gasUrl: ''
    };
  }

  static save(cfg) {
    localStorage.setItem(this.KEY, JSON.stringify(cfg));
  }
}
