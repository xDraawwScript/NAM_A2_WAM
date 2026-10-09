// Mini DOM pour tester les composants de l'interface dans Node (sans navigateur ni dépendance).
// Seul ce dont les composants ont besoin est simulé : éléments, attributs, enfants, événements,
// focus et <dialog> (showModal / close / événement cancel).

class FakeEvent {
  constructor(type, init = {}) { Object.assign(this, {type, defaultPrevented: false, ...init}); }
  preventDefault() { this.defaultPrevented = true; }
  stopPropagation() {}
}

class FakeElement {
  constructor(doc, tag) {
    Object.assign(this, {ownerDocument: doc, tagName: tag.toUpperCase(), children: [], parent: null, attributes: new Map(), listeners: new Map(),
      textContent: '', className: '', id: '', hidden: false, disabled: false, type: '', tabIndex: -1, open: false, dataset: {}, style: {}});
  }
  get isConnected() { let node = this; while (node.parent) node = node.parent; return node === this.ownerDocument.body; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); if (name === 'id') this.id = String(value); }
  getAttribute(name) { return name === 'id' ? this.id || null : this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  append(...items) { for (const item of items) {
    const node = typeof item === 'string' ? Object.assign(new FakeElement(this.ownerDocument, '#text'), {textContent: item}) : item; node.parent?.children.splice(node.parent.children.indexOf(node), 1); node.parent = this; this.children.push(node); } }
  prepend(node) { this.append(node); this.children.unshift(this.children.pop()); }
  replaceChildren(...nodes) { for (const child of [...this.children]) child.remove(); this.append(...nodes); }
  /** Sélecteurs simples seulement : « tag », « .classe » ou « tag[open] ». */
  querySelector(selector) { return this.find(matcher(selector)); }
  remove() { if (this.parent) { this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; } }
  addEventListener(type, listener) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(listener); }
  dispatchEvent(event) { for (const listener of this.listeners.get(event.type) ?? []) listener.call(this, event); return !event.defaultPrevented; }
  click() { if (!this.disabled) this.dispatchEvent(new FakeEvent('click', {target: this})); }
  focus() { this.ownerDocument.activeElement = this; }
  showModal() { if (this.open) throw new Error('InvalidStateError: dialog already open'); this.open = true; }
  close() { this.open = false; this.dispatchEvent(new FakeEvent('close', {target: this})); }
  /** Échap dans un dialog modal : le navigateur émet « cancel », puis ferme si rien ne l'en empêche. */
  pressEscape() { if (this.dispatchEvent(new FakeEvent('cancel', {target: this}))) this.close(); }
  keydown(key, target = this) { this.dispatchEvent(new FakeEvent('keydown', {key, target})); }
  get all() { return this.children.flatMap((child) => [child, ...child.all]); }
  find(predicate) { return this.all.find(predicate) ?? null; }
}

function matcher(selector) {
  const [, tag, cls, attr] = /^([a-z]*)(?:\.([\w-]+))?(?:\[(\w+)\])?$/u.exec(selector);
  return (node) => (!tag || node.tagName === tag.toUpperCase()) && (!cls || node.className.split(' ').includes(cls)) && (!attr || Boolean(node[attr]));
}

export function createFakeDocument() {
  const doc = {activeElement: null, listeners: new Map()};
  doc.addEventListener = (type, listener) => { if (!doc.listeners.has(type)) doc.listeners.set(type, []); doc.listeners.get(type).push(listener); };
  doc.dispatchEvent = (event) => { for (const listener of doc.listeners.get(event.type) ?? []) listener(event); return !event.defaultPrevented; };
  doc.querySelector = (selector) => doc.body.querySelector(selector);
  doc.createElement = (tag) => new FakeElement(doc, tag);
  doc.body = new FakeElement(doc, 'body');
  return doc;
}

export {FakeEvent};
