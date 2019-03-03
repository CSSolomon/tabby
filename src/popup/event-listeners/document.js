import "Polyfill"
import G from "../globals"
import { ctrlOrCmd } from "../keyutils"
import { getCurrentWindow } from "../wtutils"
import * as captureTab from "../captureTab"
import { getWindowFromTab, multiSelect, multiSelectToggle, resetSlideSelection, multiSelectReset, getTabId, getWindowId } from "../wtdom"

export function documentMouseOver(e) {
    if (e.button === 0) {
        if (e.target.classList.contains("tab-entry")) {
            if (ctrlOrCmd() && G.slideSelection.sliding) {
                multiSelect(e.target);
            } else {
                let tabId = getTabId(e.target);
                captureTab.captureTab(tabId).then(dataUri => {
                    if (dataUri !== null) {
                        let detailsImage = document.getElementById("details-img");
                        detailsImage.src = dataUri;
                    }
                    let detailsTitle = document.getElementById("details-title");
                    let detailsURL = document.getElementById("details-url");
                    browser.tabs.get(tabId).then(tab => {
                        detailsTitle.textContent = tab.title;
                        detailsURL.textContent = tab.url;
                        document.getElementById("details-placeholder").style.display = "none";
                        document.getElementById("tab-details").style.display = "inline-block";
                        document.getElementById("tab-details").setAttribute("data-tab_id", tabId);
                        if (tab.pinned) {
                            document.getElementById("details-pinned").style.display = "inline";
                        } else {
                            document.getElementById("details-pinned").style.display = "none";
                        }
                        if (tab.hidden) {
                            document.getElementById("details-hidden").style.display = "inline";
                        } else {
                            document.getElementById("details-hidden").style.display = "none";
                        }
                        if (tab.pinned && tab.hidden) {
                            document.getElementById("details-comma").style.display = "inline";
                        } else {
                            document.getElementById("details-comma").style.display = "none";
                        }
                    });
                });
            }
        }
    }
    e.preventDefault();
}

export function documentMouseUp(e) {
    if (G.slideSelection.sliding) resetSlideSelection();
}

export function documentClicked(e) {
    if (e.button === 0) {
        if (e.target.classList.contains("tab-entry")) {
            if (ctrlOrCmd()) {
                multiSelectToggle(e.target);
            } else {
                let tabId = getTabId(e.target);
                let parentWindowId = getWindowId(getWindowFromTab(e.target));
                browser.tabs.update(tabId, {
                    active: true
                });
                browser.windows.get(parentWindowId).then(w => {
                    getCurrentWindow().then(cw => {
                        if (w.id !== cw.id) {
                            browser.windows.update(w.id, {
                                focused: true
                            });
                        }
                        window.close();
                    });
                });
            }
        } else if (e.target.parentElement.classList.contains("window-entry")) {
            let windowId = getWindowId(e.target.parentElement);
            browser.windows.update(windowId, {
                focused: true
            });
        } else if (e.target.id === "details-close") {
            document.getElementById("details-placeholder").style.display = "inline-block";
            document.getElementById("tab-details").style.display = "none";
            browser.tabs.remove(getTabId(document.getElementById("tab-details")));
        } else if (e.target.classList.contains("tab-entry-remove-btn")) {
            let tabId = e.target.parentElement.parentElement.getAttribute("data-tab_id");
            let tabDetails = document.getElementById("tab-details");
            if (tabDetails.getAttribute("data-tab_id") === tabId) {
                tabDetails.style.display = "none";
                document.getElementById("details-placeholder").style.display = "inline-block";
            }
            browser.tabs.remove(parseInt(tabId));
        } else if (e.target.classList.contains("tab-entry-pin-btn")) {
            let tabId = getTabId(e.target.parentElement.parentElement);
            browser.tabs.get(tabId).then(tab => {
                if (tab.pinned) {
                    browser.tabs.update(tab.id, {
                        pinned: false
                    });
                } else {
                    browser.tabs.update(tab.id, {
                        pinned: true
                    });
                }
            });
        } else if (e.target.classList.contains("window-entry-remove-btn")) {
            let windowId = getWindowId(e.target.parentElement.parentElement.parentElement);
            browser.windows.remove(windowId);
        } else {
            if (G.isSelecting) multiSelectReset();
        }
    }
}

export function documentDragOver(e) {
    if (G.archive.classList.contains("saving-for-later")) {
        G.archive.classList.remove("saving-for-later");
    }
}

function isInlinePrintableKey(e) {
    if (typeof e.which === "undefined") {
        return true;
    } else if (typeof e.which === "number" && e.which > 0) {
        return !e.ctrlKey && !e.metaKey && !e.altKey && e.which !== 8 && e.which !== 13;
    }
}

export function documentKeyPressed(e) {
    if (isInlinePrintableKey(e)) {
        document.getElementById("search").focus();
    }
}
