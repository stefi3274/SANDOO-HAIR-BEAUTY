/* ============================================================
   Sandoo Hair Beauty — interactions
   Menu mobile, header au scroll, animations, formulaires.
   👉 Numéro WhatsApp : modifier la constante WA ci-dessous.
   ============================================================ */

const WA = "50942458255"; // ← numéro WhatsApp de l'école (format international)

document.addEventListener("DOMContentLoaded", () => {

  // Année footer
  document.querySelectorAll(".year").forEach(e => e.textContent = new Date().getFullYear());

  // Ombre header au scroll
  const header = document.querySelector("header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Menu mobile
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  if (burger && menu) {
    burger.addEventListener("click", () => {
      menu.classList.toggle("open");
      burger.classList.toggle("open");
    });
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      menu.classList.remove("open");
      burger.classList.remove("open");
    }));
  }

  // Animations au défilement
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } });
  }, { threshold: .12 });
  document.querySelectorAll(".reveal").forEach(el => obs.observe(el));

  // Formulaires -> WhatsApp (contact & inscription)
  document.querySelectorAll("form[data-wa]").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(form);
      let lignes = [`Bonjour Sandoo Hair Beauty !`, ``];
      for (const [key, val] of fd.entries()) {
        if (val && val.toString().trim()) lignes.push(`${key} : ${val}`);
      }
      const texte = encodeURIComponent(lignes.join("\n"));
      window.open(`https://wa.me/${WA}?text=${texte}`, "_blank");
    });
  });
});
