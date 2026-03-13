import { load } from 'cheerio';

import type { Route } from '@/types';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';
import puppeteer from '@/utils/puppeteer';

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
        return this.label.endsWith('vr') || vrLabels.includes(this.label);
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
        const suffixes = ['hhb', 'mhb', '_dmb_w', '_dm_s'];
        const result: string[] = [];
        for (const sfx of suffixes) {
            result.push(`${dmmVideos}/${this.vid[0]}/${this.vid.slice(0, 3)}/${this.vid}/${this.vid}${sfx}.mp4`);
            result.push(`${dmmVideos}/${this.id[0]}/${this.id.slice(0, 3)}/${this.id}/${this.id}${sfx}.mp4`);
        }
        return result;
    }
}
// ---------- AV 类定义结束 ----------

async function detectVideoUrl(candidates: string[]): Promise<string> {
    const results = await Promise.all(
        candidates.map(async (url) => {
            try {
                const res = await got(url, {
                    method: 'HEAD',
                    headers: { Referer: 'https://www.dmm.co.jp/' },
                    timeout: { request: 1500 },
                    throwHttpErrors: false,
                });
                return res.statusCode === 200 ? url : '';
            } catch {
                return '';
            }
        })
    );
    return results.find((u) => u !== '') ?? '';
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

    // 使用 puppeteer 绕过 Cloudflare Bot 验证
    const browser = await puppeteer();
    const page = await browser.newPage();

    let html = '';
    try {
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

            // 优先从 title 提取番号（如 "NACR-726 ..."），比 URL slug 更可靠
            let code = '';
            const titleCodeMatch = title.match(/^([A-Za-z]+-\d+)/);
            if (titleCodeMatch) {
                code = titleCodeMatch[1];
            } else {
                // fallback：从 URL 最后一段提取
                const lastPartMatch = href.match(/\/([^/]+)\/?$/);
                if (!lastPartMatch) {
                    return null;
                }
                const lastPart = lastPartMatch[1];
                const avTest = new AV(lastPart);
                if (avTest?.label && avTest?.number) {
                    code = `${avTest.label}-${avTest.number}`;
                } else {
                    const fc2Match = lastPart.match(/^(fc2-ppv-\d+)/i);
                    if (fc2Match) {
                        code = fc2Match[1];
                    } else {
                        const generalMatch = lastPart.match(/([a-z]+[-_]?\d+)/i);
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
            let dmmVideoUrl = '';

            if (avObj?.videos?.length > 0) {
                dmmVideoUrl = await detectVideoUrl(avObj.videos);
                if (!dmmVideoUrl) {
                    dmmVideoUrl = avObj.videos[0];
                }
            }

            const embedUrl = `https://tktube.com/zh/embed/${videoId}`;

            const description = [
                imgSrc ? `<img src="${imgSrc}" width="100%"/><br>` : '',
                dmmVideoUrl ? `<iframe width="544" height="306" src="${dmmVideoUrl}" frameborder="0" allowfullscreen></iframe><br>` : '',
                `<iframe width="544" height="306" src="${embedUrl}" frameborder="0" allowfullscreen></iframe><br>`,
            ].join('\n');

            return {
                title,
                link: href,
                description,
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
