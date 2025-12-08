# 🗣️ Writing for the Ear: A Guide to TTS-Friendly Documentation

## 🎯 Objective
To ensure all project documentation is optimized for **Text-to-Speech (TTS)** engines (such as Apple's "Spoken Content," Siri, or screen readers). This allows users to "listen" to the documentation while commuting or working, treating our knowledge base like a podcast.

---

## 🏗️ Structural Best Practices

### 1. Use Hierarchical Headings (H1-H6)
TTS engines use headings as "chapter markers." Users often skip forward by heading.
*   **Do:** Use H1 for the Title, H2 for major sections, H3 for subsections.
*   **Don't:** Use bold text (`**Topic**`) as a fake heading. The engine won't recognize it as a navigation point.

### 2. Bullet Points & Numbered Lists
Lists create natural pauses and help the listener mentally organize information.
*   **Do:** Use standard Markdown bullets (`*` or `-`) or numbers (`1.`).
*   **Why:** The engine usually announces "List of 5 items" before starting, preparing the listener.

---

## ✍️ Content & Style

### 1. Punctuation is "Breath"
TTS engines rely entirely on punctuation to know when to pause.
*   **Commas (`,`)**: Short pause. Use them to break up long ideas.
*   **Periods (`.`)**: Full stop/Long pause.
*   **Colons (`:`)**: Expectation of a list or definition.
*   **Avoid Run-on Sentences:** If a sentence is 4 lines long, the listener will get lost. Break it in two.

### 2. Acronyms & Abbreviations
Robots don't always know if "US" means "United States" or the word "Us."
*   **Do:** Write "U.S." or "U.S.A." for the country.
*   **Do:** Capitalize known acronyms (e.g., "JSON", "API"). Most modern engines read "JSON" correctly as "Jay-Sawn", but "SQL" is often read as "Squeal" or "Ess-Que-Ell" depending on context.
*   **Tip:** When in doubt, write it out on the first mention: "Model Context Protocol (MCP)."

### 3. Avoid "Visual" References
*   **Bad:** "See the diagram below in red." (The listener cannot see red).
*   **Good:** "As shown in the architecture diagram below..."

---

## 💻 Technical Elements

### 1. Code Blocks
Always specify the language in your code fences.
*   **Bad:**
    ```
    const a = 1;
    ```
    (Engine might read punctuation literally or guess).
*   **Good:**
    ```javascript
    const a = 1;
    ```
    (Engine switches to "Code Mode," pronouncing symbols like `{` as "open curly brace" if configured, or reading the logic more naturally).

### 2. The Enemy: ASCII Art
Never use ASCII art for diagrams in core documentation.
*   **Why:** A TTS engine will read: "Dash dash dash vertical bar plus sign dash dash." It is excruciating for the listener.
*   **Solution:** Use **Mermaid.js** diagrams. GitHub renders them visually, but the raw text is just code, which is skippable or readable as logic. Alternatively, provide a text summary *before* the diagram.

### 3. Tables
Keep tables simple. Complex nested tables are impossible to follow by ear.
*   **Rule:** If a table has more than 3 columns, consider turning it into a list or a series of H3 sections.

---

## 🎨 Visuals & Emojis

### 1. Alt Text is Mandatory
Images must have descriptive Alt Text.
*   **Markdown:** `![Architecture Diagram showing the User connecting to the API](image.png)`
*   **Why:** The engine reads the Alt Text. If missing, it might read the filename "IMG underscore 552 dot PNG," which is useless.

### 2. Emojis
Use them sparingly as "flavor," not as words.
*   **Bad:** "Don't be 😡." (Reads: "Don't be pouting face.")
*   **Good:** "⚠️ Warning: Do not delete the database." (Reads: "Warning emoji. Warning: Do not delete...")
*   **Note:** Emojis at the start of headings (like in this document) work well because they act as a distinct sound cue.

---

## ❌ Comparison Example

### 🔴 Bad for TTS
> **Setup**
> Click the button > wait 5 secs... done!
> -------------------
> | ID | Name |
> | -- | ---- |
> | 1  | Bob  |
>
> P.S. don't forget the config.

*   *Audio Experience:* "Bold Setup. Click the button greater than wait 5 secs dot dot dot done exclamation point. Dash dash dash... Vertical bar ID vertical bar Name... P dot S dot don't forget the config."

### 🟢 Good for TTS
> ## Setup Process
> 1. Click the **Submit** button.
> 2. Wait 5 seconds.
