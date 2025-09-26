# 🛠️ Detailní návod na nastavení Google Sheets Dashboard

Tento návod vás provede krok za krokem nastavením a spuštěním Google Sheets Dashboard aplikace.

## 📋 Předpoklady

Před začátkem se ujistěte, že máte:

- ✅ **Google účet** pro přístup k Google Sheets a Apps Script
- ✅ **Git** nainstalovaný na počítači
- ✅ **Node.js** verze 16+ (volitelné, pro development)
- ✅ **Moderní webový prohlížeč** (Chrome, Firefox, Safari, Edge)

## 🚀 Krok za krokem instalace

### Krok 1: Stažení a nastavení repozitáře

1. **Fork nebo klonování repozitáře**
   ```bash
   # Klonování
   git clone https://github.com/username/google-sheets-dashboard.git
   cd google-sheets-dashboard
   
   # Nebo fork na GitHubu a poté klonování vašeho fork
   ```

2. **Instalace závislostí (volitelné)**
   ```bash
   # Pokud chcete používat development nástroje
   npm install
   ```

### Krok 2: Příprava Google Sheets

#### 2.1 Vytvoření Google Sheets

Vytvořte 3 nové Google Sheets s následujícími názvy:
- `Dashboard-Financial-Data`
- `Dashboard-Sales-Data`  
- `Dashboard-HR-Data`

#### 2.2 Struktura dat

**Sheet 1: Dashboard-Financial-Data**

Vytvořte tab "Summary" s daty:
```
A1: Měsíc    | B1: Tržby   | C1: Uživatelé | D1: Příjmy  | E1: Růst%
A2: Leden    | B2: 50000   | C2: 1200      | D2: 25000   | E2: 12.5
A3: Únor     | B3: 65000   | C3: 1350      | D3: 28000   | E3: 15.2
A4: Březen   | B4: 72000   | C4: 1500      | D4: 32000   | E4: 18.1
A5: Duben    | B5: 68000   | C5: 1450      | D5: 30000   | E5: 16.8
A6: Květen   | B6: 75000   | C6: 1600      | D6: 35000   | E6: 19.5
A7: Červen   | B7: 82000   | C7: 1750      | D7: 38000   | D7: 21.2
```

**Sheet 2: Dashboard-Sales-Data**

Tab "Charts":
```
A1: Měsíc    | B1: Prodeje | C1: Uživatelé | D1: Příjmy | E1: Konverze
A2: Leden    | B2: 12000   | C2: 1200      | D2: 25000  | E2: 24.5
A3: Únor     | B3: 15000   | C3: 1350      | D3: 28000  | E3: 26.2
A4: Březen   | B4: 18000   | C4: 1500      | D4: 32000  | E4: 28.1
A5: Duben    | B5: 22000   | C5: 1800      | D5: 38000  | E5: 29.5
A6: Květen   | B6: 28000   | C6: 2100      | D6: 45000  | E6: 31.2
A7: Červen   | B7: 35000   | C7: 2500      | D7: 52000  | E7: 33.8
```

Tab "Categories":
```
A1: Kategorie | B1: Hodnota | C1: Barva
A2: Produkty  | B2: 45       | C2: #1FB8CD
A3: Služby    | B3: 30       | C3: #FFC185
A4: Konzultace| B4: 25       | C4: #B4413C
```

**Sheet 3: Dashboard-HR-Data**

Tab "Employees":
```
A1: Jméno        | B1: Oddělení | C1: Pozice     | D1: Plat | E1: Výkon | F1: Datum nástupu
A2: Jan Novák    | B2: IT       | C2: Developer  | D2: 65000| E2: 92    | F2: 2020-01-15
A3: Marie Svobodová | B3: Marketing | C3: Manager | D3: 58000| E3: 88    | F3: 2019-03-20
A4: Petr Dvořák  | B4: Prodej   | C4: Sales Rep  | D4: 72000| E4: 95    | F4: 2021-05-10
A5: Anna Černá   | B5: HR       | C5: Specialist | D5: 55000| E5: 87    | F5: 2020-08-01
A6: Tomáš Procházka | B6: Finance | C6: Analyst | D6: 68000| E6: 91    | F6: 2019-11-12
A7: Lenka Novotná | B7: IT      | C7: Developer  | D7: 63000| E7: 89    | F7: 2021-02-28
```

