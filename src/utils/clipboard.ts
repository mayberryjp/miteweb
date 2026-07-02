/**
 * Copy text to the clipboard.
 *
 * Uses the async Clipboard API when available (secure contexts: HTTPS or
 * localhost) and falls back to a temporary textarea + execCommand("copy")
 * for insecure contexts (e.g. the app served over plain HTTP on a LAN IP),
 * where navigator.clipboard is undefined.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  const value = text ?? "";

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the legacy approach below.
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const succeeded = document.execCommand("copy");
    document.body.removeChild(textarea);
    return succeeded;
  } catch {
    return false;
  }
};
