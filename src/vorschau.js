/* Vorschau im Megamenü: Fährt man über einen Link [data-vorschau="x"], erscheint die Karte [data-vorschau-karte="x"]
   (Klasse is-aktiv). Bilder und Texte der Karten sind normale Webflow-Elemente. */
export function vorschau(el) {
  const karten = [...el.querySelectorAll('[data-vorschau-karte]')];
  if (!karten.length) return;
  const zeige = id => karten.forEach(k => k.classList.toggle('is-aktiv', k.getAttribute('data-vorschau-karte') === id));
  el.querySelectorAll('[data-vorschau]').forEach(l => {
    const id = l.getAttribute('data-vorschau');
    l.addEventListener('mouseenter', () => zeige(id));
    l.addEventListener('focus', () => zeige(id));
  });
}
