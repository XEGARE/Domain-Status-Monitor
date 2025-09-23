const successList = document.getElementById("successList")
const errorList = document.getElementById("errorList")
const reloadBtn = document.getElementById("reloadBtn")
const availableTitle = document.getElementById("availableTitle")
const unavailableTitle = document.getElementById("unavailableTitle")

const copyAvailableBtn = document.getElementById("copyAvailableBtn")
const copyUnavailableBtn = document.getElementById("copyUnavailableBtn")

const copySVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
        <path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2"/>
        <path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/>
    </svg>
`

const doneSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
         viewBox="0 0 24 24">
        <path fill="currentColor"
              d="M9 16.2L4.8 12l-1.4 1.4L9 19L21 7l-1.4-1.4z"/>
    </svg>
`

function handleCopyClick(btn, text) {
    navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = doneSVG
        setTimeout(() => {
            btn.innerHTML = copySVG
        }, 1500)
    })
}

function createListItem(domain, isSuccess) {
    const li = document.createElement("li")
    li.className = `domain-item ${isSuccess ? "success" : "error"}`

    const btn = document.createElement("button")
    btn.className = "image-btn"

    btn.innerHTML = copySVG

    btn.onclick = () => {
        handleCopyClick(btn, domain)
    }

    li.textContent = domain + " "
    li.appendChild(btn)
    return li
}

function renderDomains(domains) {
    const successDomains = domains?.success || []
    const errorDomains = domains?.error || []

    successList.innerHTML = ""
    errorList.innerHTML = ""

    successDomains.forEach((domain) =>
        successList.appendChild(createListItem(domain, true))
    )
    errorDomains.forEach((domain) =>
        errorList.appendChild(createListItem(domain, false))
    )

    availableTitle.style.display = successDomains.length > 0 ? "block" : "none"
    copyAvailableBtn.style.display =
        successDomains.length > 0 ? "block" : "none"
    successList.style.display = successDomains.length > 0 ? "block" : "none"

    unavailableTitle.style.display = errorDomains.length > 0 ? "block" : "none"
    copyUnavailableBtn.style.display =
        errorDomains.length > 0 ? "block" : "none"
    errorList.style.display = errorDomains.length > 0 ? "block" : "none"

    if (successDomains.length === 0 && errorDomains.length === 0) {
        const hintId = "noDomainsHint"
        let hint = document.getElementById(hintId)
        if (!hint) {
            hint = document.createElement("p")
            hint.id = hintId
            hint.style.fontStyle = "italic"
            hint.textContent = chrome.i18n.getMessage("emptyDomains")
            document.body.insertBefore(hint, reloadBtn.nextSibling)
        }
        hint.style.display = "block"
    } else {
        const hint = document.getElementById("noDomainsHint")
        if (hint) hint.style.display = "none"

        copyAvailableBtn.innerHTML = copySVG
        copyUnavailableBtn.innerHTML = copySVG

        copyAvailableBtn.onclick = () => {
            const domains = Array.from(successList.querySelectorAll("li")).map(
                (li) => li.firstChild.textContent.trim()
            )
            if (domains.length > 0) {
                handleCopyClick(copyAvailableBtn, domains.join("\n"))
            }
        }

        copyUnavailableBtn.onclick = () => {
            const domains = Array.from(errorList.querySelectorAll("li")).map(
                (li) => li.firstChild.textContent.trim()
            )
            if (domains.length > 0) {
                handleCopyClick(copyUnavailableBtn, domains.join("\n"))
            }
        }
    }
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id

    chrome.storage.local.get([`tab_${tabId}`], (result) => {
        renderDomains(result[`tab_${tabId}`] || { success: [], error: [] })
    })

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes[`tab_${tabId}`]) {
            renderDomains(
                changes[`tab_${tabId}`].newValue || { success: [], error: [] }
            )
        }
    })

    reloadBtn.onclick = () => {
        chrome.storage.local.remove(`tab_${tabId}`)
        successList.innerHTML = ""
        errorList.innerHTML = ""
        chrome.runtime.sendMessage({ action: "clearTabDomains", tabId })

        chrome.tabs.reload(tabId)
    }
})

document.addEventListener("DOMContentLoaded", () => {
    availableTitle.textContent = chrome.i18n.getMessage("availableDomains")
    unavailableTitle.textContent = chrome.i18n.getMessage("unavailableDomains")

    reloadBtn.title = chrome.i18n.getMessage("reloadPage")
})
