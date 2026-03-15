import { load } from 'cheerio';

import type { Route } from '@/types';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';

// ---------- AV 工具类 ----------
const codePattern = /^(?<label>[a-zA-Z]+)[-_]?(?<number>\d+)(?<suffix>[a-z]+)?$/;
const dmmMonoPics = 'https://p.dmm.co.jp/mono/movie/adult';
const dmmDigiPics = 'https://p.dmm.co.jp/digital/video';
const dmmVideos = 'https://cc3001.dmm.co.jp/litevideo/freepv';
const dmmVrVideos = 'https://cc3001.dmm.co.jp/vrsample';
const dmmMonoUrl = 'https://www.dmm.co.jp/mono/dvd/-/detail/=/cid=';
const dmmDigiUrl = 'https://www.dmm.co.jp/digital/videoa/-/detail/=/cid=';

const digiLabels = new Set([
    'aiav',
    'beaf',
    'docd',
    'docp',
    'fax',
    'fabs',
    'hmrk',
    'htms',
    'hoks',
    'kamef',
    'kmai',
    'maan',
    'mdon',
    'mfcd',
    'mfct',
    'mgtd',
    'neob',
    'open',
    'sdhs',
    'senn',
    'seth',
    'shyn',
    'silks',
    'silku',
    'sprd',
    'sqis',
    'stzy',
    'vov',
    'xox',
    'yyds',
]);

const vrLabels = new Set(['aqube', 'aquco', 'aquga', 'aquma', 'exmo', 'fsvss', 'gopj', 'komz', 'slr', 'urvrsp', 'kmhrs']);

const labels = {
    1: [
        'aiav',
        'boko',
        'dandy',
        'dldss',
        'emois',
        'fadss',
        'fcdss',
        'fsdss',
        'fsvss',
        'ftav',
        'iene',
        'kire',
        'kkbt',
        'kmhr',
        'kmhrs',
        'kuse',
        'mgold',
        'mist',
        'mogi',
        'moon',
        'msfh',
        'mtall',
        'namh',
        'nhdt',
        'nhdta',
        'nhdtb',
        'noskn',
        'open',
        'piyo',
        'rct',
        'rctd',
        'sace',
        'sdab',
        'sdam',
        'sdde',
        'sdhs',
        'sdjs',
        'sdmf',
        'sdmm',
        'sdms',
        'sdmt',
        'sdmu',
        'sdmua',
        'sdnm',
        'sdth',
        'senn',
        'setm',
        'seth',
        'sgki',
        'shyn',
        'silk',
        'silks',
        'silku',
        'sply',
        'star',
        'stars',
        'start',
        'stzy',
        'sun',
        'suwk',
        'svbgr',
        'svcao',
        'svdvd',
        'svmgm',
        'svnnp',
        'svsha',
        'svvrt',
        'sw',
        'wo',
    ],
    2: ['cen', 'ckw', 'cwm', 'dfdm', 'dfe', 'dje', 'ecb', 'ekai', 'emsk', 'hkw', 'wdi', 'wsp', 'wss', 'wzen'],
    13: ['dsvr'],
    18: ['sprd'],
    24: ['bld', 'cvd', 'dkd', 'frd', 'isrd', 'nad', 'nhd', 'ped', 'tyd', 'ufd', 'vdd'],
    41: ['aibv', 'aidv', 'hodv', 'howy'],
    53: ['dv'],
    55: ['csct', 'hitma', 'hsrm', 'id', 'qqq', 'qvrt', 't', 'tsms'],
    59: ['hez'],
    118: ['aas', 'abf', 'abp', 'abw', 'aka', 'bgn', 'chn', 'dic', 'dmr', 'dkn', 'dlv', 'fbu', 'fig', 'fit', 'fiv', 'gni', 'gdl', 'ggg', 'jbs', 'onez', 'ppt', 'ppx', 'pxh', 'sga', 'shf', 'sng', 'thu', 'yrk'],
    5433: ['btha'],
    5642: ['neob'],
    h_019: ['aczd'],
    h_066: ['fax'],
    h_068: ['mxbd', 'mxgs', 'mxsps'],
    h_086: ['hone', 'hthd', 'iora', 'iro', 'jrzd', 'jrze', 'jura', 'nuka'],
    h_113: ['cb', 'ps', 'se', 'sy', 'zm'],
    h_139: ['dhld', 'doks', 'dotm'],
    h_172: ['gghx', 'hmgl', 'hmnf'],
    h_237: ['ambi', 'clot', 'find', 'hdka', 'nacr', 'nacx', 'zmar'],
    h_346: ['rebd', 'rebdb'],
    h_458: ['hsm'],
    h_491: ['fneo', 'fone', 'tenn', 'tkou'],
    h_720: ['zex'],
    h_796: ['san'],
    h_910: ['vrtm'],
    h_1100: ['hzgd'],
    h_1127: ['gopj'],
    h_1133: ['gone', 'jstk', 'nine', 'tdan'],
    h_1240: ['milk'],
    h_1324: ['skmj'],
    h_1350: ['kamef', 'kamx', 'tmgv', 'vov', 'vovx'],
    h_1472: ['xox'],
    h_1495: ['bank'],
    h_1539: ['slr'],
    h_1615: ['beaf'],
    h_1711: ['dal', 'docd', 'docp', 'hmrk', 'maan', 'mfcd', 'mfct', 'mgtd'],
    h_1712: ['asi', 'dtt', 'fft', 'kbi', 'kbl', 'kbr', 'tuk'],
    h_1757: ['olm'],
    h_1800: ['yyds'],
    n_707: ['aims', 'fuka', 'jfic', 'jtdk', 'lbdd', 'mbdd', 'ohp'],
    n_709: ['maraa', 'mbraa', 'mbrau', 'mbraz', 'mbrba', 'mbrbi', 'mbrbm', 'mbrbn', 'mmraa'],
    n_1428: ['ap', 'ld', 'ss'],
};

