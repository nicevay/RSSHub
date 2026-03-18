import { load } from 'cheerio';

import type { Route } from '@/types';
import { parseDate } from '@/utils/parse-date';

// ---------- AV 工具类 ----------
const codePattern = /^(?<label>[a-zA-Z]+)[-_]?(?<number>\d+)(?<suffix>[a-z]+)?$/;
const dmmMonoPics = 'https://p.dmm.co.jp/mono/movie/adult';
const dmmDigiPics = 'https://p.dmm.co.jp/digital/video';
const picsDigiBase = 'https://pics.dmm.co.jp/digital/video';
const picsMonoBase = 'https://pics.dmm.co.jp/mono/movie/adult';

// labels 中数字前缀的系列为实体碟（mono），h_xxx / n_xxx 及未知系列默认走 digital
const monoLabelPrefixes = new Set([1, 2, 13, 24, 41, 53, 55, 59, 118, 5433, 5642]);
const dmmVideos = 'https://cc3001.dmm.co.jp/litevideo/freepv';
const dmmVrVideos = 'https://cc3001.dmm.co.jp/vrsample';
const dmmMonoUrl = 'https://www.dmm.co.jp/mono/dvd/-/detail/=/cid=';
const dmmDigiUrl = 'https://www.dmm.co.jp/digital/videoa/-/detail/=/cid=';

const vrLabels = new Set(['aqube', 'aquco', 'aquga', 'aquma', 'exmo', 'fsvss', 'gopj', 'komz', 'slr', 'urvrsp', 'kmhrs']);

// 有数字前缀但实际走 digital 路径的 label，key 为 label，value 为 DMM 前缀字符串
const digitalNumericLabels: Record<string, string> = {
    fthtd: '1',
    ftds: 'h_1300',
};

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
    private _forceDigital = false;

    constructor(s) {
        const match = s.match(codePattern);
        if (match?.groups) {
            this.label = match.groups.label.toLowerCase();
            this.number = match.groups.number;
            this.suffix = match.groups.suffix || '';

            // 优先检查 digitalNumericLabels：有数字前缀但强制走 digital
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

    // labels 中数字前缀的系列是实体碟（mono），其余（h_xxx、n_xxx、未知）默认 digital
    get isMono() {
        if (this._forceDigital || this.isVr) {
            return false;
        }
        for (const [key, list] of Object.entries(labels)) {
            if (list.includes(this.label)) {
                return monoLabelPrefixes.has(Number(key));
            }
        }
        // 未登记的 label 默认 digital
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

/**
 * 根据 tktube videoId 生成截图 URL。
 * 规律：folder = Math.floor(videoId / 1000) * 1000
 * 示例：videoId=381923 → folder=381000
 * URL: https://file.tkcdns.com/contents/videos_screenshots/{folder}/{videoId}/336x189/1.jpg
 */
function tktubeThumb(videoId: string): string {
    const id = Number(videoId);
    const folder = Math.floor(id / 1000) * 1000;
    return `https://file.tkcdns.com/contents/videos_screenshots/${folder}/${videoId}/336x189/1.jpg`;
}

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
        list.map((el) => {
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

            // 优先从 title 中提取番号（最准确，避免 URL slug 附加数字导致番号错误）
            // 使用 \b 单词边界而非 ^ 行首，以兼容 "【去馬賽克】XVSR-840 ..." 这类带前缀方括号的标题
            const titleFc2Match = title.match(/\b(fc2-ppv-\d+)\b/i);
            // 数字开头的番号，如 348NTR-093、200GANA-001
            const titleNumPrefixMatch = title.match(/\b(\d+[a-zA-Z]+-\d+)\b/);
            const titleCodeMatch = title.match(/\b([a-zA-Z]+-\d+[a-z]*)\b/);

            if (titleFc2Match) {
                code = titleFc2Match[1];
            } else if (titleNumPrefixMatch) {
                // 数字开头番号：走 tktube 缩略图 + iframe，不查 DMM
                code = titleNumPrefixMatch[1];
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

            const embedUrl = `https://tktube.com/zh/embed/${videoId}`;
            const iframeTag = `<iframe width="544" height="306" src="${embedUrl}" frameborder="0" allowfullscreen="" referrerpolicy="no-referrer"></iframe>`;

            // 构建 description 的各部分
            const parts: string[] = [];

            // -------------------------------------------------------
            // FC2-PPV 或数字开头番号（如 348NTR-093）：
            // 只用 tktube 自身的截图 + iframe，跳过 DMM 逻辑
            // -------------------------------------------------------
            const isFc2 = /^fc2-ppv-/i.test(code);
            const isNumPrefix = /^\d/.test(code);

            if (isFc2 || isNumPrefix) {
                const thumbUrl = tktubeThumb(videoId);
                parts.push(`<img src="${thumbUrl}" width="100%" referrerpolicy="no-referrer"><br>`);
                parts.push(`${iframeTag}<br>`);
            } else {
                // -------------------------------------------------------
                // 普通番号：走原有 DMM 图片 + DMM 视频 + iframe 逻辑
                // -------------------------------------------------------
                const avObj = new AV(code);

                // DMM 图片：封面 + 剧照（优先使用 DMM 图；若无 vid 则回退到 tktube 缩略图）
                const galleryImgs = avObj?.vid ? avObj.gallery : [];
                if (galleryImgs.length > 0) {
                    for (const imgUrl of galleryImgs) {
                        parts.push(`<img src="${imgUrl}" width="100%"/><br>`);
                    }
                } else if (imgSrc) {
                    // fallback：使用 tktube 原始缩略图
                    parts.push(`<img src="${imgSrc}" width="100%"/><br>`);
                }

                // DMM 视频（使用 <video> 标签列出所有候选地址）
                if (avObj?.videos?.length) {
                    const sources = avObj.videos.map((url) => `<source src="${url}" type="video/mp4">`).join('\n');
                    parts.push(`<video controls playsinline poster="${avObj.cover}" preload="none" style="width:100%; aspect-ratio:16/9" onmouseenter="if(this.preload=='none')this.preload='metadata'">\n${sources}\n</video><br>`);
                }

                // TKTube iframe
                parts.push(`${iframeTag}<br>`);
            }

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
