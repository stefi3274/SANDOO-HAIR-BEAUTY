/* ============================================================
   Promotions admin — Sandoo Hair Beauty
   Publication de flyers dans le bucket "images", dossier slug/promos/.
   Réutilise la session Supabase ouverte par admin.js (window._db).
   ============================================================ */

(function () {
  const BUCKET = "images";

  const $ = (id) => document.getElementById(id);
  const esc = (s) => (s || "").toString().replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  function status(el, msg, type) { if (el) { el.textContent = msg; el.className = "status-msg " + (type || ""); } }

  async function getEntreprise(db) {
    const { data: prof } = await db.from("profils").select("entreprise_id").maybeSingle();
    if (!prof) return null;
    const { data: ent } = await db.from("entreprises").select("id, slug").eq("id", prof.entreprise_id).maybeSingle();
    return ent || null;
  }

  // --- Charger et afficher les flyers (admin) ---
  async function chargerPromos() {
    const db = window._db;
    if (!db) return;
    const liste = $("promoListe"), cmp = $("promoCompteur");
    if (!liste) return;
    const { data, error } = await db
      .from("promotions").select("*").order("created_at", { ascending: false });
    if (error) { if (cmp) cmp.textContent = "Erreur de chargement."; return; }
    if (cmp) cmp.textContent = (data.length === 0)
      ? "Aucun flyer publié."
      : `${data.length} flyer${data.length > 1 ? "s" : ""} en ligne`;
    liste.innerHTML = data.map(p => `
      <div class="gal-item">
        <img src="${esc(p.url)}" alt="${esc(p.titre || "")}" loading="lazy">
        <div class="gal-meta">${p.titre ? `<b>${esc(p.titre)}</b>` : '<span style="color:var(--muted)">Sans titre</span>'}</div>
        <button class="gal-del" data-id="${p.id}" data-chemin="${esc(p.chemin)}">Supprimer</button>
      </div>`).join("");
    liste.querySelectorAll(".gal-del").forEach(btn => {
      btn.addEventListener("click", () => supprimer(btn.getAttribute("data-id"), btn.getAttribute("data-chemin")));
    });
  }
  window.chargerPromos = chargerPromos;

  // --- Publier un flyer ---
  const form = $("promoForm");
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const db = window._db;
    const st = $("promoStatus"), btn = $("promoSubmit");
    status(st, "", "");
    const file = $("promoFile").files[0];
    if (!file) { status(st, "Choisissez un flyer.", "err"); return; }
    if (file.size > 5 * 1024 * 1024) { status(st, "Image trop lourde (max 5 Mo). Réduisez-la et réessayez.", "err"); return; }

    btn.disabled = true; status(st, "Publication en cours…", "");

    const ent = await getEntreprise(db);
    if (!ent) { status(st, "Entreprise introuvable (profil non lié ?).", "err"); btn.disabled = false; return; }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const chemin = `${ent.slug}/promos/${Date.now()}.${ext}`;

    const up = await db.storage.from(BUCKET).upload(chemin, file, { cacheControl: "3600", upsert: false });
    if (up.error) { status(st, "Échec de l'envoi : " + up.error.message, "err"); btn.disabled = false; return; }

    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(chemin);
    const url = pub.publicUrl;

    const ins = await db.from("promotions").insert({
      entreprise_id: ent.id,
      titre: $("promoTitre").value.trim() || null,
      chemin: chemin,
      url: url
    });
    if (ins.error) {
      await db.storage.from(BUCKET).remove([chemin]);
      status(st, "Erreur d'enregistrement : " + ins.error.message, "err"); btn.disabled = false; return;
    }

    status(st, "Flyer publié ✓", "ok");
    form.reset();
    btn.disabled = false;
    chargerPromos();
  });

  // --- Supprimer un flyer ---
  async function supprimer(id, chemin) {
    if (!confirm("Supprimer ce flyer ?")) return;
    const db = window._db;
    if (chemin) await db.storage.from(BUCKET).remove([chemin]);
    const { error } = await db.from("promotions").delete().eq("id", id);
    if (error) { alert("Erreur : " + error.message); return; }
    chargerPromos();
  }
})();
