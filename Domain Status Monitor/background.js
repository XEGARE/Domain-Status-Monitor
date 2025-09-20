let tabDomains = {}

function updateDomain(tabId, domain, isSuccess) {
    if (!tabDomains[tabId])
        tabDomains[tabId] = { success: new Set(), error: new Set() }

    if (isSuccess) {
        tabDomains[tabId].success.add(domain)
        tabDomains[tabId].error.delete(domain)
    } else {
        if (!tabDomains[tabId].success.has(domain)) {
            tabDomains[tabId].error.add(domain)
        }
    }

    chrome.storage.local.set({
        [`tab_${tabId}`]: {
            success: Array.from(tabDomains[tabId].success),
            error: Array.from(tabDomains[tabId].error),
        },
    })
}

chrome.webRequest.onCompleted.addListener(
    (details) => {
        const tabId = details.tabId
        if (tabId === -1) return
        const domain = new URL(details.url).hostname
        updateDomain(tabId, domain, true)
    },
    { urls: ["<all_urls>"] }
)

chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
        const tabId = details.tabId
        if (tabId === -1) return
        const domain = new URL(details.url).hostname
        updateDomain(tabId, domain, false)
    },
    { urls: ["<all_urls>"] }
)

chrome.tabs.onRemoved.addListener((tabId) => {
    delete tabDomains[tabId]
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const tabId = msg.tabId

    if (msg.action === "getTabDomains") {
        const data = tabDomains[tabId] || {
            success: new Set(),
            error: new Set(),
        }
        sendResponse({
            success: Array.from(data.success),
            error: Array.from(data.error),
        })
    } else if (msg.action === "clearTabDomains") {
        tabDomains[tabId] = { success: new Set(), error: new Set() }
        chrome.storage.local.remove(`tab_${tabId}`)
    }
})
