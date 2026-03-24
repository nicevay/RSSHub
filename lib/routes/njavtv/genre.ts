import { load } from 'cheerio';

import type { Route } from '@/types';

// ---------- AV 工具类（与最新版 tag.ts 保持同步）----------
const codePattern = /^(?<label>[a-zA-Z]+)[-_]?(?<number>\d+)(?<suffix>[a-z]+)?$/;
const dmmMonoPics = 'https://p.dmm.co.jp/mono/movie/adult';
const dmmDigiPics = 'https://p.dmm.co.jp/digital/video';
const picsDigiBase = 'https://pics.dmm.co.jp/digital/video';
const picsMonoBase = 'https://pics.dmm.co.jp/mono/movie/adult';
const awsAmateurBase = 'https://awsimgsrc.dmm.co.jp/pics_dig/digital/amateur';

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

// 明确走 digital 路径且不需要任何前缀的 label
const digitalOnlyLabels = new Set(['dass']);

// amateur 系列 label 集合（图片走 awsimgsrc.dmm.co.jp/pics_dig/digital/amateur/）
const amateurLabels = new Set([
    'ako',
    'anan',
    'bmyb',
    'bngg',
    'bshi',
    'bskc',
    'dcgg',
    'ddh',
    'ddhc',
    'ddhp',
    'deaa',
    'deas',
    'debz',
    'deli',
    'deth',
    'detw',
    'dht',
    'docs',
    'einac',
    'ends',
    'erk',
    'erofc',
    'esdx',
    'fan',
    'fct',
    'fcz',
    'ffee',
    'ffnn',
    'ffqq',
    'gaga',
    'gdrp',
    'gdrt',
    'gerk',
    'gesy',
    'ginac',
    'grsp',
    'gtwy',
    'hdpgm',
    'hdsn',
    'hhl',
    'hint',
    'hlw',
    'hmdnc',
    'hmpr',
    'hoi',
    'hpara',
    'hpt',
    'htut',
    'hut',
    'instc',
    'iog',
    'jdg',
    'jzt',
    'kaku',
    'kitaike',
    'kjm',
    'kjsk',
    'kure',
    'mach',
    'mado',
    'mako',
    'mfc',
    'mfcg',
    'mfcl',
    'mfcn',
    'mfcs',
    'mfcw',
    'mgfx',
    'mla',
    'mmnm',
    'momo',
    'msodn',
    'mtgg',
    'myxx',
    'ntgg',
    'oksm',
    'omad',
    'ontr',
    'orebm',
    'orec',
    'oreh',
    'orena',
    'orer',
    'orev',
    'pai',
    'peej',
    'pkpk',
    'pkti',
    'prgo',
    'ptpj',
    'pwife',
    'refuck',
    'sbkd',
    'scute',
    'sekao',
    'shc',
    'sika',
    'sima',
    'simd',
    'simf',
    'simh',
    'simm',
    'simo',
    'simp',
    'simt',
    'sj',
    'sjho',
    'skho',
    'smjh',
    'smjj',
    'smjk',
    'smjs',
    'smjx',
    'smjz',
    'smmc',
    'smuk',
    'smus',
    'sna',
    'snp',
    'spcz',
    'srgt',
    'srsy',
    'srt',
    'sth',
    'stime',
    'sxfe',
    'taxd',
    'tcnb',
    'tow',
    'tpc',
    'tttl',
    'uinac',
    'urutora',
    'wnso',
    'womc',
    'work',
    'xxgg',
    'yarim',
    'yss',
    'zarj',
]);

