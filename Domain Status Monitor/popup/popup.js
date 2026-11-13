const successList = document.getElementById("successList")
const errorList = document.getElementById("errorList")
const routesList = document.getElementById("routesList")
const reloadBtn = document.getElementById("reloadBtn")
const resetStorageBtn = document.getElementById("resetStorageBtn")
const copyAvailableBtn = document.getElementById("copyAvailableBtn")
const copyUnavailableBtn = document.getElementById("copyUnavailableBtn")
const copyRoutesBtn = document.getElementById("copyRoutesBtn")
const themeBtn = document.getElementById("themeBtn")
const themeMenu = document.getElementById("themeMenu")
const themeOptions = Array.from(document.querySelectorAll(".theme-option"))
const tabBtns = Array.from(document.querySelectorAll(".tab-btn"))
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")

let currentTheme = "auto"
let activeTabId = null
let isFirstRender = true

const copySVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"
         aria-hidden="true">
        <rect x="8" y="8" width="12" height="13" rx="2"/>
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>
    </svg>
`

const doneSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
         aria-hidden="true">
        <path d="m5 12 4 4L19 6"/>
    </svg>
`

function setButtonLabel(btn, label) {
    btn.title = label
    btn.setAttribute("aria-label", label)
}

function applyTheme(theme) {
    currentTheme = ["auto", "light", "dark"].includes(theme) ? theme : "auto"
    document.documentElement.dataset.theme =
        currentTheme === "auto"
            ? (systemTheme.matches ? "dark" : "light")
            : currentTheme

    const themeMessages = {
        auto: "themeAuto",
        light: "themeLight",
        dark: "themeDark",
    }
    const label = chrome.i18n.getMessage(themeMessages[currentTheme])
    document.getElementById("themeLabel").textContent = label
    document.getElementById("themeIcon").setAttribute(
        "href",
        `#icon-${currentTheme}`,
    )
    setButtonLabel(
        themeBtn,
        `${chrome.i18n.getMessage("appearance")}: ${label}`,
    )
    themeOptions.forEach((option) => {
        option.setAttribute(
            "aria-checked",
            option.dataset.themeChoice === currentTheme,
        )
    })
}

function setThemeMenuOpen(open, restoreFocus = false) {
    themeMenu.hidden = !open
    themeBtn.setAttribute("aria-expanded", open)
    if (open) {
        themeOptions
            .find((option) => option.dataset.themeChoice === currentTheme)
            .focus()
    } else if (restoreFocus) {
        themeBtn.focus()
    }
}

themeBtn.onclick = () => setThemeMenuOpen(themeMenu.hidden)
themeBtn.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault()
        setThemeMenuOpen(true)
    }
})

themeOptions.forEach((option) => {
    option.onclick = () => {
        applyTheme(option.dataset.themeChoice)
        chrome.storage.local.set({ theme: currentTheme })
        setThemeMenuOpen(false, true)
    }
})

themeMenu.addEventListener("keydown", (event) => {
    const index = themeOptions.indexOf(document.activeElement)
    let nextIndex
    if (event.key === "ArrowDown") {
        nextIndex = (index + 1) % themeOptions.length
    }
    if (event.key === "ArrowUp") {
        nextIndex = (index + themeOptions.length - 1) % themeOptions.length
    }
    if (event.key === "Home") nextIndex = 0
    if (event.key === "End") nextIndex = themeOptions.length - 1
    if (nextIndex !== undefined) {
        event.preventDefault()
        themeOptions[nextIndex].focus()
    }
})

document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".theme-control")) setThemeMenuOpen(false)
})

document.addEventListener("keydown", (event) => {
    if (!themeMenu.hidden && (event.key === "Escape" || event.key === "Tab")) {
        if (event.key === "Escape") event.preventDefault()
        setThemeMenuOpen(false, true)
    }
})

systemTheme.addEventListener("change", () => {
    if (currentTheme === "auto") applyTheme("auto")
})

document.documentElement.lang = chrome.i18n.getUILanguage()
document.getElementById("extensionVersion").textContent =
    `v${chrome.runtime.getManifest().version}`
document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = chrome.i18n.getMessage(element.dataset.i18n)
})
document.querySelectorAll("[data-i18n-label]").forEach((element) => {
    const label = chrome.i18n.getMessage(element.dataset.i18nLabel)
    element.setAttribute("aria-label", label)
    element.title = label
})

applyTheme("auto")
chrome.storage.local.get({ theme: "auto" }, (items) => applyTheme(items.theme))

function handleCopyClick(btn, text) {
    navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = doneSVG
        btn.classList.add("copied")
        setTimeout(() => {
            btn.innerHTML = copySVG
            btn.classList.remove("copied")
        }, 1500)
    })
}

function createCopyButton(text) {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "image-btn"
    btn.innerHTML = copySVG
    setButtonLabel(btn, chrome.i18n.getMessage("copy"))
    btn.onclick = () => handleCopyClick(btn, text)
    return btn
}

function createDomainListItem(domain, isSuccess) {
    const li = document.createElement("li")
    li.className = `domain-item ${isSuccess ? "success" : "error"}`

    const text = document.createElement("span")
    text.className = "url-text"
    text.textContent = domain

    li.appendChild(text)
    li.appendChild(createCopyButton(domain))
    return li
}

function createRouteListItem(route) {
    const li = document.createElement("li")
    li.className = "domain-item"

    const method = route.method || "UNKNOWN"
    const badge = document.createElement("span")
    badge.className = `method-badge method-${method}`
    badge.textContent = method

    const text = document.createElement("span")
    text.className = "url-text"
    text.textContent = route.url

    li.appendChild(badge)
    li.appendChild(text)
    li.appendChild(createCopyButton(route.url))
    return li
}

