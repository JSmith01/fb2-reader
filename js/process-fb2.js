import { unzip, setOptions } from './thirdparty/unzipit.module.js';

setOptions({
    workerURL: '/js/thirdparty/unzipit-worker.module.js',
    numWorkers: 2,
});

const defaultEncoding = 'utf-8';

/**
 * @param {File|Blob} file
 * @return {Promise<string>}
 */
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

/**
 * @param {File|Blob} file
 * @param {string} encoding
 * @return {Promise<string>}
 */
const readFileAsText = (file, encoding = defaultEncoding) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('error', reject);
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsText(file, encoding);
});

/**
 * @param {File|Blob} file
 * @return {Promise<Document>}
 */
async function readFb2File(file) {
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

/**
 * @param {Document} xml
 * @return {Promise<Document>}
 */
async function parseFb2ToHtml(xml) {
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

function getImageSrc(binary) {
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

/**
 * @param {Element} author
 * @return {string}
 */
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

/**
 * @typedef {object} Fb2Meta
 * @property {string} annotationHtml
 * @property {number} sequenceNumber
 * @property {string} title
 * @property {string} sequenceName
 * @property {string[]} authors
 */

/**
 * @param {Document} xml
 * @param {string} fileName
 * @return {Fb2Meta}
 */
function getMeta(xml, fileName) {
    const titleInfo = xml.querySelector('description>title-info');
    const annotation = titleInfo.getElementsByTagName('annotation')[0];
    const title = stripTags(titleInfo.getElementsByTagName('book-title')[0].innerHTML);
    const authors = Array.from(titleInfo.getElementsByTagName('author')).map(parseAuthor);
    const sequence = titleInfo.getElementsByTagName('sequence')[0];
    const sequenceName = sequence?.attributes.name?.value;
    const sequenceNumber = sequence?.attributes.number?.value;

    return { title, authors, annotationHtml: annotation?.innerHTML ?? '', sequenceName, sequenceNumber, fileName };
}

/**
 * @param {Document} xml
 * @return {Promise<ChildNode>}
 */
async function renderBook(xml) {
    const doc = await parseFb2ToHtml(xml);

    const images = doc.querySelectorAll('img[data-src]');
    const binaries = Array.from(xml.getElementsByTagName('binary'));
    const binariesMap = Object.fromEntries(binaries.map(binary => [binary.id, binary]));

    images.forEach(image => {
        image.src = getImageSrc(binariesMap[image.dataset.src]);
    });

    return doc.body.firstChild;
}

/**
 * @param {File} file
 * @return {Promise<Blob>}
 */
async function unzipFb2(file) {
    const { entries } = await unzip(file);
    const fb2FileName = Object.keys(entries).find(name => name.endsWith('.fb2'));
    if (!fb2FileName) throw new DOMException('No FB2 inside zip', 'ZIP-NONFB2');

    return entries[fb2FileName].blob();
}

/**
 * @param {File} file
 * @return {Promise<[Fb2Meta, ChildNode]>}
 */
export default async function processFile(file) {
    const fb2File = file.name.endsWith('.zip') ? await unzipFb2(file) : file;
    const xml = await readFb2File(fb2File);
    if (typeof window === 'object') {
        window.xml = xml;
    }
    if (!xml.querySelector('FictionBook')) throw new DOMException('Non-FB2 document detected', 'NONFB2');

    return [getMeta(xml, file.name), await renderBook(xml)];
}
