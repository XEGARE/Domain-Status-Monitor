let tabDomains = {}

function restoreStateFromStorage() {
    chrome.storage.local.get(null, (items) => {
        for (const key in items) {
            if (key.startsWith('tab_')) {
                const tabId = parseInt(key.replace('tab_', ''))
                const data = items[key]
                tabDomains[tabId] = {
                    success: new Set(data.success || []),
                    error: new Set(data.error || []),
                    routes: data.routes || []
                }
            }
        }
    })
}

function updateDomain(tabId, domain, url, method, isSuccess) {
    if (!tabDomains[tabId])
        tabDomains[tabId] = { success: new Set(), error: new Set(), routes: [] }

    if (isSuccess) {
        tabDomains[tabId].success.add(domain)
        tabDomains[tabId].error.delete(domain)
    } else {
        if (!tabDomains[tabId].success.has(domain)) {
            tabDomains[tabId].error.add(domain)
        }
    }

    const existingRoute = tabDomains[tabId].routes.find((r) => r.url === url)
    if (!existingRoute) {
        tabDomains[tabId].routes.push({ url, method })
    }

    chrome.storage.local.set({
        [`tab_${tabId}`]: {
            success: Array.from(tabDomains[tabId].success),
            error: Array.from(tabDomains[tabId].error),
            routes: tabDomains[tabId].routes,
        },
    })
}

function normalizeDomain(hostname) {
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname
}

chrome.webRequest.onCompleted.addListener(
    (details) => {
        const tabId = details.tabId
        if (tabId === -1) return

        const url = new URL(details.url)
        const domain = normalizeDomain(url.hostname)

        updateDomain(tabId, domain, details.url, details.method, true)
    },
    { urls: ["<all_urls>"] },
)

chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
        const tabId = details.tabId
        if (tabId === -1) return

        const url = new URL(details.url)
        const domain = normalizeDomain(url.hostname)

        updateDomain(tabId, domain, details.url, details.method, false)
    },
    { urls: ["<all_urls>"] },
)

chrome.tabs.onRemoved.addListener((tabId) => {
    delete tabDomains[tabId]
    chrome.storage.local.remove(`tab_${tabId}`)
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const tabId = msg.tabId

    if (msg.action === "getTabDomains") {
        const data = tabDomains[tabId] || {
            success: new Set(),
            error: new Set(),
            routes: [],
        }
        sendResponse({
            success: Array.from(data.success),
            error: Array.from(data.error),
            routes: data.routes,
        })
    } else if (msg.action === "clearTabDomains") {
        tabDomains[tabId] = { success: new Set(), error: new Set(), routes: [] }
        chrome.storage.local.remove(`tab_${tabId}`)
    }
})

restoreStateFromStorage()

chrome.runtime.onStartup.addListener(() => {
    restoreStateFromStorage()
})

chrome.runtime.onInstalled.addListener(() => {
    restoreStateFromStorage()
})
