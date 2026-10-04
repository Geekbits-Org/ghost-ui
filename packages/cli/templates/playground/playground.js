const component = document.querySelector('#component');
const parameters = document.querySelector('#parameters');
const status = document.querySelector('#status');
const controls = new Map();
let catalog = [], revision, busy = false;
const current = () => catalog.find(item => item.name === component.value);
function render() {
  const item = current();
  if (!item) return;
  const query = new URLSearchParams({ scheme: document.querySelector('#scheme').value, state: document.querySelector('#state').value });
  const args = [];
  for (const [name, input] of controls) {
    query.set(name, input.value);
    if (input.value) args.push(`${name}=${['disabled','required','invalid','urgent'].includes(name) ? input.value : JSON.stringify(input.value)}`);
  }
  document.querySelector('#preview').src = `/preview/${item.name}?${query}`;
  const context = item.name === 'author-card' ? ' primary_author' : item.name === 'pagination' ? ' pagination' : '';
  document.querySelector('#usage').textContent = `{{> "${item.partial}"${context}${args.map(arg => `\n    ${arg}`).join('')}\n}}`;
}
function selectComponent() {
  controls.clear(); parameters.replaceChildren();
  const item = current();
  if (!item) { status.textContent = 'No components installed. Run ghostcn add button (or another component), then reload.'; return; }
  document.querySelector('#description').textContent = item.description;
  const definitions = { ...item.parameters, ...Object.fromEntries(Object.keys(item.styleSlots).map(key => [key, { description: key === 'class' ? 'Root classes for this instance.' : `Classes for ${item.styleSlots[key].join(', ')}.` }])) };
  for (const [name, definition] of Object.entries(definitions)) {
    const boolean = ['disabled','required','invalid','urgent'].includes(name);
    const label = document.createElement('label'); label.append(document.createTextNode(name));
    const input = document.createElement(definition.options || boolean ? 'select' : 'input');
    input.name = name;
    if (input.tagName === 'SELECT') for (const value of boolean ? ['false','true'] : definition.options) { const option = document.createElement('option'); option.value = value; option.textContent = value; input.append(option); }
    input.value = item.defaults[name] || definition.default || (boolean ? 'false' : '');
    const help = document.createElement('small'); help.textContent = definition.description;
    label.append(input, help); parameters.append(label); controls.set(name, input);
    input.addEventListener('change', render);
  }
  status.textContent = 'Read-only preview. Your files have not been changed.';
  render();
}
async function loadCatalog() {
  const selected = component.value;
  const response = await fetch('/catalog');
  if (!response.ok) throw new Error('Cannot read installed components.');
  catalog = (await response.json()).components;
  component.replaceChildren();
  for (const item of catalog) { const option = document.createElement('option'); option.value = item.name; option.textContent = item.name; component.append(option); }
  if (catalog.some(item => item.name === selected)) component.value = selected;
  selectComponent();
}
component.addEventListener('change', selectComponent);
document.querySelector('#scheme').addEventListener('change', render);
document.querySelector('#state').addEventListener('change', render);
document.querySelector('#reload').addEventListener('click', render);
loadCatalog().catch(error => { status.textContent = error.message; });
setInterval(async () => {
  if (busy) return;
  busy = true;
  try {
    const response = await fetch('/revision');
    if (!response.ok) throw new Error('Cannot watch theme files.');
    const next = (await response.json()).revision;
    if (revision && next !== revision) {
      const fresh = await (await fetch('/catalog')).json();
      if (fresh.components.map(item => item.name).join(',') !== catalog.map(item => item.name).join(',')) await loadCatalog();
      else render();
      status.textContent = 'Reloaded after a theme file changed.';
    }
    revision = next;
  } catch (error) { status.textContent = `${error.message} Check the playground terminal.`; }
  finally { busy = false; }
}, 1000);
