const TOOL_NAME = /^[A-Za-z0-9_.-]{1,128}$/;

/**
 * Fallback ModelContext for browsers that do not ship native WebMCP yet.
 * Installs only document.modelContext (current API). Does not touch navigator.modelContext.
 */
class DocumentModelContext extends EventTarget {
  #tools = new Map();
  ontoolchange = null;

  /**
   * @param {{ name: string, title?: string, description: string, inputSchema?: object, annotations?: object, execute: Function }} tool
   * @param {{ signal?: AbortSignal }} [options]
   */
  async registerTool(tool, options = {}) {
    if (options.signal?.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }

    const normalized = normalizeTool(tool, this.#tools);
    this.#tools.set(normalized.name, normalized);
    this.#notify();

    if (options.signal) {
      options.signal.addEventListener(
        "abort",
        () => {
          if (this.#tools.delete(normalized.name)) {
            this.#notify();
          }
        },
        { once: true }
      );
    }
  }

  /**
   * @returns {Promise<Array<{ name: string, title?: string, description: string, inputSchema?: object, origin: string, window: Window }>>}
   */
  async getTools() {
    return [...this.#tools.values()]
      .map((tool) => toRegisteredTool(tool))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  /**
   * Chrome-preview execution helper. Not required by the Community Group draft.
   * @param {{ name: string } | string} tool
   * @param {string} inputJson
   */
  async executeTool(tool, inputJson) {
    const name = typeof tool === "string" ? tool : tool?.name;
    const registered = this.#tools.get(name);
    if (!registered) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const args = parseInput(inputJson);
    const result = await registered.execute(args);
    return typeof result === "string" ? result : JSON.stringify(result);
  }

  #notify() {
    const event = new Event("toolchange");
    try {
      this.ontoolchange?.call(this, event);
    } catch (error) {
      console.warn("document.modelContext.ontoolchange handler threw:", error);
    }
    this.dispatchEvent(event);
  }
}

/**
 * @param {unknown} tool
 * @param {Map<string, object>} existing
 */
function normalizeTool(tool, existing) {
  if (!tool || typeof tool !== "object") {
    throw new TypeError("registerTool(tool) requires a tool object");
  }
  if (typeof tool.name !== "string" || !TOOL_NAME.test(tool.name)) {
    throw new TypeError("Tool name must be 1–128 ASCII letters, digits, '_', '-', or '.'");
  }
  if (typeof tool.description !== "string" || tool.description.trim().length === 0) {
    throw new TypeError("Tool description must be a non-empty string");
  }
  if (typeof tool.execute !== "function") {
    throw new TypeError("Tool execute must be a function");
  }
  if (existing.has(tool.name)) {
    throw new Error(`Tool already registered: ${tool.name}`);
  }

  return {
    name: tool.name,
    title: typeof tool.title === "string" ? tool.title : undefined,
    description: tool.description,
    inputSchema: cloneJson(tool.inputSchema),
    annotations: tool.annotations && typeof tool.annotations === "object" ? { ...tool.annotations } : undefined,
    execute: tool.execute,
  };
}

function toRegisteredTool(tool) {
  return {
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: tool.annotations,
    origin: window.location.origin,
    window,
  };
}

function cloneJson(value) {
  if (value === undefined) {
    return { type: "object", properties: {} };
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    throw new TypeError("Tool inputSchema must be JSON-serializable");
  }
}

function parseInput(inputJson) {
  if (inputJson === undefined || inputJson === null || inputJson === "") {
    return {};
  }
  if (typeof inputJson === "object") {
    return inputJson;
  }
  const parsed = JSON.parse(inputJson);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new TypeError("Tool input must be a JSON object");
  }
  return parsed;
}

/**
 * Install current WebMCP surface when the browser does not provide it.
 * @returns {"native" | "polyfill"}
 */
export function installDocumentModelContext() {
  if (document.modelContext) {
    return "native";
  }

  const context = new DocumentModelContext();
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    enumerable: true,
    value: context,
  });
  return "polyfill";
}
