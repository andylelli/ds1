# External Endpoints & Integrations

This document tracks the status and configuration of all external API integrations used by the system.

## 1. AI Providers
| Provider | Service | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Azure OpenAI** | `OpenAIService` | 🟢 Active | Used for all agent reasoning. Configured via `AZURE_OPENAI_ENDPOINT`. |

## 2. Market Research
| Provider | Service | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Google Trends** | `LiveTrendAdapter` | 🟡 Partial | Uses unofficial API. Good for interest over time. |
| **SerpApi** | `LiveCompetitorAdapter` | 🟢 Active | Used for competitor discovery. Requires `SERPAPI_KEY`. |
| **Meta Graph API** | `LiveCompetitorAdapter` | 🟡 Restricted | Used for Ad Spy. Requires `META_ACCESS_TOKEN` and 'Advanced Access' for public data. |

## 3. Advertising
| Provider | Service | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Google Ads** | `LiveAdsAdapter` | 🟡 Partial | Implemented but requires customer ID configuration. |

## 4. E-Commerce
| Provider | Service | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Shopify** | `LiveShopAdapter` | 🔴 Missing | Not yet implemented. |

## 5. Infrastructure
| Provider | Service | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Postgres** | `PostgresAdapter` | 🟢 Active | Main database and event store. |
