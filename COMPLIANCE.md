# 🛡️ Trust, Privacy, and Compliance Statement
# 信任、私隱與合規聲明

KidsWriteTC (童寫繁體字) is deeply committed to user privacy, algorithmic transparency, and child safety. As an educational tool designed for primary school students, we adopt a "Privacy by Design" and "Zero Data Retention" architecture.

This document outlines our compliance posture regarding global data protection and technology governance frameworks.

童寫繁體字 (KidsWriteTC) 致力於保障使用者私隱、演算法透明度與學童網絡安全。作為專為初小學童設計的教育工具，我們採取「私隱設計（Privacy by Design）」與「零資料保留（Zero Data Retention）」架構。

本文檔概述了本專案在國際資料保護與科技治理框架下的合規狀態。

---

## 1. 隱私與個人資料保護 (Privacy & Data Protection)
**Status: Fully Compliant (By Exemption & Design) / 狀態：完全合規（基於豁免與架構設計）**

We do not collect, process, store, or transmit any Personally Identifiable Information (PII).
本專案不收集、不處理、不儲存、亦不傳輸任何個人識別資料 (PII)。

* **GDPR (EU) & PCPD (Hong Kong):** The application runs 100% locally in the user's browser (Client-Side Execution). We do not use cookies for tracking, nor do we employ analytics services (e.g., Google Analytics). User preferences (e.g., language selection) are stored purely in ephemeral `sessionStorage`. Thus, obligations regarding Data Processing Agreements (DPA), Right to be Forgotten, and consent banners are not applicable.
  * **歐盟 GDPR 與香港個人資料（私隱）條例 (PCPD)：** 本應用程式 100% 於用戶瀏覽器本地執行。我們不使用追蹤型 Cookies，亦無接入任何第三方分析工具。用戶偏好（如語言選擇）僅存於短暫的 `sessionStorage` 中。因此，資料處理協議、被遺忘權及同意聲明橫幅等合規要求均自動豁免。
* **COPPA (USA) & GDPR-K:** As an application directed at children, we inherently comply with children's privacy protection laws by collecting zero telemetric or personal data from minors.
  * **美國兒童線上隱私保護法 (COPPA) 與 GDPR 兒童專項：** 作為面向學童的應用，我們透過「零資料收集」從根本上阻絕了未成年人資料外洩的風險，天然符合最高級別的兒童隱私保護規範。
* **ISO/IEC 27701 Alignment:** Our architecture perfectly reflects the principles of data minimization and purpose limitation.
  * **ISO/IEC 27701 (隱私資訊管理) 對齊：** 系統架構完美體現了「資料最小化（Data Minimization）」與「目的限制」的國際標準原則。

---

## 2. 人工智慧與演算法治理 (AI Governance & Algorithmic Transparency)
**Status: Out of Scope (Deterministic System) / 狀態：非規管範圍（確定性系統）**

KidsWriteTC is driven by **deterministic algorithms, static SVG paths, and explicit rule-based dictionaries**.
本系統由**確定性演算法、靜態 SVG 路徑與明確的規則字典**驅動。

* **EU AI Act & CAC Deep Synthesis Regulations (China):** The system **does not** utilize Large Language Models (LLMs), Machine Learning (ML), Neural Networks, or any Generative AI (GenAI) technologies. Consequently, this project falls completely outside the regulatory scope of the EU AI Act, the Cyberspace Administration of China's (CAC) Deep Synthesis/GenAI regulations, and ISO/IEC 42001 (AI Management Systems).
  * **歐盟人工智慧法案 (EU AI Act) 及中國國家網信辦《生成式人工智能服務管理暫行辦法》：** 本系統**並未**採用大型語言模型、機器學習、神經網絡或任何生成式 AI 技術。因此，本專案完全豁免於上述所有 AI 監管法規，亦不適用於 ISO/IEC 42001（人工智慧管理系統）之認證要求，徹底排除了 AI 幻覺（Hallucination）或演算法黑箱的合規風險。
* **Content Integrity (Clean-Room Architecture):** All character geometries and stroke orders are statically governed by a verifiable `manifest.json` acting as the Single Source of Truth (SSOT). Divergences from regional standards are explicitly labeled via a transparent, human-reviewed, three-state governance pipeline.
  * **內容完整性與透明度：** 所有字形幾何與筆順均由單一事實來源（SSOT）的 `manifest.json` 靜態控制。與區域標準的分歧皆透過透明、經人工審核的「三態治理管線」予以明確標示，確保教育內容的確定性與可追溯性。

---

## 3. 資訊安全防護 (Information Security)
**Status: Compliant by Architecture / 狀態：基於架構設計合規**

Our security posture aligns with core **ISO/IEC 27001** principles (Confidentiality, Integrity, Availability) tailored for serverless environments.
我們的安全態勢對齊 **ISO/IEC 27001**（資訊安全管理）的核心原則（機密性、完整性、可用性），並針對無伺服器環境進行優化。

* **No Backend & Attack Surface Minimization:** The application is purely static (HTML/CSS/JS) hosted on GitHub Pages. There are no backend databases, APIs, or server-side states susceptible to SQL injection, XSS, or data breaches.
  * **無後端與攻擊面最小化：** 應用程式為託管於 GitHub Pages 的純靜態檔案。沒有任何後端資料庫或 API，從根本上消除了 SQL 注入、資料外洩等伺服器端漏洞風險。
* **Content Security Policy (CSP):** Strict CSP headers are implemented in `index.html` to prevent Unauthorized script execution and cross-site scripting (XSS).
  * **內容安全策略 (CSP)：** `index.html` 已實施嚴格的 CSP 標頭，有效阻擋未授權腳本執行與跨站腳本攻擊 (XSS)。
* **Immutable Deployments:** Data releases are protected by GitHub Actions CI/CD pipelines with integrated schema validation and clean-room leakage prevention testing.
  * **不可變部署與防篡改：** 資料發佈受 GitHub Actions CI/CD 管線保護，並內建嚴格的 Schema 驗證與乾淨室門禁掃描，確保教育資源庫不被意外污染。

---

### Disclaimer / 免責聲明
This project is provided as an open-source educational tool. While engineered to the highest architectural standards regarding privacy and security, it does not constitute formal legal or regulatory advice. Users and institutions should evaluate the tool within their specific compliance contexts.
本專案作為開源教育工具提供。雖然在隱私與安全架構上採用最高標準設計，但本聲明不構成正式之法律或合規建議。使用者與教育機構應根據其具體適用之法規環境自行評估。
