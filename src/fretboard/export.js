import regularFontUrl from "@fontsource/ubuntu-mono/files/ubuntu-mono-latin-400-normal.woff2";
import boldFontUrl from "@fontsource/ubuntu-mono/files/ubuntu-mono-latin-700-normal.woff2";

const readAsDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
});

const fetchAsDataUrl = async (url) => readAsDataUrl(await (await fetch(url)).blob());

// An SVG drawn as an image can't load fonts from outside itself, so the
// exported markup carries the fretboard's font inline.
const getFontFaceCss = async () => {
    const [regular, bold] = await Promise.all([fetchAsDataUrl(regularFontUrl), fetchAsDataUrl(boldFontUrl)]);
    return `
        @font-face { font-family: 'Ubuntu Mono'; font-weight: 400; src: url(${regular}) format('woff2'); }
        @font-face { font-family: 'Ubuntu Mono'; font-weight: 700; src: url(${bold}) format('woff2'); }
    `;
};

const loadImage = (src) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not draw the fretboard'));
    image.src = src;
});

// Draws the whole fretboard <svg>, however much of it is scrolled out of view,
// to a PNG at least twice its on-screen size so it stays sharp.
export const renderPng = async (svg) => {
    const { width, height } = svg.viewBox.baseVal;
    const scale = Math.max(2, window.devicePixelRatio);

    const copy = svg.cloneNode(true);
    copy.setAttribute('width', width * scale);
    copy.setAttribute('height', height * scale);
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = await getFontFaceCss();
    copy.prepend(style);

    const markup = new XMLSerializer().serializeToString(copy);
    const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`);

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.getContext('2d').drawImage(image, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the PNG'))), 'image/png');
    });
};
