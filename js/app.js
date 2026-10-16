/* Testing program portal — HCP gate, hospital codes, email orders. Dev concept. */
const STORAGE_HCP = "crgnb_hcp_v1";
const STORAGE_ORDER = "crgnb_last_order";

/* Demo hospital codes. In production these come from Link. */
const CODES = {
  "DISC-DEMO": {
    name: "Demo Regional Hospital",
    tier: "discs",
    label: "Disc testing only"
  },
  "FULL-DEMO": {
    name: "Demo Tertiary Hospital",
    tier: "full",
    label: "Discs + confirmatory MIC options"
  }
};

const PRODUCTS = {
  discs: [
    {
      sku: "FDC30-50",
      name: "Siderophore cephalosporin AST disk 30 µg",
      pack: "50 disks",
      why: "Disk diffusion screen on standard Mueller-Hinton agar for carbapenem-resistant Gram-negative isolates.",
      max: 5
    }
  ],
  full: [
    {
      sku: "FDC30-50",
      name: "Siderophore cephalosporin AST disk 30 µg",
      pack: "50 disks",
      why: "Disk diffusion screen on standard Mueller-Hinton agar for carbapenem-resistant Gram-negative isolates.",
      max: 5
    },
    {
      sku: "COMASP-8",
      name: "Siderophore cephalosporin BMD panel (ComASP-style)",
      pack: "8 MIC determinations",
      why: "Confirmatory MIC when the disk result is in the area of technical uncertainty or a quantitative result is required.",
      max: 2
    }
  ]
};

function hcpOk() {
  return localStorage.getItem(STORAGE_HCP) === "yes";
}
function setHcp() {
  localStorage.setItem(STORAGE_HCP, "yes");
}
function clearHcp() {
  localStorage.removeItem(STORAGE_HCP);
}

function paintNav() {
  const slot = document.getElementById("auth-slot");
  if (!slot) return;
  if (!hcpOk()) {
    slot.innerHTML = `<a class="btn btn-navy" href="index.html">Healthcare professional</a>`;
    return;
  }
  slot.innerHTML = `
    <a href="education.html">Testing</a>
    <a class="btn btn-outline" href="order.html">Order materials</a>
    <button class="btn btn-outline" id="exit-btn" type="button">Exit</button>`;
  document.getElementById("exit-btn")?.addEventListener("click", () => {
    clearHcp();
    location.href = "index.html";
  });
}
document.addEventListener("DOMContentLoaded", paintNav);

function requireHcp() {
  if (!hcpOk()) location.href = "index.html";
}

window.handleGate = function (e) {
  e.preventDefault();
  const form = e.target;
  const pro = form.pro.checked;
  const id = (form.regid.value || "").trim();
  const msg = document.getElementById("gate-msg");
  if (!pro) {
    msg.className = "msg bad";
    msg.textContent = "Please confirm you are a healthcare professional.";
    return;
  }
  if (id.length < 6 || id.length > 14 || !/^[A-Za-z0-9]+$/.test(id)) {
    msg.className = "msg bad";
    msg.textContent = "Enter a valid registration number (6–14 letters or digits).";
    return;
  }
  setHcp();
  location.href = "education.html";
};

window.lookupCode = function (e) {
  e.preventDefault();
  const code = (e.target.code.value || "").trim().toUpperCase();
  const box = document.getElementById("code-result");
  const rec = CODES[code];
  if (!rec) {
    box.innerHTML = `<div class="msg bad">Code not recognised. Contact the program team if you believe this is an error.</div>`;
    return;
  }
  sessionStorage.setItem("crgnb_code", code);
  const list = PRODUCTS[rec.tier];
  box.innerHTML = `
    <div class="msg ok">${rec.name} — ${rec.label}</div>
    <form id="order-form" onsubmit="handleOrder(event)">
      <input type="hidden" name="code" value="${code}">
      <input type="hidden" name="tier" value="${rec.tier}">
      <h3>Available materials</h3>
      ${list.map(p => `
        <div class="product">
          <strong>${p.name}</strong><br>
          <span class="note">${p.pack} · max ${p.max} packs per order</span><br>
          <span class="note">${p.why}</span><br>
          <label>Quantity (packs)</label>
          <input class="qty" type="number" name="qty_${p.sku}" min="0" max="${p.max}" value="0">
        </div>`).join("")}
      <h3>Delivery details</h3>
      <label>Hospital / laboratory name</label>
      <input name="site" required value="${rec.name}">
      <label>NATA / laboratory identifier (if available)</label>
      <input name="nata" placeholder="Optional">
      <label>Contact name</label>
      <input name="contact" required>
      <label>Email</label>
      <input name="email" type="email" required>
      <label>Phone</label>
      <input name="phone" required>
      <label>Delivery address</label>
      <textarea name="address" rows="3" required></textarea>
      <label>Notes</label>
      <textarea name="notes" rows="2"></textarea>
      <button class="btn btn-navy" type="submit" style="margin-top:16px">Submit request</button>
      <p class="note">Requests are reviewed before fulfilment. Materials and shipping are provided under the program. You will not be charged.</p>
    </form>`;
};

window.handleOrder = function (e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  const items = [];
  for (const [k, v] of Object.entries(data)) {
    if (k.startsWith("qty_") && Number(v) > 0) {
      items.push({ sku: k.replace("qty_", ""), qty: Number(v) });
    }
  }
  if (!items.length) {
    alert("Select at least one product with quantity greater than zero.");
    return;
  }
  const payload = {
    ...data,
    items,
    submitted: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_ORDER, JSON.stringify(payload));

  // Formspree placeholder — replace FORM_ID when ready
  const FORM_ID = "YOUR_FORMSPREE_ID";
  if (FORM_ID && FORM_ID !== "YOUR_FORMSPREE_ID") {
    fetch(`https://formspree.io/f/${FORM_ID}`, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  const summary = document.getElementById("code-result");
  summary.innerHTML = `
    <div class="msg ok">
      Request received. The program team will review it and confirm fulfilment.<br>
      Site: ${data.site}<br>
      Contact: ${data.contact} · ${data.email}<br>
      Items: ${items.map(i => i.sku + " × " + i.qty).join(", ")}
    </div>
    <p class="note">This is a development confirmation. In production the request is emailed to the program inbox for review before the distributor is notified.</p>`;
};