function selectTab(tabName) {
    tabBtns.forEach((btn) => {
        const selected = btn.dataset.tab === tabName
        btn.classList.toggle("active", selected)
        btn.setAttribute("aria-selected", selected)
        btn.tabIndex = selected ? 0 : -1
        const panel = document.getElementById(btn.getAttribute("aria-controls"))
        panel.classList.toggle("active", selected)
        panel.hidden = !selected
    })
    updateEmptyState()
}

function updateEmptyState() {
    const domainsSelected = document.getElementById("routesTab").hidden
    const hasDomains =
        !document.getElementById("successGroup").hidden ||
        !document.getElementById("errorGroup").hidden
    const hasRoutes = !document.getElementById("routesGroup").hidden
    document.getElementById("emptyState").hidden =
        domainsSelected ? hasDomains : hasRoutes
}

tabBtns.forEach((btn, index) => {
    btn.onclick = () => {
        isFirstRender = false
        selectTab(btn.dataset.tab)
    }
    btn.addEventListener("keydown", (event) => {
        let nextIndex
        if (event.key === "ArrowRight") {
            nextIndex = (index + 1) % tabBtns.length
        }
        if (event.key === "ArrowLeft") {
            nextIndex = (index + tabBtns.length - 1) % tabBtns.length
        }
        if (event.key === "Home") nextIndex = 0
        if (event.key === "End") nextIndex = tabBtns.length - 1
        if (nextIndex !== undefined) {
            event.preventDefault()
            tabBtns[nextIndex].click()
            tabBtns[nextIndex].focus()
        }
    })
})

document.querySelectorAll(".stat").forEach((btn) => {
    btn.onclick = () => {
        const group = document.getElementById(btn.dataset.target)
        if (group.hidden) return
        isFirstRender = false
        selectTab(btn.dataset.tab)
        group.focus({ preventScroll: true })
        group.scrollIntoView({
            block: "start",
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
        })
    }
})

function renderDomains(domains) {
    const successDomains = domains?.success || []
    const errorDomains = domains?.error || []
    const routes = domains?.routes || []

    successList.replaceChildren(
        ...successDomains.map((domain) => createDomainListItem(domain, true)),
    )
    errorList.replaceChildren(
        ...errorDomains.map((domain) => createDomainListItem(domain, false)),
    )
    routesList.replaceChildren(...routes.map(createRouteListItem))

    document.getElementById("successCount").textContent = successDomains.length
    document.getElementById("errorCount").textContent = errorDomains.length
    document.getElementById("routesCount").textContent = routes.length
    document.getElementById("domainsTabCount").textContent =
        successDomains.length + errorDomains.length
    document.getElementById("routesTabCount").textContent = routes.length
    document.getElementById("successGroup").hidden = successDomains.length === 0
    document.getElementById("errorGroup").hidden = errorDomains.length === 0
    document.getElementById("routesGroup").hidden = routes.length === 0
    document.querySelectorAll(".stat").forEach((btn) => {
        btn.disabled = document.getElementById(btn.dataset.target).hidden
    })

    const hasDomains = successDomains.length > 0 || errorDomains.length > 0
    const hasAnyData = hasDomains || routes.length > 0

    if (isFirstRender && hasAnyData) {
        selectTab(hasDomains ? "domains" : "routes")
        isFirstRender = false
    }
    updateEmptyState()
}

for (const [btn, list] of [
    [copyAvailableBtn, successList],
    [copyUnavailableBtn, errorList],
    [copyRoutesBtn, routesList],
]) {
    btn.innerHTML = copySVG
    btn.onclick = () => {
        const values = Array.from(list.querySelectorAll(".url-text")).map(
            (element) => element.textContent,
        )
        if (values.length > 0) handleCopyClick(btn, values.join("\n"))
    }
}

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return
    if (changes.theme) applyTheme(changes.theme.newValue)
    if (activeTabId !== null && changes[`tab_${activeTabId}`]) {
        renderDomains(changes[`tab_${activeTabId}`].newValue)
    }
})

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0]
    const siteName = document.getElementById("siteName")
    siteName.textContent = chrome.i18n.getMessage("currentTab")
    if (!tab) {
        reloadBtn.disabled = true
        renderDomains()
        return
    }
    activeTabId = tab.id
    if (tab.url) {
        try {
            const url = new URL(tab.url)
            siteName.textContent = url.hostname || url.protocol
            siteName.title = tab.url
        } catch (e) {
            console.error("Failed to read tab URL:", e)
        }
    }

    chrome.runtime.sendMessage(
        { action: "getTabDomains", tabId: activeTabId },
        renderDomains,
    )
})

reloadBtn.onclick = () => {
    if (activeTabId === null) return
    reloadBtn.disabled = true
    chrome.runtime.sendMessage(
        { action: "clearTabDomains", tabId: activeTabId },
        (response) => {
            if (chrome.runtime.lastError || !response?.ok) {
                reloadBtn.disabled = false
                return
            }
            renderDomains()
            chrome.tabs.reload(activeTabId, { bypassCache: true }, () => {
                reloadBtn.disabled = false
                if (chrome.runtime.lastError) {
                    console.error(
                        "Failed to reload tab:",
                        chrome.runtime.lastError.message,
                    )
                }
            })
        },
    )
}

resetStorageBtn.onclick = () => {
    chrome.runtime.sendMessage(
        { action: "clearAllExtensionData" },
        (response) => {
            if (response?.ok) location.reload()
        },
    )
}