/* ============================================================
   Galerie admin — Sandoo Hair Beauty
   Upload de photos dans le bucket "Images", dossier = slug entreprise.
   Réutilise la session Supabase ouverte par admin.js (window._db).
   ============================================================ */

(function () {
  const BUCKET = "Images";

  const $ = (id) => document.getElementById(id);
  const esc = (s) => (s || "").toString().replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  function status(el, msg, type) { if (el) { el.textContent = msg; el.className = "status-msg " + (type || ""); } }

  // --- Onglets (Inscriptions / Galerie / Promotions) ---
  document.querySelectorAll(".admin-tabs .tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const t = tab.getAttribute("data-tab");
      document.querySelectorAll(".admin-tabs .tab").forEach(x => x.classList.toggle("on", x === tab));
      $("tab-insc").style.display = (t === "insc") ? "block" : "none";
      $("tab-gal").style.display  = (t === "gal")  ? "block" : "none";
      const tp = $("tab-promo"); if (tp) tp.style.display = (t === "promo") ? "block" : "none";
      const title = $("panelTitle");
      if (title) title.textContent = (t === "gal") ? "Galerie photos" : (t === "promo") ? "Promotions & flyers" : "Préinscriptions";
    });
  });

  // Récupère l'entreprise (id + slug) de l'admin connecté
  async function getEntreprise(db) {
    // mon_entreprise() côté SQL renvoie l'id ; on lit le slug correspondant.
    const { data: prof, error: e1 } = await db
      .from("profils").select("entreprise_id").maybeSingle();
    if (e1 || !prof) return null;
    const { data: ent, error: e2 } = await db
      .from("entreprises").select("id, slug").eq("id", prof.entreprise_id).maybeSingle();
    if (e2 || !ent) return null;
    return ent;
  }

  // --- Charger et afficher la galerie ---
  async function chargerGalerie() {
    const db = window._db;
    if (!db) return;
    const liste = $("galListe"), cmp = $("galCompteur");
    const { data, error } = await db
      .from("galerie").select("*").order("created_at", { ascending: false });
    if (error) { if (cmp) cmp.textContent = "Erreur de chargement."; return; }
    if (cmp) cmp.textContent = (data.length === 0)
      ? "Aucune photo pour l'instant."
      : `${data.length} photo${data.length > 1 ? "s" : ""}`;
    liste.innerHTML = data.map(p => `
      <div class="gal-item">
        <img src="${esc(p.url)}" alt="${esc(p.titre || "")}" loading="lazy">
        <div class="gal-meta">
          ${p.titre ? `<b>${esc(p.titre)}</b>` : ""}
          ${p.categorie ? `<span class="gal-cat">${esc(p.categorie)}</span>` : ""}
        </div>
        <button class="gal-del" data-id="${p.id}" data-chemin="${esc(p.chemin)}">Supprimer</button>
      </div>`).join("");

    liste.querySelectorAll(".gal-del").forEach(btn => {
      btn.addEventListener("click", () => supprimer(btn.getAttribute("data-id"), btn.getAttribute("data-chemin")));
    });
  }
  window.chargerGalerie = chargerGalerie;

  // --- Upload d'une nouvelle photo ---
  const form = $("galForm");
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const db = window._db;
    const st = $("galStatus"), btn = $("galSubmit");
    status(st, "", "");
    const file = $("galFile").files[0];
    if (!file) { status(st, "Choisissez une photo.", "err"); return; }
    if (file.size > 5 * 1024 * 1024) { status(st, "Photo trop lourde (max 5 Mo). Réduisez-la et réessayez.", "err"); return; }

    btn.disabled = true; status(st, "Envoi en cours…", "");

    const ent = await getEntreprise(db);
    if (!ent) { status(st, "Entreprise introuvable (profil non lié ?).", "err"); btn.disabled = false; return; }

    // Nom de fichier unique dans le dossier de l'entreprise : slug/timestamp-nom.ext
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const chemin = `${ent.slug}/${Date.now()}.${ext}`;

    // 1) upload du fichier
    const up = await db.storage.from(BUCKET).upload(chemin, file, { cacheControl: "3600", upsert: false });
    if (up.error) { status(st, "Échec de l'envoi : " + up.error.message, "err"); btn.disabled = false; return; }

    // 2) URL publique
    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(chemin);
    const url = pub.publicUrl;

    // 3) enregistrement en base
    const ins = await db.from("galerie").insert({
      entreprise_id: ent.id,
      titre: $("galTitre").value.trim() || null,
      categorie: $("galCat").value || null,
      chemin: chemin,
      url: url
    });
    if (ins.error) {
      // rollback : on retire le fichier uploadé si l'insert échoue
      await db.storage.from(BUCKET).remove([chemin]);
      status(st, "Erreur d'enregistrement : " + ins.error.message, "err"); btn.disabled = false; return;
    }

    status(st, "Photo ajoutée ✓", "ok");
    form.reset();
    btn.disabled = false;
    chargerGalerie();
  });

  // --- Supprimer une photo (fichier + ligne) ---
  async function supprimer(id, chemin) {
    if (!confirm("Supprimer cette photo ?")) return;
    const db = window._db;
    // supprimer le fichier du bucket
    if (chemin) await db.storage.from(BUCKET).remove([chemin]);
    // supprimer la ligne
    const { error } = await db.from("galerie").delete().eq("id", id);
    if (error) { alert("Erreur : " + error.message); return; }
    chargerGalerie();
  }
})();
