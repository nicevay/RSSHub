import { load } from 'cheerio';

import type { Route } from '@/types';

// ---------- AV 工具类（完全照抄最新版 tag.ts）----------
const codePattern = /^(?<label>[a-zA-Z]+)[-_]?(?<number>\d+)(?<suffix>[a-z]+)?$/;
const dmmMonoPics = 'https://p.dmm.co.jp/mono/movie/adult';
const dmmDigiPics = 'https://p.dmm.co.jp/digital/video';
const picsDigiBase = 'https://pics.dmm.co.jp/digital/video';
const picsMonoBase = 'https://pics.dmm.co.jp/mono/movie/adult';

const monoLabelPrefixes = new Set([1, 2, 13, 24, 41, 53, 55, 59, 118, 5433, 5642]);
const dmmVideos = 'https://cc3001.dmm.co.jp/litevideo/freepv';
const dmmVrVideos = 'https://cc3001.dmm.co.jp/vrsample';
const dmmMonoUrl = 'https://www.dmm.co.jp/mono/dvd/-/detail/=/cid=';
const dmmDigiUrl = 'https://www.dmm.co.jp/digital/videoa/-/detail/=/cid=';

const vrLabels = new Set(['aqube', 'aquco', 'aquga', 'aquma', 'exmo', 'fsvss', 'gopj', 'komz', 'slr', 'urvrsp', 'kmhrs']);

const digitalNumericLabels: Record<string, string> = {
    fthtd: '1',
    ftds: 'h_1300',
};

const digitalOnlyLabels = new Set(['dass']);

