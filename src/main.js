import { bindApp } from "./ui.js";
import { installDocumentModelContext } from "./polyfill.js";
import { getRegisteredTools, registerDecisionTools } from "./webmcp.js";
import "./style.css";

const source = installDocumentModelContext();

const root = document.querySelector("#app");
/** @type {{ source: "native" | "polyfill" | "unavailable", error: string | null, tools: Array<{ name: string, description?: string }> }} */
const webmcp = {
  source: document.modelContext ? source : "unavailable",
  error: null,
  tools: [],
};

async function boot() {
  try {
    await registerDecisionTools();
    webmcp.tools = await getRegisteredTools();
  } catch (error) {
    webmcp.source = document.modelContext ? webmcp.source : "unavailable";
    webmcp.error = error instanceof Error ? error.message : String(error);
  }

  bindApp(root, () => webmcp);
}

boot();
