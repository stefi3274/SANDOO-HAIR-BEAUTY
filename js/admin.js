/* ============================================================
   Admin Sandoo — inscriptions (Supabase + RLS multi-entreprises)
   La connexion identifie l'entreprise via le profil ; les règles
   RLS garantissent que l'admin ne voit QUE ses inscriptions.
   ============================================================ */

(function () {
  const setupNote = document.getElementById("setupNote");
  const loginCard = document.getElementById("loginCard");
  const panel = document.getElementById("panel");

  if (typeof SUPABASE_READY === "undefined" || !SUPABASE_READY) {
    if (setupNote) setupNote.style.display = "block";
    return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    if (setupNote) { setupNote.style.display = "block"; setupNote.textContent = "La librairie Supabase n'a pas pu se charger (connexion internet ?)."; }
    return;
  }

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window._db = db; // partagé avec galerie-admin.js (même session)
  const $ = (id) => document.getElementById(id);
  const esc = (s) => (s || "").toString().replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  let filtre = "tous"; // tous | nouveau | traite
  let cache = [];

  function status(el, msg, type) { el.textContent = msg; el.className = "status-msg " + (type || ""); }

  async function refreshAuth() {
    const { data } = await db.auth.getSession();
    if (data.session) {
      loginCard.style.display = "none";
      panel.style.display = "block";
      charger();
      if (window.chargerGalerie) window.chargerGalerie();
    } else {
      loginCard.style.display = "block";
      panel.style.display = "none";
    }
  }

  // Connexion
  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const st = $("loginStatus");
    status(st, "", "");
    const { error } = await db.auth.signInWithPassword({
      email: $("admEmail").value.trim(),
      password: $("admPass").value
    });
    if (error) status(st, "Connexion impossible : " + error.message, "err");
    else refreshAuth();
  });

  $("logoutBtn").addEventListener("click", async () => { await db.auth.signOut(); refreshAuth(); });

  // Filtres
  document.querySelectorAll(".admin-filter button").forEach(b => {
    b.addEventListener("click", () => {
      filtre = b.getAttribute("data-f");
      document.querySelectorAll(".admin-filter button").forEach(x => x.classList.toggle("on", x === b));
      rendre();
    });
  });

  // Charger les inscriptions (RLS filtre déjà par entreprise)
  async function charger() {
    const st = $("listStatus");
    status(st, "", "");
    const { data, error } = await db
      .from("enregistrements")
      .select("*")
      .eq("type", "inscription")
      .order("created_at", { ascending: false });
    if (error) { status(st, "Erreur de chargement : " + error.message, "err"); return; }
    cache = data || [];
    rendre();
  }

  function rendre() {
    const box = $("liste");
    let items = cache;
    if (filtre === "nouveau") items = cache.filter(i => i.statut !== "traite");
    if (filtre === "traite") items = cache.filter(i => i.statut === "traite");

    const cN = cache.filter(i => i.statut !== "traite").length;
    $("compteur").textContent = `${cache.length} inscription(s) · ${cN} nouvelle(s)`;

    if (!items.length) {
      box.innerHTML = '<div class="admin-empty">Aucune inscription dans cette catégorie.</div>';
      return;
    }
    box.innerHTML = items.map(it => {
      const d = it.donnees || {};
      const traite = it.statut === "traite";
      const champs = Object.entries(d).map(([k, v]) =>
        `<div class="f"><span>${esc(k)} :</span> ${esc(v)}</div>`).join("");
      const date = new Date(it.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
      const nom = d.Nom || d.nom || "Inscription";
      return `
      <div class="insc ${traite ? "traite" : ""}">
        <div class="insc-top">
          <span class="nom">${esc(nom)}</span>
          <span class="badge ${traite ? "traite" : "nouveau"}">${traite ? "Traitée" : "Nouveau"}</span>
        </div>
        <div class="insc-fields">${champs}</div>
        <div class="insc-date">Reçue le ${esc(date)}</div>
        <div class="insc-actions">
          <button class="btn-done" data-id="${it.id}" data-statut="${traite ? "nouveau" : "traite"}">
            ${traite ? "↩ Marquer nouveau" : "✓ Marquer traitée"}
          </button>
          <button class="btn-rm" data-del="${it.id}">Supprimer</button>
        </div>
      </div>`;
    }).join("");

    // actions
    box.querySelectorAll(".btn-done").forEach(b => b.addEventListener("click", async () => {
      const id = b.getAttribute("data-id");
      const nouveauStatut = b.getAttribute("data-statut");
      const { error } = await db.from("enregistrements").update({ statut: nouveauStatut }).eq("id", id);
      if (error) status($("listStatus"), "Erreur : " + error.message, "err"); else charger();
    }));
    box.querySelectorAll(".btn-rm").forEach(b => b.addEventListener("click", async () => {
      if (!confirm("Supprimer cette inscription ?")) return;
      const id = b.getAttribute("data-del");
      const { error } = await db.from("enregistrements").delete().eq("id", id);
      if (error) status($("listStatus"), "Erreur : " + error.message, "err"); else charger();
    }));
  }

  refreshAuth();
})();
