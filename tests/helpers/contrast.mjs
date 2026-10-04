// Browser-native color resolution handles Tailwind's oklch and vanilla rgb alike.
export async function textContrast(locator, surface) {
  return locator.evaluate((el, surface) => {
    const background = el.closest(surface);
    if (!background) throw new Error(`Missing surface ${surface}`);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    const rgb = value => {
      context.clearRect(0, 0, 1, 1); context.fillStyle = value; context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    };
    const luminance = channels => channels.slice(0, 3).map(value => {
      const channel = value / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    }).reduce((sum, channel, i) => sum + channel * [.2126, .7152, .0722][i], 0);
    const foreground = rgb(getComputedStyle(el).color);
    const backdrop = rgb(getComputedStyle(background).backgroundColor);
    if (foreground[3] !== 255 || backdrop[3] !== 255) throw new Error('Contrast fixtures require opaque foreground/background colors');
    const a = luminance(foreground), b = luminance(backdrop);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  }, surface);
}
