# 童寫繁體字 KidsWriteTC

> 專為香港學童設計的繁體字筆順與寫字練習工具  
> *A Privacy-First, Clean-Room Stroke Order & Tracing Progressive Web App for Hong Kong Primary Students.*

[![GitHub Pages](https://img.shields.io/badge/deployment-GitHub%20Pages-blue.svg)](https://jackylawck.github.io/KidsWriteTC/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Standards: HK EDB](https://img.shields.io/badge/Standard-HK%20EDB-red.svg)](https://www.edb.gov.hk/)
[![Architecture: Clean Room](https://img.shields.io/badge/Architecture-Clean%20Room-purple.svg)]()

---

### 📖 關於本專案 (About This Project)

#### 繁體中文
這是為了我和兒子共渡美好學習時光而開發的非商業個人專案！為了讓孩子能踏實寫好每一個中文字，我親手打造了這個結合乾淨室架構、三態資料治理與雙層畫布的練字工具。希望透過指尖或觸控筆在九宮格上的流暢起伏，讓孩子在探索漢字結構之美時，感受學習的純粹與創造的快樂。誠摯邀請所有家長、老師與朋友一起使用，共同陪伴孩子成長，寫下無價的學習回憶！

#### English
This is a non-commercial, personal project created to cherish and share inspiring learning moments with my son! To help him master Chinese characters with solid foundations and confidence, I personally engineered this tracing and handwriting tool—combining a clean-room pipeline, three-state data governance, and a responsive dual-canvas architecture.

Whether using fingers or a stylus, I hope the smooth strokes gliding over the traditional grid will allow children to experience the pure joy of learning and creation while exploring the architectural beauty of Chinese characters. Parents, educators, and friends are warmly invited to use this tool and accompany our children as they grow, creating priceless learning memories together!

---

## 繁體中文說明 (Traditional Chinese)

### 項目願景與理念
**KidsWriteTC（童寫繁體字）** 是一個以純前端靜態架構（Static-First）驅動的繁體字筆順示範與描紅練字工具，專為香港初小學生、家長及前線語文教師設計。

目前市面常見的漢字筆順庫多數依循中國大陸國家標準（GB）或台灣教育部標準（MOE），在字形結構（如「骨」、「角」、「真」）及筆順先後順序（如「方」、「草」）上，常與香港教育局《香港小學學習字詞表》規範存在分歧。KidsWriteTC 透過嚴謹的**資料治理架構**與**乾淨室隔離原則（Clean-Room Architecture）**，在完全保障個人隱私（Zero Data Retention）的前提下，為學童提供嚴謹合規的繁體字書寫指引。

---

### 核心功能與特色

1. **三態資料治理框架 (Three-State Data Governance)**
   - 建立以 `manifest.json` 為單一事實來源（SSOT）的驗證體系：
     - 🟢 **HK_VERIFIED（港標核定）**：系統預留之最高治理層級。經手動補丁並附帶教育審核元數據（`reviewedBy` / `reviewedAt`）之字元，將點亮綠色驗證徽章。
     - ⚪ **HK_LIKELY（常態呈現）**：未落入已知爭議清單的常用漢字（涵蓋 9,000+ 字），畫面靜默呈現，消除家長與學生的警告疲勞。
     - 🟡 **HK_DIVERGENT（分歧警示）**：落入已知爭議清單（`KNOWN_DIVERGENT`）之字元，主動顯示教學差異提示，誠實揭示潛在分歧。

2. **雙層畫布分層架構 (Dual-Canvas Layering)**
   - **底層（Trace Layer）**：SVG 路徑解析與米字格導引，流暢呈現步進式、自動循環筆順動畫。
   - **頂層（Ink Layer）**：手寫筆跡捕捉，支援觸控筆與多點觸控，配備螢幕旋轉自動重繪與緩衝區保護，避免學童心血遺失。

3. **完整字音與部首整合**
   - 整合 Unicode Unihan 資料庫（IRG Sources）與 Rime 粵拼辭庫，提供超過 103,000 字之完整部首、筆畫數索引，以及粵語、普通話雙語發音（Web Speech API）。

4. **零資料收集與無障礙設計 (Privacy & Accessibility)**
   - 純靜態客戶端運算，無伺服器、無追蹤碼、無 Cookie。
   - 符合 WCAG 2.1 無障礙標準，具備完整的 `aria-*` 標籤、螢幕閱讀器友善提示及高對比度用色。

---

### 技術架構與技術棧

- **構建工具**：[Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **包管理器**：`pnpm` (Workspace Ready)
- **測試框架**：[Vitest](https://vitest.dev/)（包含乾淨室防止外洩與 Schema 門禁測試）
- **持續整合/部署**：GitHub Actions + GitHub Pages
- **數據管線**：
  - `scripts/compile-dict.ts`：解析 Unihan 與粵拼原始檔，產出輕量化字典索引。
  - `scripts/build-data.ts`：三態治理驗證，產出字元幾何分片與 `manifest.json`。
  - `scripts/known-divergence.ts`：已知港標結構與筆順分歧字清單。

---

### 快速開始與本地開發

#### 1. 安裝環境需求
- Node.js >= 18.0.0
- pnpm >= 8.0.0

#### 2. 下載依賴與啟動
```bash
# 安裝相依套件
pnpm install

# 啟動本地開發伺服器
pnpm run dev

```

#### 3. 字庫編譯與管線驗證

```bash
# 編譯字典索引 (Unihan + Jyutping)
pnpm run compile:dict

# 執行三態資料治理建置管線
pnpm run build:data

# 執行安全與 Schema 門禁測試
pnpm run test

```

---

### 字庫校對與教學回饋 (Continuous Review)

本專案採實用與校本優先原則維護：

1. **分歧透明化**：透過 `KNOWN_DIVERGENT` 清單自動過濾出香港常見教學分歧字（如「骨」、「方」），優先提示家長與學童注意。
2. **循序補齊**：參考香港教育局《香港小學學習字詞表》與學校課堂實際反饋，持續於 `data/patches/` 手動擴充並覆蓋高頻爭議字。

---

## English Documentation

### Mission & Philosophy

**KidsWriteTC** is an open-source, client-side calligraphy and stroke-order practice Progressive Web App tailored for primary school students, parents, and educators in Hong Kong.

Standard open-source stroke databases predominantly follow Mainland China (GB) or Taiwan (MOE) conventions, which often diverge from the Hong Kong Education Bureau (EDB) *Hong Kong Chinese Lexical Lists for Primary Learning* in component structures (e.g., 「骨」, 「角」) and stroke sequences (e.g., 「方」, 「草」). KidsWriteTC implements a rigorous **Three-State Data Governance Architecture** under a strict **Clean-Room environment** to ensure pedagogical accuracy without compromising child privacy.

---

### Key Features

1. **Three-State Governance Model (SSOT Driven)**
* Backed by `manifest.json` as the Single Source of Truth:
* 🟢 **HK_VERIFIED**: Reserved for patched characters carrying verified educator review metadata (`reviewedBy` / `reviewedAt`), unlocking the green badge.
* ⚪ **HK_LIKELY**: Standard characters not present in the divergence list (9,000+ entries) presented cleanly without UI noise.
* 🟡 **HK_DIVERGENT**: Characters identified with known regional structural or sequence discrepancies, displaying transparent educational notices.




2. **Dual-Canvas Rendering Engine**
* **Trace Layer**: Parses vector paths with stroke-by-stroke animation within traditional mi-grid guidelines.
* **Ink Layer**: Low-latency ink capture supporting Apple Pencil, capacitive styluses, and touch gestures, featuring resize buffer preservation.


3. **Bilingual Phonetics & Radical Coverage**
* Comprehensive radical mapping (100% coverage across 103,000+ Unihan records) and multi-pronunciation support in Cantonese (Jyutping) and Mandarin (Pinyin) via the Web Speech API.


4. **Zero-Data Retention & Clean-Room Architecture**
* 100% client-side execution on GitHub Pages. No telemetry, no external tracking, no backend database.
* Strict adherence to WCAG 2.1 accessibility guidelines and CSP headers.



---

### Technology Stack

* **Build Tooling**: Vite, TypeScript
* **Package Manager**: pnpm
* **Automated Testing**: Vitest (clean-room leakage prevention & schema validation)
* **CI/CD Pipeline**: GitHub Actions & GitHub Pages
* **Data Engineering**:
* `scripts/compile-dict.ts`: Compiles Unihan IRG sources and Rime Cantonese YAML into structured dictionary slices.
* `scripts/build-data.ts`: Strict geometry validation and multi-state governance manifest compiler.
* `scripts/known-divergence.ts`: Curated database of known cross-regional character discrepancies.



---

### Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Run local development server
pnpm run dev

# 3. Compile dictionary and geometry data slices
pnpm run compile:dict
pnpm run build:data

# 4. Run automated test suites
pnpm run test

```

---

### License

This project is licensed under the [MIT License](https://www.google.com/search?q=LICENSE).


