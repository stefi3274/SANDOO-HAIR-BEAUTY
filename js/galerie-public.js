/* ============================================================
   Galerie publique — Sandoo Hair Beauty
   Affiche les photos de l'entreprise (slug) depuis Supabase.
   S'il n'y a pas encore de photo, garde l'aperçu par défaut.
   ============================================================ */

(function () {
  if (typeof SUPABASE_READY === "undefined" || !SUPABASE_READY) return;
  if (!window.supabase || !window.supabase.createClient) return;

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const esc = (s) => (s || "").toString().replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("galleryGrid");
    const note = document.getElementById("galleryNote");
    if (!grid) return;

    // 1) résoudre l'entreprise depuis le slug
    const { data: ent } = await db
      .from("entreprises").select("id").eq("slug", ENTREPRISE_SLUG).maybeSingle();
    if (!ent) return;

    // 2) charger ses photos
    const { data: photos, error } = await db
      .from("galerie").select("*")
      .eq("entreprise_id", ent.id)
      .order("created_at", { ascending: false });

    if (error || !photos || photos.length === 0) return; // garder l'aperçu par défaut

    // 3) afficher les vraies photos
    grid.innerHTML = photos.map((p, i) => {
      const big = (i % 6 === 0) ? " big" : (i % 4 === 0 ? " tall" : "");
      return `<div class="gtile${big}" style="background:none">
        <img src="${esc(p.url)}" alt="${esc(p.titre || "Réalisation")}" loading="lazy"
             style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">
        ${(p.titre || p.categorie) ? `<span class="lbl">${esc(p.titre || p.categorie)}</span>` : ""}
      </div>`;
    }).join("");

    if (note) note.style.display = "none";
  });
})();
