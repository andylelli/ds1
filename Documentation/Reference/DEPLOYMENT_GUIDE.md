# 🚀 Agentic AI Platform - Deployment Guide

This guide contains **everything** you need to go from zero to a fully running Agentic AI platform on Azure.

---

## 📋 Prerequisites

1.  **GitHub Account**: You are already here!
2.  **Azure Account**: [Sign up for free](https://azure.microsoft.com/free/) if you don't have one.
3.  **Azure CLI**: [Install it](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) on your local machine to run the setup commands.

---

## 1️⃣ Step 1: Configure Azure & GitHub Security

We need to allow GitHub Actions to talk to your Azure subscription securely using **OpenID Connect (OIDC)**. This is safer than saving passwords.

### A. Run these commands locally
Open your PowerShell or Terminal and run these commands one by one. Replace `<SUBSCRIPTION_ID>` with your actual Azure Subscription ID.

```powershell
# 1. Login to Azure
az login

# 2. Set your subscription
az account set --subscription "<SUBSCRIPTION_ID>"

# 3. Create an App Registration for GitHub
$app = az ad app create --display-name "ds1-github-actions"
$appId = $app.appId

# 4. Create a Service Principal
$sp = az ad sp create --id $appId

# 5. Assign 'Contributor' role (allows creating resources)
# Replace <SUBSCRIPTION_ID> below
az role assignment create --role "Contributor" --subscription "<SUBSCRIPTION_ID>" --assignee-object-id $sp.id --assignee-principal-type ServicePrincipal --scope /subscriptions/<SUBSCRIPTION_ID>

# 6. Configure Federated Credentials (OIDC) for GitHub Actions
# Replace <YOUR_GITHUB_USERNAME> below
az ad app federated-credential create --id $appId --parameters "{\"name\":\"github-actions-main\",\"issuer\":\"https://token.actions.githubusercontent.com\",\"subject\":\"repo:<YOUR_GITHUB_USERNAME>/ds1:ref:refs/heads/main\",\"description\":\"Allow GitHub Actions to deploy from main branch\",\"audiences\":[\"api://AzureADTokenExchange\"]}"
```

### B. Get your IDs
You will need these 3 values for the next step:
1.  **Client ID**: `$appId` (from step 3)
2.  **Tenant ID**: Run `az account show --query tenantId -o tsv`
3.  **Subscription ID**: Your subscription ID.

---

## 2️⃣ Step 2: Add Secrets to GitHub

1.  Go to your GitHub Repository.
2.  Click **Settings** (top right tab).
3.  On the left menu, click **Secrets and variables** > **Actions**.
4.  Click **New repository secret**.
5.  Add the following 3 secrets:

| Name | Value |
|------|-------|
| `AZURE_CLIENT_ID` | The App ID you created above. |
| `AZURE_TENANT_ID` | Your Azure Tenant ID. |
| `AZURE_SUBSCRIPTION_ID` | Your Azure Subscription ID. |
| `SHOPIFY_SHOP_NAME` | Your Shopify store domain (e.g., `mystore.myshopify.com`). |
| `SHOPIFY_ACCESS_TOKEN` | Your Admin API Access Token (see below). |

### 🛍️ How to get your Shopify Access Token
1.  Log in to your **Shopify Admin**.
2.  Go to **Settings** > **Apps and sales channels** > **Develop apps**.
3.  Click **Create an app** and name it "DropShip Agent".
4.  Click **Configure Admin API scopes**.
5.  Search for and check: `write_products`, `read_products`.
6.  Click **Save**.
7.  Click **Install app** (top right).
8.  Under **Admin API access token**, click **Reveal token once**. Copy this value.

---

## 3️⃣ Step 3: Provision Infrastructure

Now we will create the "Hardware" (Cloud Resources) for your agents.

1.  Go to the **Actions** tab in your GitHub repo.
2.  Select **Deploy Infrastructure** from the left sidebar.
3.  Click **Run workflow**.
4.  Select **dev** as the environment and click **Run workflow**.

☕ **Wait about 5-10 minutes.**
This will create:
*   Azure OpenAI (GPT-4o)
*   Cosmos DB (Database)
*   Container Registry (Docker storage)
*   Container Apps Environment (Hosting)

---

## 4️⃣ Step 4: Deploy the Agents

Now that the infrastructure exists, let's deploy your code.

1.  Go to the **Actions** tab.
2.  Select **Build and Deploy App**.
3.  Click **Run workflow**.

**What happens:**
*   GitHub builds your code into a Docker image.
*   Pushes it to your private Azure Registry.
*   Updates the running Container App to use the new code.

---

## 5️⃣ Step 5: Verify & Use

Your agents are now live!

### Get the URL
1.  Go to **Actions** > **Manage App (Start/Stop/Scale)**.
2.  Run the workflow with Action: **status**.
3.  Check the logs of the workflow run. It will print your **App URL** (e.g., `https://ds1-agent-dev.polarmeadow-12345.eastus.azurecontainerapps.io`).

### Talk to your Agents
You can use Postman, curl, or any API tool.

**🆕 NEW: Chat with the CEO (Status & History)**
Ask the CEO about the organization's status. The CEO reads the database logs to give you an accurate answer.
```bash
POST https://<YOUR_APP_URL>/api/chat
Content-Type: application/json

{
  "message": "What have the agents been working on recently?"
}
```

**Example: Ask the CEO to plan a business**
```bash
POST https://<YOUR_APP_URL>/api/agent/ceo/plan
Content-Type: application/json

{
  "goal": "Start a dropshipping business for eco-friendly yoga mats"
}
```

**Example: Ask Research Agent to find products**
```bash
POST https://<YOUR_APP_URL>/api/agent/research/call
Content-Type: application/json

{
  "name": "find_winning_products",
  "arguments": { "category": "Yoga" }
}
```

---

## 6️⃣ Step 6: Operations & Maintenance

### 🛑 Save Money (Stop the App)
If you aren't using the agents, pause them to stop billing for compute.
1.  Run **Manage App** workflow.
2.  Select Action: **stop**.

### 📈 Scale Up
If you have too much traffic:
1.  Run **Manage App** workflow.
2.  Select Action: **scale**.
3.  Set Replicas: **5**.

### 🗑️ Destroy Everything
To delete all resources and stop all costs permanently:
1.  Run **Destroy Infrastructure** workflow.

---

## ❓ Troubleshooting

*   **"Login failed" in GitHub Actions**: Check your `AZURE_CLIENT_ID` and `AZURE_TENANT_ID` secrets. Ensure the Federated Credential was created correctly.
*   **"Quota exceeded" for OpenAI**: You might need to request a quota increase in Azure Portal or switch regions in `infra/main.bicep` (default is `eastus`).
