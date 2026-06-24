/* ============================================================
   Promotions / Flyers — page publique Sandoo
   Charge les flyers de l'entreprise depuis Supabase.
   Chaque flyer : image (cliquable = agrandir) + télécharger + partager WhatsApp.
   ============================================================ */

(function () {
  if (typeof SUPABASE_READY === "undefined" || !SUPABASE_READY) { showEmpty(); return; }
  if (!window.supabase || !window.supabase.createClient) { showEmpty(); return; }

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const esc = (s) => (s || "").toString().replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  function showEmpty() {
    document.addEventListener("DOMContentLoaded", () => {
      const note = document.getElementById("promoNote");
      if (note) note.style.display = "block";
    });
  }

  // URL absolue du site (pour le message WhatsApp)
  const SITE_URL = window.location.origin + window.location.pathname.replace(/promotions\.html$/, "");

  document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("promoGrid");
    const note = document.getElementById("promoNote");
    if (!grid) return;

    // Résoudre l'entreprise par slug
    const { data: ent } = await db
      .from("entreprises").select("id").eq("slug", ENTREPRISE_SLUG).maybeSingle();
    if (!ent) { if (note) note.style.display = "block"; return; }

    // Charger les flyers
    const { data: flyers, error } = await db
      .from("promotions").select("*")
      .eq("entreprise_id", ent.id)
      .order("created_at", { ascending: false });

    if (error || !flyers || flyers.length === 0) {
      if (note) note.style.display = "block";
      return;
    }

    grid.innerHTML = flyers.map(f => {
      const titre = f.titre || "Promotion Sandoo Hair Beauty";
      const waMsg = encodeURIComponent(`${titre}\n\nDécouvrez nos formations chez Sandoo Hair Beauty 💇‍♀️\n${f.url}`);
      return `
      <div class="promo-card">
        <div class="promo-img" data-full="${esc(f.url)}">
          <img src="${esc(f.url)}" alt="${esc(titre)}" loading="lazy">
        </div>
        <div class="promo-body">
          <div class="promo-titre">${esc(titre)}</div>
          <div class="promo-actions">
            <a class="btn-dl" href="${esc(f.url)}" download target="_blank" rel="noopener">⬇️ Télécharger</a>
            <a class="btn-share" href="https://wa.me/?text=${waMsg}" target="_blank" rel="noopener">↗️ Partager</a>
          </div>
        </div>
      </div>`;
    }).join("");

    // Lightbox (agrandir au clic)
    const lb = document.getElementById("lightbox");
    const lbImg = document.getElementById("lbImg");
    const lbClose = document.getElementById("lbClose");
    grid.querySelectorAll(".promo-img").forEach(el => {
      el.addEventListener("click", () => {
        lbImg.src = el.getAttribute("data-full");
        lb.classList.add("on");
      });
    });
    if (lbClose) lbClose.addEventListener("click", () => lb.classList.remove("on"));
    if (lb) lb.addEventListener("click", (e) => { if (e.target === lb) lb.classList.remove("on"); });
  });
})();
