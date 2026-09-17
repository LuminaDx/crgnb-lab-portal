/* Dev portal auth + orders. Client-side only. Replace with Firebase/Auth0 for production. */
const STORAGE_USERS = "crgnb_users_v3";
const STORAGE_SESSION = "crgnb_session_v1";
const STORAGE_ORDERS = "crgnb_orders_v1";

const PRODUCTS = [
  { sku: "CARBA5-20", name: "Carbapenemase 5-plex lateral flow", pack: "20 cassettes", why: "Detects and differentiates KPC, NDM, VIM, IMP and OXA-48-like enzymes from a cultured isolate in ~15 minutes." },
  { sku: "FDC30-50", name: "Siderophore cephalosporin AST disk 30 µg", pack: "50 disks", why: "Disk diffusion screen on standard Mueller-Hinton agar for last-line Gram-negative isolates." },
  { sku: "COMASP-8", name: "Siderophore cephalosporin BMD panel", pack: "8 MIC determinations + iron-depleted broth", why: "Confirmatory MIC when the disk is in a grey zone or a quantitative result is required." },
  { sku: "QC-GN-SET", name: "Gram-negative AST QC strains", pack: "2–3 lyophilised strains", why: "On-kit quality control for disk and MIC methods." }
];

function seed() {
  if (!localStorage.getItem(STORAGE_USERS)) {
    const users = [
      { email: "test@lab.demo", name: "Demo Laboratory", org: "Demo Hospital Laboratory", role: "lab", status: "approved", noPassword: true },
      { email: "dsmit@pharmacommercialconsulting.com", name: "D Smit", org: "Pharma Commercial Consulting", role: "admin", status: "approved", noPassword: true }
    ];
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  }
}
seed();

function users() { return JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]"); }
function saveUsers(list) { localStorage.setItem(STORAGE_USERS, JSON.stringify(list)); }
function session() { return JSON.parse(localStorage.getItem(STORAGE_SESSION) || "null"); }
function setSession(user) { localStorage.setItem(STORAGE_SESSION, JSON.stringify({ email: user.email, role: user.role, status: user.status, name: user.name, org: user.org })); }
function clearSession() { localStorage.removeItem(STORAGE_SESSION); }
function orders() { return JSON.parse(localStorage.getItem(STORAGE_ORDERS) || "[]"); }
function saveOrders(list) { localStorage.setItem(STORAGE_ORDERS, JSON.stringify(list)); }

function paintNav() {
  const slot = document.getElementById("auth-slot");
  if (!slot) return;
  const s = session();
  if (!s) {
    slot.innerHTML = `<a class="btn btn-outline" href="login.html">Log in</a><a class="btn btn-lime" href="register.html">Register lab</a>`;
    return;
  }
  slot.innerHTML = `<span class="note" style="margin-right:8px">${s.org} · ${s.status}</span>
    ${s.role === "admin" ? `<a class="btn btn-outline" href="admin.html">Review</a>` : ""}
    <a class="btn btn-lime" href="order.html">Order kits</a>
    <button class="btn btn-outline" id="logout-btn">Log out</button>`;
  document.getElementById("logout-btn")?.addEventListener("click", () => { clearSession(); location.href = "index.html"; });
}

function requireLab() {
  const s = session();
  if (!s) { location.href = "login.html"; return null; }
  return s;
}

document.addEventListener("DOMContentLoaded", paintNav);

/* Register */
window.handleRegister = function (e) {
  e.preventDefault();
  const form = e.target;
  const record = {
    name: form.name.value.trim(),
    email: form.email.value.trim().toLowerCase(),
    org: form.org.value.trim(),
    roleType: form.roleType.value,
    nata: form.nata.value.trim(),
    phone: form.phone.value.trim(),
    address: form.address.value.trim(),
    reason: form.reason.value.trim(),
    password: form.password.value,
    role: "lab",
    status: "pending",
    submitted: new Date().toISOString()
  };
  if (users().some(u => u.email === record.email)) {
    showMsg("register-msg", "That email is already registered.", "bad");
    return;
  }
  saveUsers([...users(), record]);
  // Also post to Formspree if configured
  postFormspree(form);
  showMsg("register-msg", "Request received. Link will verify that this is an eligible hospital or NATA laboratory before a login is activated. You will not be charged.", "ok");
  form.reset();
};

