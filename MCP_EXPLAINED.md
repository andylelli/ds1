# Model Context Protocol (MCP): Technical Grammar & Vocabulary

This document defines the linguistic structure of the Model Context Protocol (MCP). It treats the protocol as a language with specific grammar (structure), vocabulary (actors), verbs (actions), and nouns (objects).

## 0. Introduction: Why MCP?

Before diving into the grammar, it is important to understand the *purpose* of this language.

In the past, if you wanted an AI to talk to a database, you wrote custom code. If you wanted it to talk to Slack, you wrote more custom code. This created a "many-to-many" problem: every AI client (Claude, ChatGPT, IDEs) had to write integrations for every service (Google Drive, Postgres, GitHub).

**MCP solves this by creating a universal language.**
*   **Extensibility**: Because MCP is a standard, you can write a "Google Drive Server" once, and it works instantly with *any* MCP-compliant Client (Claude, VS Code, etc.).
*   **Modularity**: You can plug and unplug capabilities like USB devices.

## 0.5 Notation Guide: How to Read This Document

To use this document effectively, please note the following conventions used in the examples. This style mimics technical language specifications.

### **1. JSON Representation**
All examples are shown in **JSON** (JavaScript Object Notation), as this is the wire format of MCP.
*   **`{ ... }`**: Represents a JSON Object.
*   **`[ ... ]`**: Represents a JSON Array.

### **2. Editorial Conventions**
*   **`// Comments`**: Standard JSON does not support comments. We use C-style comments (`//`) to annotate fields for educational purposes. **Do not include these in your actual code.**
*   **`...` (Ellipsis)**: Indicates that data has been truncated for brevity (e.g., a long Base64 string) or that optional fields have been omitted.
*   **`Client -> Server`**: Denotes the direction of the message.

### **3. Object Context**
Examples in the Dictionary (Section 7) may represent either:
*   **Full Messages**: A complete JSON-RPC packet (contains `jsonrpc`, `id`, etc.).
*   **Partial Objects**: A specific sub-object (like a `Content` object) that would be nested inside a larger message.

---

## 1. The Vocabulary (The Actors)

In the MCP universe, there are three distinct roles. Understanding "who is who" is critical for implementing the protocol correctly.

### **The Client** (The Brain)
*   **Who it is**: The application that "thinks" and interacts with the Large Language Model (LLM).
*   **Examples**: Claude Desktop App, VS Code (Copilot), or our custom `CeoAgent`.
*   **Role**: It initiates requests. It decides *when* to call a tool or read a resource based on user intent.
*   **Analogy**: The Architect.

### **The Server** (The Hands)
*   **Who it is**: A lightweight process that exposes specific capabilities to the Client.
*   **Examples**: A "Google Drive MCP Server", a "Postgres MCP Server", or our "Shopify Tool".
*   **Role**: It executes commands. It does not "think"; it simply provides a list of what it *can* do and waits for instructions.
*   **Analogy**: The Contractor.

### **The Host** (The Environment)
*   **Who it is**: The process that manages the connection between Clients and Servers.
*   **Examples**: The operating system process, a Docker container, or the IDE.
*   **Role**: It manages the lifecycle (starting/stopping servers) and the transport layer (pipes/sockets).

---

## 2. The Grammar (The Structure)

MCP uses **JSON-RPC 2.0** as its underlying grammar. Every sentence spoken in MCP follows a strict Subject-Verb-Object structure wrapped in JSON.

### **A. Task Request (`tools/call`)**
A Client asks an Agent to execute a specific tool.
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "calculate_tax",
    "arguments": { "price": 100 }
  }
}
```

### **B. Task Response**
The Agent replies with the result. Note the `content` array structure.
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      { "type": "text", "text": "10.00" }
    ]
  }
}
```

