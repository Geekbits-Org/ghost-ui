document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const block = button.closest('.code-block');
    const source = block.querySelector('code').textContent;
    try {
      await navigator.clipboard.writeText(source);
      button.textContent = 'Copied';
      block.querySelector('.copy-status').textContent = 'Copied to clipboard';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(block.querySelector('code'));
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
      block.querySelector('.copy-status').textContent = 'Select and copy the highlighted example';
    }
  });
});
document.querySelectorAll('[data-component-preview]').forEach(preview => {
  const frame = preview.querySelector('iframe');
  preview.querySelectorAll('select').forEach(select => select.addEventListener('change', () => {
    const value = name => preview.querySelector(`[name="${name}"]`)?.value || 'visitor';
    frame.src = `/previews/${preview.dataset.componentPreview}-${value('style')}-${value('scheme')}-${value('variant')}-${value('member')}.html`;
    preview.querySelector('.preview-status').textContent = '';
  }));
});
window.addEventListener('message', event => {
  const frame = [...document.querySelectorAll('iframe')].find(item => item.contentWindow === event.source);
  if (!frame || !event.data || event.data.type !== 'ghostcn-preview') return;
  if (typeof event.data.height === 'number' && Number.isFinite(event.data.height)) frame.style.height = `${Math.max(200,Math.min(event.data.height,1600))}px`;
  if (typeof event.data.message === 'string') {
    const status = frame.closest('[data-component-preview]')?.querySelector('.preview-status');
    if (status) status.textContent = event.data.message.slice(0,200);
  }
});
