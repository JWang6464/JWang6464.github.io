// Year
document.getElementById("year").textContent = new Date().getFullYear();

// Open dialogs
document.querySelectorAll("[data-dialog]").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-dialog");
    const dlg = document.getElementById(id);
    if (dlg) dlg.showModal();
  });
});

// Close dialogs
document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => btn.closest("dialog")?.close());
});

// Click backdrop to close
document.querySelectorAll("dialog").forEach(dlg => {
  dlg.addEventListener("click", e => {
    const r = dlg.getBoundingClientRect();
    const inside = r.top <= e.clientY && e.clientY <= r.bottom &&
                   r.left <= e.clientX && e.clientX <= r.right;
    if (!inside) dlg.close();
  });
});