class AV {
    label = '';
    number = '';
    suffix = '';
    id = '';
    vid = '';

    constructor(s) {
        const match = s.match(codePattern);
        if (match?.groups) {
            this.label = match.groups.label.toLowerCase();
            this.number = match.groups.number;
            this.suffix = match.groups.suffix || '';
            for (const [key, list] of Object.entries(labels)) {
                if (list.includes(this.label)) {
                    this.id = `${key}${this.label}${this.number}${this.suffix}`;
                    this.vid = `${key}${this.label}${this.number.padStart(5, '0')}${this.suffix}`;
                    return;
                }
            }
            this.id = `${this.label}${this.number}${this.suffix}`;
            this.vid = `${this.label}${this.number.padStart(5, '0')}${this.suffix}`;
        }
    }

    get isVr() {
        return this.label.endsWith('vr') || vrLabels.has(this.label);
    }

    get url() {
        return this.isVr || digiLabels.has(this.label) ? `${dmmDigiUrl}${this.vid}/` : `${dmmMonoUrl}${this.id}/`;
    }

    get cover() {
        return this.isVr || digiLabels.has(this.label) ? `${dmmDigiPics}/${this.vid}/${this.vid}pl.jpg` : `${dmmMonoPics}/${this.id}/${this.id}pl.jpg`;
    }

    get videos() {
        if (this.isVr) {
            return [`${dmmVrVideos}/${this.vid[0]}/${this.vid.slice(0, 3)}/${this.vid}/${this.vid}vrlite.mp4`, `${dmmVrVideos}/${this.id[0]}/${this.id.slice(0, 3)}/${this.id}/${this.id}vrlite.mp4`];
        }
        const result: string[] = [];
        for (const sfx of ['hhb', 'mhb', '_dmb_w', '_dm_s']) {
            result.push(`${dmmVideos}/${this.vid[0]}/${this.vid.slice(0, 3)}/${this.vid}/${this.vid}${sfx}.mp4`);
            result.push(`${dmmVideos}/${this.id[0]}/${this.id.slice(0, 3)}/${this.id}/${this.id}${sfx}.mp4`);
        }
        return result;
    }
}
// ---------- AV 类定义结束 ----------

// 动态 import，本地开发用系统 Chrome，Vercel 生产用 @sparticuz/chromium
async function launchBrowser() {
    // Vercel / Lambda 环境
    if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL) {
        const chromium = (await import('@sparticuz/chromium')).default;
        const puppeteer = (await import('puppeteer-core')).default;
        return puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
    }

    // 本地开发环境：用 puppeteer-core + 本机已安装的 Chrome
    const puppeteer = (await import('puppeteer-core')).default;
    // Windows 默认 Chrome 路径，如不同请修改
    const executablePath = process.env.CHROME_PATH || String.raw`C:\Users\SALRRAB\RSSHub\node_modules\.cache\puppeteer\chrome\win64-136.0.7103.49\chrome-win64\chrome.exe`;
    return puppeteer.launch({ headless: true, executablePath });
}