### **C. Resource Request (`resources/read`)**
A Client asks to read a specific data source (URI).
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "file:///logs/error.txt"
  }
}
```

### **D. Log Notification (`notifications/message`)**
An Agent sends a status update. This is a "fire-and-forget" message (no `id`).
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/message",
  "params": {
    "level": "info",
    "data": "Connected to database successfully."
  }
}
```

### **Extensibility via Capabilities**
The grammar is designed to grow. During the `initialize` handshake, the Client and Server exchange a list of **Capabilities**.
*   If a Server says "I support `logging`", the Client knows it can listen for log messages.
*   If a Client says "I support `sampling`", the Server knows it can ask the Client to run AI queries.
This negotiation allows the protocol to add new features without breaking older clients.

---

## 3. The Nouns (The Primitives)

These are the objects that the Client and Server pass back and forth. There are three primary nouns in MCP.

### **A. Resources** (Passive Data)
*   **Definition**: Data that can be read but not changed by the act of reading.
*   **Analogy**: A file, a database row, a log entry.
*   **Behavior**: Like an HTTP `GET` request.
*   **URI Scheme**: `file:///logs/error.txt` or `postgres://db/users/1`.

### **B. Tools** (Active Functions)
*   **Definition**: Executable functions that perform an action or computation.
*   **Analogy**: A Python script, an API call, a calculator.
*   **Behavior**: Like an HTTP `POST` request. Side effects may occur (e.g., sending an email).
*   **Structure**: Defined by a JSON Schema (Name, Description, Arguments).

### **C. Prompts** (Reusable Context)
*   **Definition**: Pre-written templates that help the LLM understand a task.
*   **Analogy**: A form letter or a standard operating procedure.
*   **Usage**: A Server can offer a prompt like "Debug Error" which automatically loads relevant logs (Resources) into the chat context.

---

## 4. The Verbs (The Methods)

These are the specific actions a Client can ask a Server to perform. They are namespaced to avoid collision.

### **Lifecycle Verbs**
*   `initialize`: The handshake. Client and Server exchange capabilities ("I support tools", "I support resources").
*   `ping`: "Are you still there?"

### **Tool Verbs**
*   `tools/list`: Client asks, "What can you do?" Server replies, "I can `send_email` and `check_weather`."
*   `tools/call`: Client asks, "Please run `send_email` with these arguments."

### **Resource Verbs**
*   `resources/list`: Client asks, "What data do you have?"
*   `resources/read`: Client asks, "Give me the content of `file:///logs/error.txt`."
*   `resources/subscribe`: Client asks, "Tell me if this file changes."

### **Prompt Verbs**
*   `prompts/list`: Client asks, "What templates do you have?"
*   `prompts/get`: Client asks, "Give me the 'Debug Error' prompt."

---

## 5. Communication Flow: Who Talks to Whom?

The conversation is always **Client-Driven**. The Server never speaks unless spoken to (with the exception of Notifications for updates).

### **Scenario: The CEO Agent wants to check Shopify inventory.**

1.  **Discovery (The Handshake)**
    *   **Client (CEO)**: `initialize` -> "Hello, I am the CEO Agent."
    *   **Server (Shopify MCP)**: `initialize` -> "Hello, I am the Shopify Server. I have `tools`."

2.  **Introspection (The Menu)**
    *   **Client**: `tools/list` -> "Show me your menu."
    *   **Server**: Returns list: `[{ name: "get_inventory", description: "Checks stock levels..." }]`.

3.  **Reasoning (The Brain)**
    *   **Client (Internal)**: The LLM thinks: *"The user asked for stock levels. I see a tool named `get_inventory`. I should call it."*

4.  **Execution (The Action)**
    *   **Client**: `tools/call` -> "Run `get_inventory` for 'Red Chair'."
    *   **Server**: *Connects to Shopify API... Fetches data...*
    *   **Server**: Returns result: `{ "stock": 50 }`.

5.  **Response (The Output)**
    *   **Client**: Tells the user: "We have 50 Red Chairs in stock."

