// Generate real Koenig editor output with the renderer shipped by the tested Ghost.
// Media assertions concern layout/controls, not codec playback or external services.
export async function renderEditorFixture(ghostRequire) {
  const { LexicalHTMLRenderer } = ghostRequire('@tryghost/kg-lexical-html-renderer');
  const { DEFAULT_NODES } = ghostRequire('@tryghost/kg-default-nodes');
  const text = value => ({ type: 'text', version: 1, text: value, detail: 0, format: 0, mode: 'normal', style: '' });
  const element = (type, children, extra = {}) => ({ type, version: 1, children, direction: null, format: '', indent: 0, ...extra });
  const card = (type, extra) => ({ type, version: 1, ...extra });
  const image = '/content/images/e2e.png';
  const state = { root: element('root', [
    element('heading', [text('Getting started')], { tag: 'h2' }),
    element('paragraph', [text('Real Ghost article content.')]),
    element('heading', [text('Reading details')], { tag: 'h3' }),
    element('paragraph', [text('A subsection of the article.')]),
    element('heading', [text('Getting started')], { tag: 'h2' }),
    card('image', { src: image, width: 640, height: 360, alt: 'Test image', caption: 'Wide image caption', cardWidth: 'wide' }),
    card('gallery', { images: [{ fileName: 'e2e.png', src: image, width: 640, height: 360, alt: 'Gallery image', row: 0 }, { fileName: 'e2e.png', src: image, width: 640, height: 360, alt: 'Second gallery image', row: 0 }], caption: 'Gallery caption' }),
    element('quote', [text('A quote from the article.')]),
    card('codeblock', { code: "const publication = 'Ghostcn';", language: 'javascript' }),
    card('callout', { calloutEmoji: '!', calloutText: 'Helpful callout' }),
    card('button', { buttonText: 'Editor button', buttonUrl: '/', alignment: 'center' }),
    card('bookmark', { url: '/', metadata: { title: 'Bookmark title', description: 'Bookmark description', icon: image, thumbnail: image } }),
    card('toggle', { heading: 'Toggle heading', content: '<p>Toggle content</p>' }),
    card('video', { src: '/content/media/e2e.wav', width: 640, height: 360, duration: 1, thumbnailSrc: image }),
    card('audio', { src: '/content/media/e2e.wav', title: 'Audio title', duration: 1 }),
    card('product', { productImageSrc: image, productImageWidth: 640, productImageHeight: 360, productTitle: 'Product title', productDescription: 'Product description' }),
    card('header', { version: 2, header: 'Full-width heading', subheader: 'Header description', layout: 'full', backgroundColor: '#18181b', textColor: '#ffffff' }),
    card('signup', { header: 'Editor signup heading', subheader: 'Read more from this publication.' }),
    card('horizontalrule', {})
  ]) };
  const html = await new LexicalHTMLRenderer({ nodes: DEFAULT_NODES }).render(JSON.stringify(state));
  return { html, lexical: JSON.stringify(state) };
}
