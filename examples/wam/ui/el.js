// Petit utilitaire partagé par les fenêtres du projet étudiant (Presets, Account).
// el('button', {class: 'x', text: 'OK', onclick: fn}, enfant1, enfant2) crée un élément DOM.
// Le texte passe toujours par textContent (jamais innerHTML) : un nom de preset ou un pseudo
// contenant du HTML s'affiche tel quel au lieu d'être interprété (pas d'injection).
export function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, '');
    else if (value !== false && value != null) node.setAttribute(key, value);
  }
  node.append(...children.filter(Boolean));
  return node;
}
