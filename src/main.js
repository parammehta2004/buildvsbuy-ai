import { loadDefaultDemo, loadScrapingDemo } from "./decision.js";
import { bindApp, setCurrentPreset } from "./ui.js";
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

  const params = new URLSearchParams(window.location.search);
  const wantBlank = params.get("blank") === "1" || params.get("agent") === "1";
  const bootPreset = params.get("preset");

  if (!wantBlank) {
    if (bootPreset === "scraping") {
      setCurrentPreset("scraping");
      loadScrapingDemo();
    } else {
      // default (no params) OR ?preset=auth -> Auth demo
      setCurrentPreset("auth");
      loadDefaultDemo();
    }
  }
  // wantBlank === true -> leave empty canvas for agent video recording

  bindApp(root, () => webmcp);
}

boot();