---

## 6. Summary Table

| Term | Type | Definition | Direction |
| :--- | :--- | :--- | :--- |
| **Client** | Actor | The LLM application initiating requests. | Sender |
| **Server** | Actor | The provider of tools and data. | Receiver |
| **Resource** | Noun | Data to be read (Files, DB). | Server -> Client |
| **Tool** | Noun | Function to be executed (API calls). | Client -> Server |
| **Prompt** | Noun | Template for conversation. | Server -> Client |
| **tools/call** | Verb | Request to execute a function. | Client -> Server |
| **resources/read** | Verb | Request to read data. | Client -> Server |

---

## 7. The DS1 Protocol Dictionary

This section defines the exact vocabulary used in Project DS1, derived from `src/mcp/protocol.js`.

### **A. Standard Message Types**
These are the core verbs defined by the MCP specification and implemented in DS1.

| Method | Direction | Description | Schema Reference |
| :--- | :--- | :--- | :--- |
| `tools/call` | Client -> Server | Execute a specific tool. | `TaskRequestSchema` |
| `resources/read` | Client -> Server | Read data from a URI. | `ResourceRequestSchema` |
| `notifications/message` | Server -> Client | Send a log or status update. | `LogMessageSchema` |

### **B. Custom Message Types (DS1 Specific)**
Project DS1 extends the standard MCP with two agent-specific verbs defined in `src/mcp/protocol.js`.

#### **1. `agent/plan`**
*   **Purpose**: The Client sends a high-level goal to the Agent, asking for a step-by-step execution plan.
*   **Schema**: `PlanRequestSchema`
*   **Example Payload**:
    ```json
    {
      "method": "agent/plan",
      "params": {
        "goal": "Launch a new coffee brand",
        "context": { "budget": 5000 }
      }
    }
    ```

#### **2. `agent/critique`**
*   **Purpose**: The Client asks the Agent to review a specific output or code snippet for errors.
*   **Schema**: `CritiqueRequestSchema`
*   **Example Payload**:
    ```json
    {
      "method": "agent/critique",
      "params": {
        "task": "Write Ad Copy",
        "output": "Buy our coffee!",
        "criteria": ["persuasiveness", "clarity"]
      }
    }
    ```

### **C. The Tool Registry (The Verbs)**
These are the specific capabilities exposed by our agent fleet.

#### **🕵️ Product Research Agent**
*   **`find_winning_products`**: Scrapes marketplaces for high-demand items.
    *   *Args*: `{ category: "Home Decor", criteria: "High Margin" }`
*   **`analyze_niche`**: Evaluates competition and saturation.
    *   *Args*: `{ niche: "Ergonomic Chairs" }`

#### **📦 Supplier Agent**
*   **`find_suppliers`**: Searches for vendors on AliExpress/CJ.
    *   *Args*: `{ product_id: "123", min_rating: 4.5 }`
*   **`negotiate_price`**: Initiates a chat session to lower unit costs.
    *   *Args*: `{ supplier_id: "sup_99", target_price: 15.00 }`

#### **🏗️ Store Build Agent**
*   **`create_product_page`**: Generates HTML/Liquid for a new product.
    *   *Args*: `{ title: "Comfy Chair", price: 99.99, images: [...] }`
*   **`optimize_seo`**: Updates meta tags and descriptions.
    *   *Args*: `{ page_id: "p_1", keywords: ["office", "ergonomic"] }`

#### **📢 Marketing Agent**
*   **`create_ad_campaign`**: Launches ads on Meta/TikTok.
    *   *Args*: `{ platform: "facebook", budget: 50, creative_id: "c_1" }`
*   **`write_copy`**: Generates persuasive text for ads or emails.
    *   *Args*: `{ tone: "urgent", product_name: "Comfy Chair" }`