export const route: Route = {
    path: '/tag/:tagid',
    categories: ['multimedia'],
    example: '/tktube/tag/d16507037fea89b20ca12ea5159474e5',
    parameters: { tagid: 'Tag ID, found in the tag page URL' },
    features: {
        requireConfig: false,
        requirePuppeteer: true,
        antiCrawler: true,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
        nsfw: true,
    },
    name: 'Tag',
    maintainers: [],
    handler,
};

async function handler(ctx) {
    const { tagid } = ctx.req.param();
    const url = `https://tktube.com/zh/tags/${tagid}/`;

    const browser = await launchBrowser();
    const page = await browser.newPage();
    let html = '';

    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('div.item', { timeout: 15000 });
        html = await page.content();
    } finally {
        await page.close();
        await browser.close();
    }

    const $ = load(html);
    const list = $('div.item').toArray();

    const items = await Promise.all(
        list.map(async (el) => {
            const $el = $(el);
            const $link = $el.find('a').first();
            const href = $link.attr('href');
            if (!href) {
                return null;
            }

            const title = $el.find('strong.title').text().trim();
            const videoId = $el.find('span.ico-fav-0').attr('data-fav-video-id');
            if (!title || !videoId) {
                return null;
            }

            const $img = $el.find('img.thumb');
            const imgSrc = $img.attr('data-webp') || $img.attr('src') || '';
            const dateText = $el.find('div.added em').text().trim();
            const pubDate = dateText ? parseDate(dateText) : null;

            const lastPartMatch = href.match(/\/([^/]+)\/?$/);
            if (!lastPartMatch) {
                return null;
            }
            const lastPart = lastPartMatch[1];

            let code = '';

            // 优先从 title 中提取番号（最准确，避免 URL 末尾数字被混入的问题）
            // title 通常格式为 "NACR-726 女優名" 或 "FC2-PPV-1234567 ..."
            const titleFc2Match = title.match(/^(fc2-ppv-\d+)/i);
            const titleCodeMatch = title.match(/^([a-zA-Z]+-\d+[a-z]*)/);
            if (titleFc2Match) {
                code = titleFc2Match[1];
            } else if (titleCodeMatch) {
                code = titleCodeMatch[1];
            } else {
                // fallback：从 URL 末尾解析
                const fc2Match = lastPart.match(/^(fc2-ppv-\d+)/i);
                if (fc2Match) {
                    code = fc2Match[1];
                } else {
                    const avTest = new AV(lastPart);
                    if (avTest?.label && avTest?.number) {
                        code = `${avTest.label}-${avTest.number}${avTest.suffix}`;
                    } else {
                        const generalMatch = lastPart.match(/([a-z]+[-_]?\d+[a-z]?)/i);
                        if (generalMatch) {
                            code = generalMatch[1];
                        }
                    }
                }
            }

            if (!code) {
                return null;
            }

            const avObj = new AV(code);
            const embedUrl = `https://tktube.com/zh/embed/${videoId}`;

            // 构建 description 的各部分
            const parts: string[] = [];

            // 图片
            if (imgSrc) {
                parts.push(`<img src="${imgSrc}" width="100%"/><br>`);
            }

            // DMM 视频（使用 <video> 标签列出所有候选地址）
            if (avObj?.videos?.length) {
                const sources = avObj.videos.map((url) => `<source src="${url}" type="video/mp4">`).join('\n');
                parts.push(
                    `<video controls playsinline poster="${avObj.cover}" preload="none" style="width:100%; aspect-ratio:16/9" onmouseenter="if(this.preload=='none')this.preload='metadata'">\n${sources}\n</video><br>`
                );
            }

            // TKTube iframe
            parts.push(`<iframe width="544" height="306" src="${embedUrl}" frameborder="0" allowfullscreen></iframe><br>`);

            return {
                title,
                link: href,
                description: parts.join('\n'),
                guid: href,
                pubDate,
            };
        })
    );

    return {
        title: `TKTube - ${$('title').text() || 'Tag'}`,
        link: url,
        description: $('meta[name="description"]').attr('content') || '',
        item: items.filter(Boolean),
    };
}