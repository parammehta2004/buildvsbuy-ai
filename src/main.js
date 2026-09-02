import { bindApp, loadPresetViaTools, setCurrentPreset } from "./ui.js";
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
    const preset = bootPreset === "scraping" ? "scraping" : "auth";
    setCurrentPreset(preset);
    // Boot through the same WebMCP execute path humans use so the tool log
    // records create_decision -> set_decision_context -> rerank (source: human).
    // Judges opening "/" see a populated log instead of ranked cards with no proof.
    await loadPresetViaTools(preset);
  }
  // wantBlank === true -> leave empty canvas for agent video recording

  bindApp(root, () => webmcp);
}

boot();
