/* ==========================================================================
   SoundScape Studio - Extension Service Worker (Manifest V3)
   Manages background lifetime events and configures the Side Panel behavior.
   ========================================================================== */

// Log installation event for debugging
chrome.runtime.onInstalled.addListener(() => {
  console.log("SoundScape Studio Extension Installed successfully.");
});

// Configure Side Panel behavior: open the side panel when clicking the extension icon.
// Since we have no default popup, this click behavior works seamlessly.
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .then(() => {
      console.log("Side panel behavior successfully configured to open on action click.");
    })
    .catch((error) => {
      console.error("Error configuring side panel behavior:", error);
    });
}
