const component = document.querySelector('#component');
const parameters = document.querySelector('#parameters');
const status = document.querySelector('#status');
const viewport = document.querySelector('#viewport');
const frameStage = document.querySelector('#frame-stage');
const copyUsage = document.querySelector('#copy-usage');
const controls = new Map();
const booleanParams = new Set(['disabled', 'required', 'invalid', 'urgent', 'decorative', 'open', 'hideDismiss', 'showPublic']);
let catalog = [], revision, busy = false, debounceTimer;
const current = () => catalog.find(item => item.name === component.value);
function render() {
  const item = current();
  if (!item) return;
  const query = new URLSearchParams({
    scheme: document.querySelector('#scheme').value,
    state: document.querySelector('#state').value,
    access: document.querySelector('#access')?.value || 'true'
  });
  const args = [];
  for (const [name, input] of controls) {
    query.set(name, input.value);
    if (booleanParams.has(name)) {
      if (input.value === 'true') args.push(`${name}=true`);
    } else if (input.value) {
      args.push(`${name}=${JSON.stringify(input.value)}`);
    }
  }
  document.querySelector('#preview').src = `/preview/${item.name}?${query}`;
  const context = item.name === 'author-card' ? ' primary_author' : item.name === 'pagination' ? ' pagination' : '';
  document.querySelector('#usage').textContent = args.length
    ? `{{> "${item.partial}"${context}${args.map(arg => `\n    ${arg}`).join('')}\n}}`
    : `{{> "${item.partial}"${context}}}`;
}
function scheduleRender() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(render, 180);
}
function selectComponent() {
  controls.clear(); parameters.replaceChildren();
  const item = current();
  if (!item) { status.textContent = 'No components installed. Run ghostcn add button (or another component), then reload.'; return; }
  document.querySelector('#description').textContent = item.description;
  const definitions = { ...item.parameters, ...Object.fromEntries(Object.keys(item.styleSlots).map(key => [key, { description: key === 'class' ? 'Root classes for this instance.' : `Classes for ${item.styleSlots[key].join(', ')}.` }])) };
  for (const [name, definition] of Object.entries(definitions)) {
    const boolean = booleanParams.has(name);
    const label = document.createElement('label'); label.append(document.createTextNode(name));
    const input = document.createElement(definition.options || boolean ? 'select' : 'input');
    input.name = name;
    if (input.tagName === 'SELECT') for (const value of boolean ? ['false','true'] : definition.options) { const option = document.createElement('option'); option.value = value; option.textContent = value; input.append(option); }
    input.value = item.defaults[name] || definition.default || (boolean ? 'false' : '');
    const help = document.createElement('small'); help.textContent = definition.description;
    label.append(input, help); parameters.append(label); controls.set(name, input);
    input.addEventListener('change', render);
    if (input.tagName === 'INPUT') input.addEventListener('input', scheduleRender);
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
document.querySelector('#access')?.addEventListener('change', render);
viewport?.addEventListener('change', () => {
  if (frameStage) frameStage.dataset.viewport = viewport.value;
});
copyUsage?.addEventListener('click', async () => {
  const snippet = document.querySelector('#usage')?.textContent || '';
  if (!snippet) return;
  try {
    await navigator.clipboard.writeText(snippet);
    copyUsage.textContent = 'Copied';
    setTimeout(() => { copyUsage.textContent = 'Copy snippet'; }, 1500);
  } catch {
    status.textContent = 'Copy manually from the template snippet below.';
  }
});
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
