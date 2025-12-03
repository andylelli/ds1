# 📝 Things To Do: External Integrations Roadmap

This document outlines the external services, APIs, and websites that need to be integrated for each agent to reach full autonomy. It includes the **Business Justification (Why)** and the **Implementation Steps (How)** for each task.

---

## 🕵️ Product Research Agent

### 1. Marketplaces (Amazon / AliExpress / Temu)
- [ ] **Integrate Amazon Best Sellers & AliExpress Data**
    - **Why**: To validate that people are actually buying a product before we try to sell it. We need to see sales volume, rating distribution, and price points.
    - **How**:
        1.  Sign up for a scraping API like **RapidAPI** (e.g., "Amazon Data Scraper" or "AliExpress Data").
        2.  Update `src/agents/productResearchAgent.js` to call this API instead of mocking data.
        3.  Implement logic to filter results: `Review Count > 50`, `Rating > 4.5`, `Price > $20`.

### 2. Trend Analysis (Google Trends / TikTok)
- [ ] **Integrate Google Trends & TikTok Creative Center**
    - **Why**: To catch "viral waves" early. Selling a product on the uptrend is 10x easier than selling a stale one.
    - **How**:
        1.  Use the `google-trends-api` npm package (unofficial) or a paid SERP API.
        2.  For TikTok, use a scraper or the official **TikTok Research API** (requires approval) to find trending hashtags.
        3.  Create a function `checkTrend(keyword)` that returns a score (0-100).

### 3. Competitor Intelligence (FB Ad Library)
- [ ] **Integrate Facebook Ad Library**
    - **Why**: To see exactly what ads competitors are running. If an ad has been running for >1 month, it is likely profitable.
    - **How**:
        1.  Register as a developer on **Meta for Developers**.
        2.  Get an Access Token for the **Marketing API**.
        3.  Use the `Ad Library API` endpoint to search for ads by keyword (e.g., "posture corrector").

---

## 📦 Supplier Agent

### 1. Sourcing Platforms (AliExpress / CJ Dropshipping)
- [ ] **Integrate AliExpress / CJ Dropshipping APIs**
    - **Why**: To automate order placement. Manually typing addresses into AliExpress is unscalable and prone to error.
    - **How**:
        1.  Apply for the **AliExpress Open Platform** or **CJ Dropshipping API**.
        2.  Get `App Key` and `Secret`.
        3.  Create a tool `place_order(customer_details, product_id)` in `supplierAgent.js`.

### 2. Communication (WhatsApp / WeChat)
- [ ] **Integrate WhatsApp Web Automation**
    - **Why**: The best prices are negotiated via direct chat, not clicked on a website. Agents need to "talk" to suppliers.
    - **How**:
        1.  Use a library like `whatsapp-web.js` (runs a headless browser).
        2.  Create a tool `send_message_to_supplier(phone, text)`.
        3.  Train the agent to ask specific questions: "What is the MOQ?" "Can you do faster shipping?"

---

## 🏗️ Store Build Agent

### 1. E-commerce (Shopify Theme API)
- [ ] **Integrate Shopify Theme API**
    - **Why**: To customize the look of the store programmatically (e.g., changing colors to match the product niche).
    - **How**:
        1.  Update the Shopify App scopes to include `write_themes`.
        2.  Use the Asset API to upload new `.liquid` files or update `settings_data.json`.

### 2. Assets (Unsplash / TinyPNG)
- [ ] **Integrate Unsplash & TinyPNG**
    - **Why**: High-quality, fast-loading images increase conversion rates. We need free stock photos and compressed assets.
    - **How**:
        1.  Get an API key from **Unsplash** and **TinyPNG**.
        2.  Create a helper `fetchAndCompressImage(keyword)`.
        3.  Use this when generating blog posts or collection banners.

### 3. SEO (Google Search Console)
- [ ] **Integrate Google Search Console API**
    - **Why**: To monitor organic traffic and indexing issues. Free traffic is the highest ROI traffic.
    - **How**:
        1.  Set up a Service Account in **Google Cloud Console**.
        2.  Enable the Search Console API.
        3.  Create a tool `submit_sitemap()` to ping Google whenever we add new products.

---

## 📢 Marketing Agent

### 1. Ad Platforms (Meta / TikTok)
- [ ] **Integrate Meta Marketing API**
    - **Why**: To programmatically create, launch, and stop ads. This is the engine of the business.
    - **How**:
        1.  Create a **Meta Business Manager** account.
        2.  Generate a System User Access Token.
        3.  Implement `create_campaign`, `create_ad_set`, and `create_ad` tools.
        4.  **Crucial**: Implement a "Kill Switch" to stop ads if ROAS < 1.5.

### 2. Email (Klaviyo)
- [ ] **Integrate Klaviyo API**
    - **Why**: Email marketing accounts for 20-30% of revenue in mature stores. It recovers lost sales (abandoned carts).
    - **How**:
        1.  Get a Private API Key from Klaviyo.
        2.  Create a tool `create_flow(trigger, email_content)`.
        3.  Set up a "Welcome Series" flow automatically when the store launches.

---

## 🤝 Customer Service Agent

### 1. Ticketing (Zendesk / Gorgias)
- [ ] **Integrate Gorgias API**
    - **Why**: Gorgias is built for Shopify. It allows the agent to see order details next to the ticket.
    - **How**:
        1.  Sign up for a Gorgias dev account.
        2.  Use the API to fetch tickets and post replies.
        3.  Connect it to the `CustomerServiceAgent` to draft replies automatically.

### 2. Direct Messaging (Gmail / SMTP)
- [ ] **Integrate Nodemailer (SMTP)**
    - **Why**: To send transactional emails or direct replies if not using a helpdesk.
    - **How**:
        1.  Install `nodemailer`.
        2.  Configure it with a transactional email provider (SendGrid, Mailgun) or Google Workspace SMTP.
        3.  Create `send_email(to, subject, body)`.

---

## 🚚 Operations Agent

### 1. Logistics (17Track)
- [ ] **Integrate 17Track API**
    - **Why**: To proactively tell customers where their package is *before* they ask. Reduces support tickets by 50%.
    - **How**:
        1.  Get a 17Track API key.
        2.  Create a cron job (scheduled task) that checks status of all "In Transit" orders every 6 hours.
        3.  If status changes to "Exception" or "Delivered", trigger an email.

### 2. Payments (Stripe)
- [ ] **Integrate Stripe API**
    - **Why**: To handle disputes (chargebacks) automatically. If we don't respond to disputes, we lose the money and our merchant account.
    - **How**:
        1.  Use the `stripe` npm package.
        2.  Listen for webhooks `charge.dispute.created`.
        3.  Auto-submit evidence (tracking number, delivery proof) using the API.

---

## 📊 Analytics Agent

### 1. Data Sources (GA4 / Pixel)
- [ ] **Integrate Google Analytics Data API (GA4)**
    - **Why**: To get the "truth" about traffic sources. Shopify data and Facebook data often disagree.
    - **How**:
        1.  Enable GA4 Data API in Google Cloud.
        2.  Create a tool `get_traffic_report(date_range)`.
        3.  Use this to calculate the real Conversion Rate per channel.
