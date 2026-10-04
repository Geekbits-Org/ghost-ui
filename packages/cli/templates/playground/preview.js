// Sandbox interactions never navigate, submit email, or open Ghost Portal.
document.addEventListener('submit', event => { event.preventDefault(); document.querySelector('#preview-feedback').textContent = 'Demo only. No email was sent or stored.'; });
document.addEventListener('click', event => {
  const element = event.target.closest('a,button');
  if (!element || element.closest('[data-ghcn-toc]')) return;
  event.preventDefault();
  if (element.type === 'submit') {
    document.querySelector('#preview-feedback').textContent = 'Demo only. No email was sent or stored.';
    return;
  }
  document.querySelector('#preview-feedback').textContent = element.getAttribute('aria-disabled') === 'true' || element.disabled ? 'This action is disabled.' : 'Demo action. Test navigation, search and Portal on your Ghost publication.';
});
