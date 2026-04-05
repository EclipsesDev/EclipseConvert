const select = document.getElementById("target") as HTMLSelectElement;
const savedMsg = document.getElementById("saved")!;

chrome.storage.sync.get("targetCurrency", (result) => {
  select.value = (result["targetCurrency"] as string | undefined) ?? "usd";
});

select.addEventListener("change", () => {
  chrome.storage.sync.set({ targetCurrency: select.value }, () => {
    savedMsg.classList.add("show");
    setTimeout(() => savedMsg.classList.remove("show"), 1500);
  });
});