const labels = {
    1: [
        'aege',
        'aiav',
        'akdl',
        'bkynb',
        'boko',
        'bqbb',
        'dandy',
        'dandya',
        'dldss',
        'drpt',
        'emois',
        'fadss',
        'fcdss',
        'fns',
        'fsdss',
        'fsvss',
        'ftav',
        'ftk',
        'ftkd',
        'hame',
        'hawa',
        'hbad',
        'iene',
        'ienf',
        'kire',
        'king',
        'kkbt',
        'kmhr',
        'kmhrs',
        'kuse',
        'mgold',
        'mgnl',
        'miha',
        'mist',
        'mistsc',
        'mogi',
        'moon',
        'msfh',
        'mtafb',
        'mtall',
        'murikuri',
        'namh',
        'nhdt',
        'nhdta',
        'nhdtb',
        'nhdtc',
        'nhvr',
        'noskn',
        'nph',
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
        'seven',
        'sgki',
        'shyn',
        'silk',
        'silkbt',
        'silks',
        'silku',
        'sods',
        'sply',
        'star',
        'stars',
        'start',
        'stcv',
        'stcvs',
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
        'urkn',
        'vrnc',
        'wawa',
        'wo',
        'yaria',
    ],
    2: ['cen', 'ckw', 'cwm', 'dfdm', 'dfe', 'dje', 'ecb', 'ekai', 'ekw', 'emsk', 'hkw', 'wdi', 'wsp', 'wss', 'wzen'],
    13: ['dsvr', 'gvg'],
    18: ['sprd'],
    24: ['bld', 'cxd', 'cvd', 'dkd', 'frd', 'isrd', 'nad', 'nhd', 'ped', 'qbd', 'tyd', 'ufd', 'vdd'],
    36: ['dhld', 'doks', 'dmow', 'dotm', 'drop'],
    41: ['aibv', 'aidv', 'hodv', 'howy'],
    42: ['vrpn'],
    48: ['rdvhj'],
    53: ['dv'],
    55: ['csct', 'hitma', 'hsrm', 'id', 'qqq', 'qvrt', 't', 'tsms'],
    59: ['dht', 'ghz', 'hez'],
    71: ['gas', 'gass'],
    118: ['aas', 'abf', 'abp', 'abw', 'aka', 'bgn', 'chn', 'dic', 'dmr', 'dkn', 'dlv', 'fbu', 'fig', 'fit', 'fiv', 'gni', 'gdl', 'ggg', 'jbs', 'onez', 'ppt', 'ppx', 'pxh', 'sga', 'shf', 'sng', 'thu', 'yrk'],
    125: ['umd'],
    433: ['neo', 'rop'],
    436: ['mille'],
    5141: ['mbrbm'],
    5433: ['btha'],
    5642: ['neob'],
    5664: ['mbrbi'],
    5686: ['edyar'],
    5761: ['ogy'],
    h_019: ['aczd'],
    h_021: ['ptes', 'pts'],
    h_066: ['fax'],
    h_068: ['httm', 'mxbd', 'mxdlp', 'mxgs', 'mxsps'],
    h_086: ['cvdx', 'goul', 'hone', 'hthd', 'iora', 'iro', 'jrzd', 'jrze', 'jura', 'nuka', 'tenh'],
    h_113: ['cb', 'honb', 'hr', 'kpp', 'pais', 'ps', 'puw', 'se', 'sy', 'tnik', 'ubug', 'zm'],
    h_139: ['dhld', 'doks', 'dotm'],
    h_172: ['gghx', 'hmgl', 'hmnf'],
    h_173: ['ghkr', 'gret'],
    h_205: ['ssnd'],
    h_237: ['ambi', 'clot', 'find', 'hdka', 'mara', 'nacr', 'nacx', 'nact', 'zmar'],
    h_283: ['pmft', 'pym'],
    h_346: ['rebd', 'rebdb'],
    h_455: ['abnomal', 'baburu', 'maguro', 'ooniku'],
    h_458: ['hsm'],
    h_460: ['mbm', 'mbma', 'mbmu'],
    h_491: ['chuc', 'fnew', 'fneo', 'fone', 'knmb', 'nmch', 'tenn', 'tkou'],
    h_496: ['bbwm', 'neko'],
    h_618: ['mkz'],
    h_720: ['zex'],
    h_796: ['san'],
    h_848: ['emf', 'jewe', 'mse', 'rhn', 'wcx'],
    h_897: ['flb'],
    h_910: ['vrtm'],
    h_1089: ['fw'],
    h_1100: ['hzgd'],
    h_1127: ['gopj'],
    h_1133: ['gone', 'honb', 'jstk', 'nine', 'pais', 'tdan', 'tnik', 'ubug'],
    h_1144: ['sgo'],
    h_1157: ['opg'],
    h_1165: ['goju'],
    h_1240: ['milk'],
    h_1292: ['gsy', 'ndo', 'ska'],
    h_1293: ['bdh', 'pqj'],
    h_1294: ['cbg', 'lwq'],
    h_1300: ['ftds', 'ginav', 'mtes'],
    h_1324: ['skmj'],
    h_1350: ['einav', 'kamef', 'kamx', 'tmgv', 'vov', 'vovx'],
    h_1380: ['kmds'],
    h_1441: ['bar', 'domi'],
    h_1450: ['psst'],
    h_1454: ['bdsr', 'bdst', 'hust', 'husr', 'mcsr'],
    h_1462: ['com', 'fcr', 'pyu'],
    h_1472: ['erofv', 'ggpvr', 'hmdnv', 'instna', 'instv', 'uinav', 'xox'],
    h_1489: ['j99'],
    h_1492: ['siron'],
    h_1495: ['bank'],
    h_1510: ['zzza'],
    h_1515: ['zooo', 'zoooz'],
    h_1534: ['grmr', 'grmo'],
    h_1535: ['grkg'],
    h_1539: ['slr'],
    h_1540: ['sdgn'],
    h_1580: ['och'],
    h_1596: ['dg', 'gns'],
    h_1604: ['pjam', 'pjsp'],
    h_1607: ['htubo'],
    h_1615: ['beaf'],
    h_1617: ['zzzm'],
    h_1618: ['ikik'],
    h_1628: ['sat'],
    h_1636: ['myt230'],
    h_1650: ['embm'],
    h_1658: ['hnhu'],
    h_1664: ['doki', 'ghat', 'hnbr', 'kir', 'nxg', 'ofku', 'olm'],
    h_1711: ['astr', 'dal', 'devr', 'docd', 'docp', 'gesz', 'har', 'hmrk', 'maan', 'mfcd', 'mfct', 'mgtd', 'mgpd'],
    h_1712: ['asi', 'dtt', 'fft', 'kbi', 'kbl', 'kbr', 'tuk'],
    h_1713: ['ems'],
    h_1724: ['a057b', 'a058g', 'a081g', 'a123g', 'm999g'],
    h_1728: ['htf'],
    h_1729: ['goji'],
    h_1736: ['ntk', 'zrc'],
    h_1739: ['dpk230'],
    h_1745: ['hrsm'],
    h_1755: ['brv'],
    h_1757: ['olm'],
    h_1758: ['ggdr'],
    h_1763: ['hrav'],
    h_1776: ['stakyb'],
    h_1780: ['gkjsk', 'gpkti', 'gptpj', 'gsxfe', 'gtaxd'],
    h_1783: ['tkfc'],
    h_1786: ['bufe'],
    h_1787: ['bdst', 'jksr', 'mcsr'],
    h_1794: ['plov'],
    h_1800: ['yyds'],
    h_1812: ['memo'],
    h_1825: ['tssr'],
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

            // amateur 类：直接用 label+number，不加任何前缀
            if (amateurLabels.has(this.label)) {
                this.id = `${this.label}${this.number}${this.suffix}`;
                this.vid = `${this.label}${this.number}${this.suffix}`;
                this._forceDigital = true;
                return;
            }

            // 最优先：digitalOnlyLabels 中的 label 不加任何前缀，直接走 digital
            if (digitalOnlyLabels.has(this.label)) {
                this.id = `${this.label}${this.number}${this.suffix}`;
                this.vid = `${this.label}${this.number.padStart(5, '0')}${this.suffix}`;
                this._forceDigital = true;
                return;
            }

            // 其次：digitalNumericLabels 中有数字前缀但强制走 digital
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

    get isAmateur() {
        return amateurLabels.has(this.label);
    }

    // 仅 stars-616~999 走 mono，其他所有番号一律走 digital
    get isMono() {
        if (this.label === 'stars') {
            const n = Number(this.number);
            return n >= 616 && n <= 999;
        }
        return false;
    }

    get url() {
        if (this.isAmateur) {
            return `${dmmDigiUrl}${this.vid}/`;
        }
        return this.isMono ? `${dmmMonoUrl}${this.id}/` : `${dmmDigiUrl}${this.vid}/`;
    }

    get cover() {
        if (this.isAmateur) {
            return `${awsAmateurBase}/${this.id}/${this.id}jp.jpg`;
        }
        return this.isMono ? `${dmmMonoPics}/${this.id}/${this.id}pl.jpg` : `${dmmDigiPics}/${this.vid}/${this.vid}pl.jpg`;
    }

    get gallery(): string[] {
        if (!this.vid) {
            return [];
        }
        if (this.isAmateur) {
            return [`${awsAmateurBase}/${this.id}/${this.id}jp.jpg`, ...Array.from({ length: 8 }, (_, i) => `${awsAmateurBase}/${this.id}/${this.id}jp-${String(i + 1).padStart(3, '0')}.jpg`)];
        }
        const base = this.isMono ? picsMonoBase : picsDigiBase;
        const key = this.isMono ? this.id : this.vid;
        return [`${base}/${key}/${key}pl.jpg`, ...Array.from({ length: 8 }, (_, i) => `${base}/${key}/${key}jp-${i + 1}.jpg`)];
    }

    get videos() {
        if (this.isVr) {
            return [`${dmmVrVideos}/${this.vid[0]}/${this.vid.slice(0, 3)}/${this.vid}/${this.vid}vrlite.mp4`, `${dmmVrVideos}/${this.id[0]}/${this.id.slice(0, 3)}/${this.id}/${this.id}vrlite.mp4`];
        }
        if (this.isAmateur) {
            return [];
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

            const coverThumb = $el.find('img[data-src]').attr('data-src') || `https://fourhoi.com/${slug}/cover-t.jpg`;

            // ── 番号提取（与最新版 tag.ts 对齐）──────────────────────────────
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
                // FC2 / 数字开头番号：只输出一张 nJAV 缩略图，无视频
                parts.push(`<img src="${coverThumb}" width="100%" referrerpolicy="no-referrer"><br>`);
            } else {
                // 普通番号：DMM 图片（封面 + 剧照）→ DMM 预告片
                const avObj = new AV(code);

                const galleryImgs = avObj?.vid ? avObj.gallery : [];
                if (galleryImgs.length > 0) {
                    for (const imgUrl of galleryImgs) {
                        parts.push(`<img src="${imgUrl}" width="100%" referrerpolicy="no-referrer"><br>`);
                    }
                } else {
                    parts.push(`<img src="${coverThumb}" width="100%" referrerpolicy="no-referrer"><br>`);
                }

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