window.handleLogin = function (e) {
  e.preventDefault();
  const email = e.target.email.value.trim().toLowerCase();
  const password = (e.target.password.value || "");
  const user = users().find(u => {
    if (u.email !== email) return false;
    if (u.noPassword || !u.password) return true;
    return u.password === password;
  });
  if (!user) { showMsg("login-msg", "Email not recognised.", "bad"); return; }
  if (user.status !== "approved") {
    showMsg("login-msg", "This account is still pending Link verification. Kits cannot be ordered until approved.", "warn");
    return;
  }
  setSession(user);
  location.href = user.role === "admin" ? "admin.html" : "order.html";
};

window.handleOrder = function (e) {
  e.preventDefault();
  const s = requireLab();
  if (!s) return;
  if (s.status !== "approved") {
    showMsg("order-msg", "Account not yet approved.", "bad");
    return;
  }
  const lines = PRODUCTS.map(p => ({
    sku: p.sku,
    name: p.name,
    qty: Number(document.getElementById("qty-" + p.sku).value || 0)
  })).filter(l => l.qty > 0);
  if (!lines.length) { showMsg("order-msg", "Select at least one kit line.", "warn"); return; }
  const order = {
    id: "ORD-" + Date.now().toString().slice(-8),
    when: new Date().toISOString(),
    lab: s,
    lines,
    notes: e.target.notes.value.trim(),
    deliverTo: e.target.deliverTo.value.trim()
  };
  saveOrders([order, ...orders()]);
  postFormspree(e.target, order);
  showMsg("order-msg", `Order ${order.id} submitted. No invoice will be raised. Link will confirm dispatch to the verified laboratory address.`, "ok");
  e.target.reset();
};

window.renderOrderTable = function () {
  const s = requireLab();
  if (!s) return;
  const box = document.getElementById("order-table");
  if (s.status !== "approved") {
    box.innerHTML = `<div class="alert alert-warn">This login is not approved yet.</div>`;
    document.getElementById("order-form")?.classList.add("hidden");
    return;
  }
  box.innerHTML = `<table><thead><tr><th>Kit component</th><th>Pack</th><th>What it does</th><th>Qty</th></tr></thead><tbody>${
    PRODUCTS.map(p => `<tr>
      <td><strong>${p.name}</strong><br><span class="note">${p.sku}</span></td>
      <td>${p.pack}</td>
      <td>${p.why}</td>
      <td><input class="qty" id="qty-${p.sku}" type="number" min="0" value="0"></td>
    </tr>`).join("")
  }</tbody></table>`;
};

window.renderAdmin = function () {
  const s = requireLab();
  if (!s || s.role !== "admin") { location.href = "login.html"; return; }
  const pending = users().filter(u => u.role === "lab");
  document.getElementById("admin-users").innerHTML = pending.map(u => `
    <div class="card">
      <div class="status ${u.status}">${u.status}</div>
      <h3>${u.org}</h3>
      <p>${u.name} · ${u.email}<br>${u.roleType || ""} · NATA/lab no. ${u.nata || "—"}<br>${u.address || ""}</p>
      <p class="note">${u.reason || ""}</p>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="btn btn-lime" onclick="setStatus('${u.email}','approved')">Approve</button>
        <button class="btn btn-outline" onclick="setStatus('${u.email}','rejected')">Decline</button>
      </div>
    </div>`).join("") || "<p class='note'>No lab registrations yet.</p>";
  document.getElementById("admin-orders").innerHTML = orders().map(o => `
    <div class="card">
      <h3>${o.id}</h3>
      <p>${o.lab.org} · ${o.lab.email}<br>${new Date(o.when).toLocaleString()}</p>
      <ul>${o.lines.map(l => `<li>${l.qty} × ${l.name} (${l.sku})</li>`).join("")}</ul>
      <p class="note">${o.deliverTo || ""} ${o.notes || ""}</p>
    </div>`).join("") || "<p class='note'>No orders yet.</p>";
};

window.setStatus = function (email, status) {
  saveUsers(users().map(u => u.email === email ? { ...u, status } : u));
  renderAdmin();
};

function showMsg(id, text, kind) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = "alert alert-" + kind;
  el.textContent = text;
}

function postFormspree(form, extra) {
  const endpoint = window.FORMSPREE_ENDPOINT;
  if (!endpoint || endpoint.includes("REPLACE")) return;
  const data = extra ? { ...extra, source: "CRGNB lab portal" } : Object.fromEntries(new FormData(form).entries());
  fetch(endpoint, {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).catch(() => {});
}