const labels = {
    1: [
        'aiav',
        'boko',
        'dandy',
        'dldss',
        'emois',
        'fadss',
        'fcdss',
        'fns',
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
    private _forceDigital = false;

    constructor(s: string) {
        const match = s.match(codePattern);
        if (match?.groups) {
            this.label = match.groups.label.toLowerCase();
            this.number = match.groups.number;
            this.suffix = match.groups.suffix || '';

            if (digitalOnlyLabels.has(this.label)) {
                this.id = `${this.label}${this.number}${this.suffix}`;
                this.vid = `${this.label}${this.number.padStart(5, '0')}${this.suffix}`;
                this._forceDigital = true;
                return;
            }

            if (this.label in digitalNumericLabels) {
                const prefix = digitalNumericLabels[this.label];
                this.id = `${prefix}${this.label}${this.number}${this.suffix}`;
                this.vid = `${prefix}${this.label}${this.number.padStart(5, '0')}${this.suffix}`;
                this._forceDigital = true;
                return;
            }

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

    get isMono() {
        if (this._forceDigital || this.isVr) {
            return false;
        }
        if (digitalOnlyLabels.has(this.label)) {
            return false;
        }
        for (const [key, list] of Object.entries(labels)) {
            if (list.includes(this.label)) {
                return monoLabelPrefixes.has(Number(key));
            }
        }
        return false;
    }

    get url() {
        return this.isMono ? `${dmmMonoUrl}${this.id}/` : `${dmmDigiUrl}${this.vid}/`;
    }

    get cover() {
        return this.isMono ? `${dmmMonoPics}/${this.id}/${this.id}pl.jpg` : `${dmmDigiPics}/${this.vid}/${this.vid}pl.jpg`;
    }

    get gallery(): string[] {
        if (!this.vid) {
            return [];
        }
        const base = this.isMono ? picsMonoBase : picsDigiBase;
        const key = this.isMono ? this.id : this.vid;
        return [`${base}/${key}/${key}pl.jpg`, ...Array.from({ length: 8 }, (_, i) => `${base}/${key}/${key}jp-${i + 1}.jpg`)];
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
    const puppeteer = (await import('puppeteer-core')).default;
    const executablePath = process.env.CHROME_PATH || String.raw`C:\Users\SALRRAB\RSSHub\node_modules\.cache\puppeteer\chrome\win64-136.0.7103.49\chrome-win64\chrome.exe`;
    return puppeteer.launch({ headless: true, executablePath });
}

export const route: Route = {
    path: '/genre/:genre',
    categories: ['multimedia'],
    example: '/njavtv/genre/大屁股',
    parameters: { genre: 'Genre name (Chinese or URL-encoded), taken from the genre page URL' },
    features: {
        requireConfig: false,
        requirePuppeteer: true,
        antiCrawler: true,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
        nsfw: true,
    },
    name: 'Genre',
    maintainers: [],
    handler,
};

async function handler(ctx) {
    const { genre } = ctx.req.param();
    const encodedGenre = encodeURIComponent(genre);
    const listUrl = `https://njavtv.com/dm110/genres/${encodedGenre}`;

    // nJAV 对直接 HTTP 请求返回 403，列表页也需要 Puppeteer
    // 只需一次 Puppeteer 抓列表页，不进详情页，速度快
    const browser = await launchBrowser();
    const page = await browser.newPage();
    let listHtml = '';
    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        await page.goto(listUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('.thumbnail', { timeout: 15000 });
        listHtml = await page.content();
    } finally {
        await page.close();
        await browser.close();
    }

    const $ = load(listHtml);
    const feedTitle = $('meta[property="og:title"]').attr('content') || `nJAV - ${genre}`;

    // 卡片结构：
    //   <div class="thumbnail group">
    //     <a href="https://njavtv.com/{slug}">
    //       <img data-src="https://fourhoi.com/{slug}/cover-t.jpg">
    //     </a>
    //     <a class="text-secondary ..." href="https://njavtv.com/{slug}">{TITLE}</a>
    //   </div>
    const cards = $('.thumbnail.group').toArray();

    const items = cards
        .map((el) => {
            const $el = $(el);

            const href = $el.find('a').first().attr('href');
            if (!href) {
                return null;
            }

            const slugMatch = href.match(/\/([^/]+)\/?$/);
            if (!slugMatch) {
                return null;
            }
            const slug = slugMatch[1];

            const title = $el.find('a.text-secondary').text().trim() || slug.toUpperCase();

            // nJAV 列表页缩略图（FC2 / 数字前缀番号使用）
            const coverThumb = $el.find('img[data-src]').attr('data-src') || `https://fourhoi.com/${slug}/cover-t.jpg`;

            // ── 番号提取（对齐最新版 tag.ts 逻辑）──────────────────────────────
            let code = '';
            const titleFc2Match = title.match(/\b(fc2-ppv-\d+)\b/i);
            const titleNumPrefixMatch = title.match(/\b(\d+[a-zA-Z]+-\d+)\b/);
            const titleCodeRaw = title.match(/\b([a-zA-Z]+-\d+[a-zA-Z]*)\b/);

            if (titleFc2Match) {
                code = titleFc2Match[1];
            } else if (titleNumPrefixMatch) {
                code = titleNumPrefixMatch[1];
            } else if (titleCodeRaw) {
                const raw = titleCodeRaw[1];
                code = raw.replace(/(-[A-Z]+)+$/, '').replace(/([0-9])([A-Z]+)$/, '$1');
            } else {
                const slugBase = slug.replace(/-uncensored.*$/i, '').replace(/-leak.*$/i, '');
                const fc2Match = slugBase.match(/^(fc2-ppv-\d+)/i);
                if (fc2Match) {
                    code = fc2Match[1];
                } else {
                    const avTest = new AV(slugBase);
                    if (avTest?.label && avTest?.number) {
                        code = `${avTest.label}-${avTest.number}${avTest.suffix}`;
                    } else {
                        const generalMatch = slugBase.match(/([a-z]+[-_]?\d+[a-z]?)/i);
                        if (generalMatch) {
                            code = generalMatch[1];
                        }
                    }
                }
            }

            if (!code) {
                return null;
            }

            const isFc2 = /^fc2-ppv-/i.test(code);
            const isNumPrefix = /^\d/.test(code);

            // ── 组装 description ────────────────────────────────────────────────
            const parts: string[] = [];

            if (isFc2 || isNumPrefix) {
                // FC2 / 数字开头番号：只输出一张 nJAV 缩略图
                parts.push(`<img src="${coverThumb}" width="100%" referrerpolicy="no-referrer"><br>`);
            } else {
                // 普通番号：DMM 图片（封面 + 剧照）→ DMM 预告片
                const avObj = new AV(code);

                // 1. DMM 图片：封面 pl + 剧照 jp-1~8（来自 pics.dmm.co.jp）
                const galleryImgs = avObj?.vid ? avObj.gallery : [];
                if (galleryImgs.length > 0) {
                    for (const imgUrl of galleryImgs) {
                        parts.push(`<img src="${imgUrl}" width="100%" referrerpolicy="no-referrer"><br>`);
                    }
                } else {
                    // 无 DMM 图时回退到 nJAV 缩略图
                    parts.push(`<img src="${coverThumb}" width="100%" referrerpolicy="no-referrer"><br>`);
                }

                // 2. DMM 预告片（多 source 候选）
                if (avObj?.videos?.length) {
                    const sources = avObj.videos.map((u) => `<source src="${u}" type="video/mp4">`).join('\n');
                    parts.push(`<video controls playsinline poster="${avObj.cover}" preload="none" style="width:100%; aspect-ratio:16/9" onmouseenter="if(this.preload=='none')this.preload='metadata'">\n${sources}\n</video><br>`);
                }
            }

            return {
                title,
                link: href,
                description: parts.join('\n'),
                guid: href,
                pubDate: null,
            };
        })
        .filter(Boolean);

    return {
        title: feedTitle,
        link: listUrl,
        description: $('meta[name="description"]').attr('content') || `nJAV ${genre} 類型最新影片`,
        item: items,
    };
}
