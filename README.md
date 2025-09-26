# 📊 Google Sheets Dashboard

Moderní, responzivní HTML dashboard aplikace pro zobrazování dat z Google Sheets v reálném čase s pokročilými funkcemi pro analýzu a vizualizaci dat.

![Dashboard Preview](https://via.placeholder.com/800x400/0d6efd/ffffff?text=Dashboard+Preview)

## ✨ Hlavní funkce

### 🚀 Real-time Data
- **Automatické obnovování** dat z Google Sheets
- **Smart caching** pro optimální výkon
- **Error handling** s automatickými opakovanými pokusy
- **Progress tracking** při načítání dat

### 🎨 Moderní UI/UX
- **Bootstrap 5** responzivní design
- **Dark/Light theme** přepínání
- **Animace a přechody** pro lepší UX
- **Mobile-first** approach

### 📈 Pokročilé vizualizace
- **Chart.js** interaktivní grafy
- **Multiple chart types** - Line, Bar, Doughnut, Area
- **Real-time updates** grafů
- **Exportovatelné** grafy

### 📋 Inteligentní tabulky
- **Vyhledávání a filtrování** v reálném čase
- **Sortování podle sloupců**
- **Pagination** pro velké datasety
- **Responsive design** pro mobily

## 🛠️ Technologie

### Frontend Stack
- **HTML5** + semantic markup
- **CSS3** + CSS Grid/Flexbox
- **JavaScript ES6+** + async/await
- **Bootstrap 5.3** + custom CSS variables
- **Chart.js 4.4** pro grafy
- **Font Awesome** ikony

### Backend Stack
- **Google Apps Script** serverless backend
- **Google Sheets API** pro data access
- **Built-in caching** systém
- **RESTful API** design

## 📁 Struktura projektu

```
google-sheets-dashboard/
├── index.html                 # Hlavní HTML soubor
├── assets/
│   ├── css/
│   │   └── style.css         # Hlavní CSS styly
│   ├── js/
│   │   └── dashboard.js      # JavaScript aplikace
│   └── images/               # Obrázky a ikony
├── gas-backend.js           # Google Apps Script backend
├── package.json             # NPM konfigurace
├── .gitignore              # Git ignore pravidla
├── LICENSE                 # MIT licence
├── README.md              # Tato dokumentace
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions CI/CD
├── docs/                  # Dokumentace
│   ├── setup-guide.md    # Detailní návod
│   ├── api-docs.md       # API dokumentace
│   └── screenshots/      # Screenshoty
└── tests/                # Testy
    └── basic-tests.js   # Základní testy
```

## 🚀 Rychlé spuštění

### 1️⃣ Klonování repozitáře

```bash
git clone https://github.com/username/google-sheets-dashboard.git
cd google-sheets-dashboard
npm install
```

### 2️⃣ Nastavení Google Apps Script

1. **Vytvořte nový projekt**
   - Jděte na [script.google.com](https://script.google.com)
   - Klikněte "New Project"
   - Přejmenujte na "Dashboard Backend"

2. **Vložte backend kód**
   - Smažte výchozí kód
   - Zkopírujte obsah `gas-backend.js`
   - Vložte do editoru

3. **Upravte konfiguraci**
   ```javascript
   const CONFIG = {
     SHEETS: {
       FINANCIAL_DATA: 'YOUR_SHEET_ID_HERE',
       SALES_DATA: 'YOUR_SHEET_ID_HERE', 
       HR_DATA: 'YOUR_SHEET_ID_HERE'
     }
   };
   ```

4. **Nasaďte Web App**
   - Deploy → New deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Deploy & copy URL

### 3️⃣ Příprava Google Sheets

Vytvořte 3 Google Sheets s následující strukturou:

#### 📊 Sheet 1: Financial Data
```
Tab "Summary":
A1: Měsíc    | B1: Tržby   | C1: Uživatelé | D1: Příjmy  | E1: Růst%
A2: Leden    | B2: 50000   | C2: 1200      | D2: 25000   | E2: 12.5
A3: Únor     | B3: 65000   | C3: 1350      | D3: 28000   | E3: 15.2
...
```

#### 📈 Sheet 2: Sales Data  
```
Tab "Charts": 
A1: Měsíc    | B1: Prodeje | C1: Uživatelé | D1: Příjmy
A2: Leden    | B2: 12000   | C2: 1200      | D2: 25000
A3: Únor     | B3: 15000   | C3: 1350      | D3: 28000
...

Tab "Categories":
A1: Kategorie | B1: Hodnota | C1: Barva
A2: Produkty  | B2: 45       | C2: #1FB8CD  
A3: Služby    | B3: 30       | C3: #FFC185
A4: Podpora   | B4: 25       | C4: #B4413C
```

#### 👥 Sheet 3: HR Data
```  
Tab "Employees":
A1: Jméno      | B1: Oddělení | C1: Pozice | D1: Plat | E1: Výkon
A2: Jan Novák  | B2: IT       | C2: Dev    | D2: 65000| E2: 92
A3: Anna Černá | B3: Marketing| C3: Manager| D3: 58000| E3: 88
...
```

Nastavte každý sheet na "Anyone with link can view" a zkopírujte jejich ID.

### 4️⃣ Spuštění aplikace

```bash
# Lokální development server
npm run dev

# Nebo jednoduché Python server
npm run serve

# Build pro produkci
npm run build
```

### 5️⃣ Konfigurace dashboard

1. Povolte GitHub Pages (Settings → Pages → Source: main branch)
2. Otevřete https://USERNAME.github.io/google-sheets-dashboard
3. Stiskněte Ctrl+Alt+C pro konfiguraci
4. Vložte GAS URL a uložte

## ⚙️ Konfigurace

### Frontend konfigurace

Dashboard se konfiguruje přes UI nebo localStorage:

```javascript
// Programatická konfigurace
localStorage.setItem('dashboardConfig', JSON.stringify({
  gasUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  refreshInterval: 30,
  enableNotifications: true
}));
```

### Backend konfigurace

Upravte konstanty v `gas-backend.js`:

```javascript
const CONFIG = {
  SHEETS: {
    FINANCIAL_DATA: 'your-sheet-id',
    SALES_DATA: 'your-sheet-id',
    HR_DATA: 'your-sheet-id'
  },
  CACHE_DURATION: 1800, // 30 minut
  ENABLE_LOGGING: true,
  USE_MOCK_DATA: false // Pro testování
};
```

## 📊 Datové formáty

Dashboard očekává specifické formáty dat pro optimální funkčnost:

### Číselné hodnoty
- Používejte čísla místo textu: `50000` místo `"50 000 Kč"`
- Procenta jako čísla: `0.25` místo `"25%"`

### Datumy
- ISO formát: `2024-01-15` 
- Nebo Excel datum formát

### Kategorie
- Konsistentní pojmenování
- Barevné kódy v hex formátu: `#1FB8CD`

## 🔧 API dokumentace

### GET Endpoints

```
GET ?action=dashboard     # Metriky a přehled
GET ?action=charts       # Data pro grafy
GET ?action=tables       # Tabulková data
GET ?action=health       # Health check
GET ?action=config       # Konfigurace info
```

### Response formát

```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "executionTime": "245ms",
    "version": "2.0"
  }
}
```

## 🧪 Testování

### Základní testy

```bash
# Spuštění testů
npm test

# Validace HTML
npm run validate

# Lighthouse audit
npm run lighthouse
```

### Manuální testování

1. **Backend test**
   ```javascript
   // V Google Apps Script editoru:
   testConfiguration();
   ```

2. **Frontend debug**
   ```javascript
   // V browser console:
   window.debugDashboard.data()     // Zobrazí načtená data
   window.debugDashboard.reload()   // Reload dat
   window.debugDashboard.config()   // Otevře konfiguraci
   ```

## 🚀 Nasazení

### GitHub Pages

```bash
# Automatické nasazení
npm run deploy

# Nebo manuálně
git add .
git commit -m "Update dashboard"
git push origin main
```

### Vlastní hosting

```bash
# Build pro produkci
npm run build

# Upload dist/ folder na server
rsync -av dist/ user@server:/path/to/web/
```

## 🛠️ Development

### Lokální vývoj

```bash
# Start dev server
npm run dev

# Sledování změn v souborech
npm run watch

# Formátování kódu
npm run format

# Linting
npm run lint
```

### Přidání nových funkcí

1. **Nová metrika**
   ```javascript
   // V gas-backend.js - processMetricsData():
   {
     title: "Nová metrika",
     value: "123",
     change: "+5%",
     icon: "star",
     color: "success"
   }
   ```

2. **Nový graf**
   ```javascript
   // V dashboard.js:
   renderCustomChart(data) {
     const ctx = document.getElementById('customChart');
     new Chart(ctx, {
       type: 'bar',
       data: data,
       options: { ... }
     });
   }
   ```

## 📱 Mobile Support

Dashboard je plně responzivní s optimalizací pro:

- 📱 **Mobile phones** (320px+)
- 📟 **Tablets** (768px+) 
- 💻 **Desktops** (1024px+)
- 🖥️ **Large screens** (1440px+)

### Mobile-specific features
- Touch-friendly navigation
- Swipe gestures pro grafy
- Optimalized table scrolling
- Responsive typography

## ♿ Accessibility

- **WCAG 2.1 AA** compliance
- **Keyboard navigation** support
- **Screen reader** optimization
- **High contrast** mode
- **Focus indicators**

## 🔒 Zabezpečení

### Best Practices
- **HTTPS** komunikace
- **Input validation** na backend úrovni
- **Rate limiting** pro API
- **CORS** konfigurace
- **Error handling** bez citlivých údajů

### Production doporučení
```javascript
// V gas-backend.js pro production:
const CONFIG = {
  CORS_ORIGIN: 'https://yourdomain.com', // Místo '*'
  ENABLE_LOGGING: false,                 // Disable v production
  MAX_REQUESTS_PER_MINUTE: 30           // Nižší limit
};
```

## 🐛 Troubleshooting

### Časté problémy

**❌ Dashboard se nenačítá**
- Zkontrolujte browser console (F12)
- Ověřte Google Apps Script URL  
- Zkontrolujte síťové připojení
- Vyčistěte browser cache

**❌ Data nejsou aktuální**  
- Použijte Refresh tlačítko
- Zkontrolujte Google Sheets oprávnění
- Ověřte cache nastavení v GAS
- Restart Google Apps Script

**❌ Chyba 403 Forbidden**
- GAS Web App: "Anyone" access
- Sheets: "Anyone with link" sharing
- Redeploy Google Apps Script
- Zkuste incognito mode

### Debug Commands
```javascript
// Browser console
window.debugDashboard.data()    // Show loaded data
window.debugDashboard.reload()  // Force refresh  
window.debugDashboard.config()  // Open configuration
localStorage.clear()            // Reset config
```

## 📈 Performance

### Optimalizace
- **Lazy loading** komponent
- **Image optimization** 
- **CSS/JS minifikace**
- **Smart caching** strategie
- **CDN** pro knihovny

### Metriky
- **First Contentful Paint** < 1.5s
- **Time to Interactive** < 3s
- **Cumulative Layout Shift** < 0.1

## 🤝 Přispívání

1. **Fork** repozitář
2. **Vytvořte feature branch**
   ```bash
   git checkout -b nova-funkce
   ```
3. **Implementujte změny**
4. **Přidejte testy**
5. **Commit & Push**
   ```bash
   git commit -am "Přidání nové funkce"
   git push origin nova-funkce
   ```
6. **Vytvořte Pull Request**

### Development guidelines
- Používejte **Prettier** pro formátování
- Dodržujte **ESLint** pravidla
- Přidejte **JSDoc** komentáře
- Napište **testy** pro nové funkce

## 📊 Roadmapa

### v2.1 (Q2 2024)
- [ ] 📱 Progressive Web App (PWA)
- [ ] 🔔 Push notifications
- [ ] 📄 Export do PDF/Excel
- [ ] 🔍 Advanced filtering

### v2.2 (Q3 2024)  
- [ ] 👥 Multi-user support
- [ ] 🔐 Authentication systém
- [ ] 📊 Custom dashboard builder
- [ ] 🤖 AI-powered insights

### v3.0 (Q4 2024)
- [ ] ⚡ Real-time WebSocket updates
- [ ] 🌐 Multi-language support
- [ ] 📈 Advanced analytics
- [ ] 🔗 Third-party integrations

## 💬 Podpora

### Komunita
- 💬 **GitHub Discussions** - Obecné otázky
- 🐛 **GitHub Issues** - Bug reporty
- 📧 **Email support** - dashboard@example.com

### Dokumentace
- 📖 **Wiki** - Detailní návody
- 🎥 **Video tutorials** - YouTube kanál
- 📝 **Blog** - Tips & tricks

## 📄 Licence

Tento projekt je licencován pod **MIT licencí**. Viz [LICENSE](LICENSE) soubor pro detaily.

```
MIT License - Svoboda používání, kopírování, úprav a distribuce
Copyright (c) 2024 Google Sheets Dashboard
```

## 🙏 Poděkování

- **Bootstrap** team za skvělý CSS framework
- **Chart.js** komunita za vizualizační knihovnu  
- **Google** za Apps Script platformu
- **GitHub** za hosting a CI/CD
- **Všem přispěvatelům** do projektu

---

<p align="center">
  <strong>Vytvořeno s ❤️ pro data-driven rozhodování</strong>
</p>

<p align="center">
  <a href="#top">⬆️ Zpět na začátek</a>
</p>