#### **🤝 Customer Service Agent**
*   **`handle_ticket`**: Drafts a reply to a customer inquiry.
    *   *Args*: `{ ticket_id: "t_555", sentiment: "angry" }`
*   **`generate_faq`**: Creates a list of common questions based on ticket history.
    *   *Args*: `{ topic: "shipping" }`

#### **🚚 Operations Agent**
*   **`fulfill_order`**: Sends shipping details to the supplier.
    *   *Args*: `{ order_id: "o_777", address: "123 Main St" }`
*   **`check_inventory`**: Queries current stock levels.
    *   *Args*: `{ sku: "chair-red" }`

#### **📊 Analytics Agent**
*   **`generate_report`**: Compiles sales and traffic data.
    *   *Args*: `{ date_range: "last_30_days" }`
*   **`predict_sales`**: Uses historical data to forecast revenue.
    *   *Args*: `{ month: "December" }`

### **D. Resources (The Nouns)**
*   *Currently, no agents expose passive resources via `resources/read`. All data access is handled via Tools.*

---

## 8. Case Study: Project DS1 Implementation

To see these concepts in action, look at your own codebase.

*   **The Protocol**: Defined in `src/mcp/protocol.js`. This file uses Zod schemas to enforce the Grammar (Section 2).
*   **The Server**: Implemented in `src/mcp/server.js`. This class handles message routing and supports two Transports:
    *   **Stdio**: For running agents as standalone processes (via `start()`).
    *   **Direct**: For in-process communication (via `handleMessage()`), used by the main app.
*   **The Agents**: In `src/agents/base.js`, you will see that `BaseAgent extends MCPServer`.
    *   **Why?** This means every agent (CEO, Researcher) is technically an **MCP Server**.
    *   **Benefit**: The main application (`src/index.js`) treats them all uniformly. It sends `tools/call` messages to them, and they reply. This makes our architecture modular and compliant with the standard.
*   **The Client**: The main application (`src/index.js`) acts as the **MCP Client**. It orchestrates the workflow by sending requests to the Agent Servers and handling their responses.

---

## 9. Summary

MCP is the language that allows our DropShip agents to talk to each other and the main application. By strictly following this Subject-Verb-Object grammar, we ensure that our system is:

1.  **Modular**: New agents can be added without changing the core logic.
2.  **Reliable**: Zod schemas catch errors before they cause crashes.
3.  **Standardized**: We are using an industry-standard protocol, not a hacked-together solution.

You are now equipped to read the code in `src/mcp/` and `src/agents/` with full understanding of *how* and *why* the pieces fit together.

---

## 10. Appendix: Syntax Quick Reference

Use this table for a quick lookup of the JSON structures used in DS1.

### **A. Message Envelopes**
| Type | JSON Structure |
| :--- | :--- |
| **Request** | `{"jsonrpc": "2.0", "id": <number>, "method": "<string>", "params": {...}}` |
| **Response** | `{"jsonrpc": "2.0", "id": <number>, "result": {...}}` |
| **Error** | `{"jsonrpc": "2.0", "id": <number>, "error": {"code": <int>, "message": "<string>"}}` |
| **Notification** | `{"jsonrpc": "2.0", "method": "<string>", "params": {...}}` |

### **B. Method Reference**
| Method | Params (`params`) | Result (`result`) |
| :--- | :--- | :--- |
| `tools/call` | `{ "name": string, "arguments": object }` | `{ "content": [{ "type": "text", "text": string }] }` |
| `resources/read` | `{ "uri": string }` | `{ "contents": [{ "uri": string, "mimeType": string, "text": string }] }` |
| `notifications/message` | `{ "level": string, "data": any }` | *None (Notification)* |
| `agent/plan` | `{ "goal": string, "context": object }` | `{ "content": [{ "type": "text", "text": string }] }` |
| `agent/critique` | `{ "task": string, "output": string, "criteria": string[] }` | `{ "content": [{ "type": "text", "text": string }] }` |