#### 2.3 Nastavení oprávnění

Pro každý sheet:
1. Klikněte na "Sdílet" v pravém horním rohu
2. Změňte na "Kdokoli s odkazem může zobrazit"
3. Zkopírujte ID sheetu z URL (část mezi `/d/` a `/edit`)

### Krok 3: Nastavení Google Apps Script

#### 3.1 Vytvoření projektu

1. Jděte na [script.google.com](https://script.google.com)
2. Klikněte "Nový projekt"
3. Přejmenujte projekt na "Dashboard Backend"

#### 3.2 Vložení kódu

1. Smažte výchozí `myFunction()` kód
2. Zkopírujte celý obsah souboru `gas-backend.js` z repozitáře
3. Vložte do editoru

#### 3.3 Konfigurace

Najděte sekci `CONFIG` na začátku a nahraďte placeholder ID:

```javascript
const CONFIG = {
  SHEETS: {
    FINANCIAL_DATA: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', // NAHRAĎTE!
    SALES_DATA: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',     // NAHRAĎTE!
    HR_DATA: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'         // NAHRAĎTE!
  },
  // ... zbytek konfigurace
};
```

#### 3.4 Testování

1. V editoru klikněte na funkci `testConfiguration`
2. Klikněte "Spustit" (▶️)
3. Při prvním spuštění povolte oprávnění
4. Zkontrolujte výsledky v "Execution transcript"

#### 3.5 Nasazení jako Web App

1. Klikněte "Deploy" → "New deployment"
2. **Type**: Web app
3. **Description**: Dashboard Backend v1.0
4. **Execute as**: Me 
5. **Who has access**: Anyone
6. Klikněte "Deploy"
7. **Zkopírujte Web app URL** - budete ji potřebovat!

### Krok 4: Spuštění Frontend aplikace

#### 4.1 Lokální spuštění

**Možnost A: Node.js server**
```bash
npm run dev
# Otevře http://localhost:3000
```

**Možnost B: Python server**
```bash
# Python 3
python3 -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000

# Poté otevřete http://localhost:3000
```

**Možnost C: Live Server (VS Code)**
1. Nainstalujte rozšíření "Live Server"
2. Pravý klik na `index.html`
3. "Open with Live Server"

#### 4.2 GitHub Pages (doporučeno)

1. **Pushněte kód na GitHub**
   ```bash
   git add .
   git commit -m "Initial dashboard setup"
   git push origin main
   ```

2. **Povolte GitHub Pages**
   - Jděte do Settings repozitáře
   - Scroll down na "Pages"
   - Source: "Deploy from a branch"
   - Branch: "main" / root
   - Save

3. **Dashboard bude dostupný na:**
   `https://USERNAME.github.io/REPOSITORY-NAME`

### Krok 5: Konfigurace Dashboard

1. **Otevřete dashboard** v prohlížeči
2. **Otevřete konfiguraci** jedním z způsobů:
   - Stiskněte `Ctrl+Alt+C`
   - Nebo klikněte na ikonu ⚙️ v navigation baru
3. **Zadejte URL Google Apps Script** (z kroku 3.5)
4. **Nastavte interval obnovování** (doporučeno 30 minut)
5. **Povolte notifikace** (volitelné)
6. **Klikněte "Uložit konfiguraci"**

Dashboard se automaticky pokusí načíst data. Pokud vše funguje správně, uvidíte:
- ✅ 4 metrické karty s daty
- ✅ Grafy s vašimi daty
- ✅ Tabulku se zaměstnanci

## 🔧 Pokročilé nastavení

### Automatické obnovování v GAS

Pro lepší výkon nastavte automatické triggery:

1. V Google Apps Script editoru
2. Klikněte na ikonu ⏰ (Triggers)
3. "+ Add Trigger"
4. Function: `scheduledCacheRefresh`
5. Event source: Time-driven
6. Type: Timer
7. Every: 1 hour
8. Save

### Přizpůsobení vzhledu

**Změna barev:**
```css
/* V assets/css/style.css upravte CSS proměnné */
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
}
```

**Přidání vlastního loga:**
```html
<!-- V index.html nahraďte navbar-brand -->
<a class="navbar-brand" href="#">
  <img src="assets/images/logo.png" alt="Logo" height="30">
  Váš Dashboard
</a>
```

### Custom metriky

Přidejte vlastní metriky úpravou funkce `processMetricsData()` v `gas-backend.js`:

```javascript
// Přidejte novou metriku
{
  title: "Vaše metrika",
  value: "123",
  change: "+5%",
  icon: "star", // Font Awesome ikona
  color: "success" // bootstrap color
}
```

## 🐛 Řešení problémů

### Problem 1: Dashboard se nenačítá

**Příznaky:** Bílá stránka nebo nekonečný loading
**Řešení:**
1. Otevřete Developer Tools (F12)
2. Zkontrolujte Console tab pro chyby
3. Zkontrolujte Network tab pro failed requests
4. Ověřte URL Google Apps Script

### Problem 2: Chyba "Script function not found"

**Příčina:** GAS není správně nasazen
**Řešení:**
1. V Google Apps Script klikněte "Deploy" → "Manage deployments"
2. Klikněte ✏️ (Edit) u aktuálního deployment
3. Ověřte "Execute as: Me" a "Who has access: Anyone"
4. Klikněte "Deploy" a zkopírujte novou URL

### Problem 3: Data nejsou aktuální

**Příčina:** Cache problém
**Řešení:**
1. V dashboard klikněte tlačítko "Obnovit"
2. Nebo přidejte `?refresh=true` na konec URL
3. V GAS spusťte funkci `invalidateCache()`

### Problem 4: Chyba oprávnění

**Příznaky:** 403 Forbidden error
**Řešení:**
1. Zkontrolujte, že všechny Google Sheets jsou sdílené s "Anyone with link"
2. Ověřte GAS deployment s "Anyone" access
3. Restartujte browser nebo použijte incognito mode

## 📊 Testování dat

### Testovací data

Pokud chcete rychle otestovat dashboard bez vytváření sheets:

1. V `gas-backend.js` změňte:
   ```javascript
   USE_MOCK_DATA: true, // Změňte na true
   ```

2. Redeploy GAS a otestujte

### Validace dat

Dashboard očekává specifické formáty:
- **Čísla:** Používejte numerické hodnoty, ne text
- **Procenta:** Jako desetinná čísla (0.25 = 25%)
- **Datumy:** YYYY-MM-DD formát

## 🚀 Optimalizace výkonu

### Cache nastavení

Upravte cache duration podle potřeby:
```javascript
// V gas-backend.js
const CONFIG = {
  CACHE_DURATION: 1800, // 30 minut
  SHORT_CACHE: 300,     // 5 minut pro často měněná data
  LONG_CACHE: 3600,     // 1 hodina pro statická data
};
```

### Rate limiting

Pro vysokou zátěž upravte:
```javascript
MAX_REQUESTS_PER_MINUTE: 30, // Snižte pro produkci
```

## 📱 Mobile optimalizace

Dashboard je automaticky responzivní, ale můžete upravit:

```css
/* Pro malé obrazovky */
@media (max-width: 576px) {
  .metric-card h3 {
    font-size: 1.25rem; /* Menší číslice */
  }
}
```

## 🔒 Zabezpečení pro produkci

Pro produkční použití:

1. **Změňte CORS origin:**
   ```javascript
   CORS_ORIGIN: 'https://yourdomain.com', // Místo '*'
   ```

2. **Vypněte debug logging:**
   ```javascript
   ENABLE_LOGGING: false,
   LOG_LEVEL: 'ERROR',
   ```

3. **Omezte rate limiting:**
   ```javascript
   MAX_REQUESTS_PER_MINUTE: 30,
   ```

## 🎉 Gratulujeme!

Váš Google Sheets Dashboard je nyní plně funkční! 

**Co dále:**
- 📊 Přidejte více dat do sheets
- 🎨 Přizpůsobte design
- 📈 Analyzujte vaše data
- 🔗 Sdílejte s týmem

**Potřebujete pomoc?**
- 📖 Přečtěte si README.md pro detaily
- 🐛 Nahlaste problém na GitHub Issues
- 💬 Zeptejte se komunity v Discussions