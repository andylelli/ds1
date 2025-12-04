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

### **Request Structure (The Question)**
A Client asks a Server to do something.
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",        // The Verb
  "params": {                    // The Object/Modifiers
    "name": "calculate_tax",
    "arguments": { "price": 100 }
  }
}
```

### **Response Structure (The Answer)**
The Server replies.
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {                    // The Result
    "content": [{ "type": "text", "text": "10.00" }]
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

## 7. The Exhaustive Dictionary

A comprehensive reference of every term you might encounter in the Model Context Protocol specification.

### **A - C**
*   **Attachment**: Binary or text data sent as part of a prompt or tool result.
    *   *Example*: A tool `read_email` returns the email body as text, but also includes a PDF invoice as an `attachment`.
*   **Blob**: Binary Large Object. A way to send non-text data (images, PDFs) encoded in Base64.
    *   *Example*: `{ "type": "blob", "data": "iVBORw0KGgo...", "mimeType": "image/png" }`.
*   **Capability**: A feature flag exchanged during `initialize`. E.g., a server declares `capabilities: { tools: {} }` to say "I support tools."
    *   *Example*: A Client sends `capabilities: { sampling: {} }` to tell the Server "I allow you to ask me to run LLM queries."
*   **Client**: The application (IDE, Chat App) that initiates the connection and queries the LLM.
    *   *Example*: **Claude Desktop** is the Client; the **Postgres MCP Server** is the Server.
*   **Completion**: A feature where the client asks the server to auto-complete text (e.g., for code completion or prompt arguments).
    *   *Example*: User types `/tool run git_com...` and the Server suggests `git_commit`.
*   **Context**: The accumulated information (files, chat history) available to the LLM to make a decision.
    *   *Example*: The Client reads `main.js` and `README.md` and pastes their content into the prompt before asking the LLM "How do I run this?"
*   **Cursor**: An opaque string used for pagination when a list (like `resources/list`) is too long.
    *   *Example*: The Server returns 100 logs and `"nextCursor": "abc-123"`. The Client sends `abc-123` in the next request to get logs 101-200.

### **E - H**
*   **Error**: A JSON-RPC response indicating failure. Contains a `code` (integer) and `message` (string).
    *   *Example*: `{ "jsonrpc": "2.0", "id": 1, "error": { "code": -32601, "message": "Method not found" } }`.
*   **Handshake**: The initial sequence (`initialize` -> `initialized`) where Client and Server agree on protocol version and capabilities.
    *   *Example*: Client sends `initialize`. Server responds with `protocolVersion: "2024-11-05"`. Client sends `notifications/initialized` to confirm.
*   **Host**: The environment running the MCP connection (e.g., the OS process, Docker container).
    *   *Example*: **VS Code** acts as the Host when it launches an MCP server to provide context for Copilot.
*   **Host Process**: The actual executable running the Server (e.g., `node server.js`).
    *   *Example*: The background process `python my_server.py` that VS Code spawned.

### **I - L**
*   **Image Content**: A content type used to send visual data to multimodal LLMs.
    *   *Example*: `{ "type": "image", "data": "base64...", "mimeType": "image/jpeg" }`.
*   **Implementation**: The specific code base running the protocol (e.g., "The TypeScript SDK").
    *   *Example*: The **Python MCP SDK** (`mcp`) is an implementation that developers use to build servers.
*   **Initialize**: The first method called by the Client to start the session.
    *   *Example*: `{ "method": "initialize", "params": { "protocolVersion": "2024-11-05", "capabilities": {} } }`.
*   **JSON-RPC 2.0**: The stateless, lightweight remote procedure call protocol that MCP is built on top of.
    *   *Example*: Every message must have `"jsonrpc": "2.0"`. Requests have `"id"`, Notifications do not.
*   **Logging**: A capability allowing the Server to send log messages (`debug`, `info`, `error`) to the Client's console.
    *   *Example*: Server sends `notifications/message` with `{ "level": "info", "data": "Connected to Database" }`. Client displays this in the "Output" tab.

### **M - N**
*   **Method**: The "verb" in a JSON-RPC request (e.g., `tools/call`).
    *   *Example*: In `{ "method": "resources/read" }`, the method tells the receiver what action to take.
*   **MIME Type**: A standard identifier for file formats (e.g., `application/json`, `image/png`) used in Resources.
    *   *Example*: A resource `config.json` has MIME type `application/json`, telling the Client to treat it as structured data.
*   **Notification**: A one-way message that does not expect a response (e.g., `notifications/message` or `resources/updated`).
    *   *Example*: `{ "jsonrpc": "2.0", "method": "notifications/message", "params": { ... } }`. Note the lack of an `"id"` field.

### **P - R**
*   **Pagination**: The practice of splitting large lists into pages using a `cursor`.
    *   *Example*: A database query returns 10,000 rows. The Server sends the first 100 and a cursor. The Client requests the next 100 using that cursor.
*   **Progress Token**: A unique ID used to report the progress of a long-running operation.
    *   *Example*: Client sends `progressToken: 123` with a tool call. Server sends notifications: `123: 10%`, `123: 50%`, `123: Done`.
*   **Prompt**: A reusable template defined by the Server to help the User or Client construct a query.
    *   *Example*: A "Git Commit" prompt that automatically reads `git diff` and asks the LLM to "Write a commit message for these changes."
*   **Request**: A message that expects a response. Must have a unique `id`.
    *   *Example*: `{ "jsonrpc": "2.0", "id": 5, "method": "ping" }`.
*   **Resource**: A passive data source (file, database row) identified by a URI.
    *   *Example*: `postgres://db/users/schema` provides the table schema so the LLM knows how to write SQL queries.
