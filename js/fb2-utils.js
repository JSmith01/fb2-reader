const defaultEncoding = 'utf-8';

async function getFb2Encoding(file) {
    const initBlock = file.slice(0, 300);
    const initText = await readFileAsText(initBlock);
    const firstLine = initText.split('\n')[0];
    if (!firstLine || !firstLine.startsWith('<?xml')) {
        throw new DOMException('Non-XML document detected', 'NONXML');
    }
    const match = firstLine.match(/encoding="([^"]+)"/);
    if (match) {
        const encoding = match[1];
        return encoding.toLowerCase();
    } else {
        return defaultEncoding;
    }
}

const readFileAsText = (file, encoding = defaultEncoding) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('error', reject);
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsText(file, encoding);
});

export async function readFb2File(file) {
    const encoding = await getFb2Encoding(file);
    const content = await readFileAsText(file, encoding);

    return new DOMParser().parseFromString(content, 'application/xml');
}

function loadXml(url) {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.addEventListener('load', () => resolve(req.responseXML));
        req.addEventListener('error', reject);
        req.open('GET', url);
        req.responseType = 'document';
        req.send();
    });
}

let xsltProcessor;
export async function parseFb2ToHtml(xml) {
    if (!xsltProcessor) {
        xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(await loadXml('fb2-html.xsl'));
    }

    return xsltProcessor.transformToDocument(xml);
}

function getImageContentType(b64str) {
    let prepared = b64str.substring(0, 40).trim();
    prepared = prepared.substring(0, prepared.length - prepared.length % 4);
    if (prepared.length < 4) return 'image/unknown'; // fallback, let the browser decide
    const bin = atob(prepared);
    if (bin.startsWith('GIF89a')) return 'image/gif';
    if (bin.startsWith('\x89PNG\r\n\x1a\n')) return 'image/png';
    if (bin.startsWith('\xff\xd8\xff\xe0')) return 'image/jpeg';
    if (bin.startsWith('\x49\x49\x2A\x00') || bin.startsWith('\x4D\x4D\x00\x2A')) return 'image/tiff';
    if (bin.startsWith('\x52\x49\x46\x46')) return 'image/webp';
    return 'image/unknown';
}


const imageSrcCache = new WeakMap();

export function getImageSrc(binary) {
    if (imageSrcCache.has(binary)) return imageSrcCache.get(binary);

    const contentType = binary.attributes['content-type']?.value ?? getImageContentType(binary.innerHTML);
    const data = `data:${contentType};base64, ` + binary.innerHTML
    imageSrcCache.set(binary, data);

    return data;
}


function stripTags(text) {
    const t = document.createElement('div');
    t.innerHTML = text;
    return t.innerText;
}

function parseAuthor(author) {
    const info = {};
    Array.from(author.children).forEach(child => {
        info[child.nodeName] = stripTags(child.innerHTML);
    });
    if (info['first-name'] && info['last-name']) {
        return [info['first-name'],  info['middle-name'], info['last-name']].filter(Boolean).join(' ');
    } else if (info['nickname']) {
        return info['nickname'];
    } else return '';
}

export function getMeta(xml) {
    const titleInfo = xml.querySelector('description>title-info');
    const annotation = titleInfo.getElementsByTagName('annotation')[0];
    const title = stripTags(titleInfo.getElementsByTagName('book-title')[0].innerHTML);
    const authors = Array.from(titleInfo.getElementsByTagName('author')).map(parseAuthor);
    const sequence = titleInfo.getElementsByTagName('sequence')[0];
    const sequenceName = sequence?.attributes.name?.value;
    const sequenceNumber = sequence?.attributes.number?.value;

    return { title, authors, annotation, sequenceName, sequenceNumber };
}
