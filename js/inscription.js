/* ============================================================
   Inscription Sandoo — enregistre dans Supabase + ouvre WhatsApp
   ============================================================ */

const WA_SANDOO = "50942458255"; // numéro WhatsApp de l'école

(function () {
  const form = document.getElementById("inscriptionForm");
  if (!form) return;
  const statusEl = document.getElementById("inscStatus");

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "status-msg " + (type || "");
  }

  // Résout l'entreprise_id à partir du slug (via API REST publique)
  async function getEntrepriseId() {
    const url = `${SUPABASE_URL}/rest/v1/entreprises?slug=eq.${encodeURIComponent(ENTREPRISE_SLUG)}&select=id`;
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (!r.ok) throw new Error("lookup");
    const rows = await r.json();
    if (!rows.length) throw new Error("entreprise introuvable");
    return rows[0].id;
  }

  async function enregistrer(donnees) {
    const entreprise_id = await getEntrepriseId();
    const url = `${SUPABASE_URL}/rest/v1/enregistrements`;
    const r = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ entreprise_id, type: "inscription", donnees })
    });
    if (!r.ok) throw new Error("insert " + r.status);
  }

  function ouvrirWhatsApp(donnees) {
    let lignes = ["Bonjour Sandoo Hair Beauty !", "", "Nouvelle préinscription :", ""];
    for (const [k, v] of Object.entries(donnees)) {
      if (v && v.toString().trim()) lignes.push(`${k} : ${v}`);
    }
    const texte = encodeURIComponent(lignes.join("\n"));
    window.open(`https://wa.me/${WA_SANDOO}?text=${texte}`, "_blank");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", "");

    const fd = new FormData(form);
    const donnees = {};
    for (const [k, v] of fd.entries()) {
      if (v && v.toString().trim()) donnees[k] = v.toString().trim();
    }

    // 1) Tenter l'enregistrement en base (si Supabase configuré)
    let enregistre = false;
    if (typeof SUPABASE_READY !== "undefined" && SUPABASE_READY) {
      try {
        await enregistrer(donnees);
        enregistre = true;
      } catch (err) {
        enregistre = false; // on continue quand même vers WhatsApp
      }
    }

    // 2) Ouvrir WhatsApp dans tous les cas (l'école reçoit la demande)
    ouvrirWhatsApp(donnees);

    // 3) Message à l'élève
    if (enregistre) {
      setStatus("✓ Votre préinscription a bien été enregistrée. La fenêtre WhatsApp s'ouvre pour finaliser.", "ok");
      form.reset();
    } else {
      setStatus("Votre demande s'ouvre dans WhatsApp. Envoyez le message pour finaliser votre préinscription.", "ok");
    }
  });
})();