*   **Resource Template**: A pattern (like `/users/{id}`) that describes a dynamic set of resources.
    *   *Example*: `file:///logs/{date}/*.log` tells the Client "I can read any log file if you give me the date."
*   **Response**: The message returned after a Request. Must match the Request's `id`.
    *   *Example*: `{ "jsonrpc": "2.0", "id": 5, "result": {} }`.
*   **Root**: A filesystem path that the Client gives the Server permission to access.
    *   *Example*: The Client tells the Server "You are allowed to read files in `/home/user/project`." The Server cannot read `/etc/passwd`.

### **S - T**
*   **Sampling**: A capability where the **Server** asks the **Client** to run an LLM inference ("Please complete this text for me"). This reverses the usual flow.
    *   *Example*: A Server reads a 10MB log file (too big to send) and asks the Client's LLM to "Summarize the errors in this text" locally.
*   **Server**: The process that provides tools, resources, and prompts.
    *   *Example*: The `sqlite-mcp-server` provides access to a SQLite database file.
*   **Session**: The duration of the connection between Client and Server.
    *   *Example*: Starts when the Client spawns the Server process and ends when the Client kills it or the connection drops.
*   **SSE (Server-Sent Events)**: A transport mechanism using HTTP, useful for web-based MCP connections.
    *   *Example*: A web-based chat interface connects to a remote MCP server via `http://api.example.com/mcp/sse`.
*   **Stdio**: Standard Input/Output. The default transport mechanism where messages are sent via the command line pipes.
    *   *Example*: The Client runs `spawn("node", ["server.js"])` and writes JSON-RPC messages to the process's `stdin`.
*   **Text Content**: The standard content type for strings, code, and JSON.
    *   *Example*: `{ "type": "text", "text": "The weather is sunny." }`.
*   **Tool**: An executable function exposed by the Server that the Client can invoke.
    *   *Example*: `send_slack_message(channel, text)` is a tool exposed by a Slack MCP Server.
*   **Transport**: The underlying communication channel (Stdio, SSE, HTTP).
    *   *Example*: "We are using the Stdio transport for local development and SSE for production."

### **U - Z**
*   **URI (Uniform Resource Identifier)**: The unique address of a Resource (e.g., `file:///home/user/data.txt`).
    *   *Example*: `postgres://localhost/users` identifies a database table; `file:///c:/logs/error.log` identifies a local file.
*   **User**: The human interacting with the Client.
    *   *Example*: You, the developer, typing "Fix this bug" into the VS Code Chat window.

