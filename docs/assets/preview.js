const feedback = message => {
  document.getElementById('preview-feedback').textContent = message;
  parent.postMessage({ type: 'ghostcn-preview', message }, '*');
};
const subscribe = form => {
  if (!form.reportValidity()) return;
  form.classList.add('success');
  feedback('Demo only. No email was sent or stored. Install this component in Ghost to subscribe readers.');
};
document.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (link?.closest('[data-ghcn-toc]')) return; // Heading navigation is safe within this demo.
  if (link) { event.preventDefault(); feedback(link.dataset.portal ? 'Demo only. This action opens Ghost Portal on your real publication.' : 'Demo only. Links use your publication’s routes when installed in Ghost.'); }
  else if (event.target.closest('button[aria-label="Search"]')) feedback('Demo only. Search runs on your real Ghost publication.');
  else if (event.target.closest('button[type="submit"]')) {
    // Forms remain sandbox-blocked. Handle the button before native submission,
    // which can be blocked before the submit event is dispatched.
    event.preventDefault();
    subscribe(event.target.closest('form'));
  }
});
document.addEventListener('submit', event => {
  event.preventDefault();
  subscribe(event.target);
});
document.addEventListener('keydown', event => {
  const form = event.target.closest('form');
  if (event.key === 'Enter' && form) { event.preventDefault(); subscribe(form); }
});
const resize = () => parent.postMessage({ type: 'ghostcn-preview', height: Math.ceil(document.body.getBoundingClientRect().height) + 2 }, '*');
new ResizeObserver(resize).observe(document.body);
window.addEventListener('load', resize);
