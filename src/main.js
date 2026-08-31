import { bindApp } from "./ui.js";
import { installDocumentModelContext } from "./polyfill.js";
import { getRegisteredTools, registerDecisionTools } from "./webmcp.js";
import "./style.css";

const root = document.querySelector("#app");
/** @type {{ source: "native" | "polyfill" | "unavailable", error: string | null, tools: Array<{ name: string, description?: string }> }} */
const webmcp = {
  source: "unavailable",
  error: null,
  tools: [],
};

let source;
try {
  source = installDocumentModelContext();
  webmcp.source = document.modelContext ? source : "unavailable";
} catch (error) {
  webmcp.source = "unavailable";
  webmcp.error = error instanceof Error ? error.message : String(error);
}

async function boot() {
  try {
    await registerDecisionTools();
    webmcp.tools = await getRegisteredTools();
  } catch (error) {
    if (!webmcp.error) {
      webmcp.error = error instanceof Error ? error.message : String(error);
    }
    if (webmcp.source !== "unavailable" && webmcp.tools.length === 0) {
      webmcp.source = document.modelContext ? webmcp.source : "unavailable";
    }
  }

  bindApp(root, () => webmcp);
}

boot();
