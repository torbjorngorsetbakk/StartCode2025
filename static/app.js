console.log("Loaded app.js v3");
console.log("renderTopChart kjøres");

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Network error: " + r.status);
  return r.json();
}

let customers = [];
let products = {}; // cache fra server (bygges lokalt fra purchases)
let chart = null;
let initialized = false;

async function init() {
  customers = await fetchJSON("/api/customers");
  const select = document.getElementById("customer-select");
  select.innerHTML = customers.map(c => `<option value="${c.customer_id}">${c.name}</option>`).join('');
  select.addEventListener("change", onCustomerChange);
  document.getElementById("refresh").addEventListener("click", () => onCustomerChange());

  // last top produkter overall for diagram
  const top = await fetchJSON("/api/top-products"); // returns [[pid, count],...]
  const labels = top.map(x => String(x[0]));
  const values = top.map(x => x[1]);
  renderTopChart(labels, values);

  // select first customer
  onCustomerChange();
}

async function onCustomerChange() {
  const select = document.getElementById("customer-select");
  const cid = select.value;

  // Finn kunden i listen
  const customer = customers.find(c => c.customer_id === cid);

  // Hent kjøpsdata
  const history = await fetchJSON(`/api/customer/${cid}/history`);
  const top = await fetchJSON(`/api/customer/${cid}/top`);

  // --- Oppdater kundeinfo øverst på siden ---
  document.getElementById("customer-name").textContent = customer.name;
  document.getElementById("customer-id").textContent = customer.customer_id;
  document.getElementById("purchase-count").textContent = history.length;

  // --- Oppdater tabell og lister ---
  renderHistory(history);
  renderTopList(top);
}



function renderHistory(history) {
  const tbody = document.querySelector("#history-table tbody");
  tbody.innerHTML = "";
  tbody.innerHTML = history.map(h => {
    const date = new Date(h.ts).toLocaleString();
    const prods = h.product_ids.join(", ");
    return `<tr><td>${date}</td><td>${h.purchase_id}</td><td>${prods}</td></tr>`;
  }).join('');
}

function renderTopList(top) {
  const ul = document.getElementById("top-list");
  ul.innerHTML = top.map(t => `<li>${t[0]} — ${t[1]} kjøp</li>`).join('');
}

function renderTopChart(labels, values) {
  const ctx = document.getElementById("topChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
  type: "bar",
  data: {
    labels,
    datasets: [{
      label: "Antall kjøp",
      data: values
    }]
  },
  options: {
    responsive: false,          // 🔧 slå av auto-resizing
    maintainAspectRatio: false  // sikrer at høyden holder seg stabil
  }
  });
  }
  document.getElementById("btn-reco").addEventListener("click", async () => {
  const cid = document.getElementById("customer-select").value;
  const basket = document.getElementById("basket").value.trim();
  const recos = await fetchJSON(`/api/recommendations?customer_id=${cid}&basket=${encodeURIComponent(basket)}`);
  const ul = document.getElementById("reco-list");
  ul.innerHTML = recos.map(([pid,score]) => `<li>${pid} — score ${score}</li>`).join('');
});


window.addEventListener("load", init);

document.getElementById("toggle-history").addEventListener("click", () => {
  const container = document.getElementById("history-container");
  container.style.display = (container.style.display === "none") ? "block" : "none";
});

document.getElementById("btn-meal").addEventListener("click", async () => {
  const cid = document.getElementById("customer-select").value;
  const intent = document.getElementById("intent").value;
  const res = await fetchJSON(`/api/mealplan?customer_id=${cid}&intent=${encodeURIComponent(intent)}`);
  const div = document.getElementById("meal-result");

  if (res.error) {
    div.innerHTML = `<p style="color:#b00">${res.error}</p>`;
    return;
  }

  const items = res.shopping_list.map(x => x.productId ? `${x.tag} → ${x.productId}` : `${x.tag} (velg i butikk)`).join("<br>");
  div.innerHTML = `
    <p><strong>Oppskrift:</strong> ${res.recipe.name}</p>
    <p><strong>Score:</strong> ${res.score} — <strong>Rester brukt:</strong> ${(res.pantry_overlap*100).toFixed(0)}%</p>
    <p><strong>Mangler:</strong><br>${items || "Ingenting – du har alt!"}</p>
  `;
});
