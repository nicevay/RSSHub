const got = require('@/utils/got');
const cheerio = require('cheerio');
const { parseDate } = require('@/utils/parse-date');

// ---------- 复用 AV 类逻辑 ----------
const codePattern = /^(?<label>[a-zA-Z]+)[-_]?(?<number>\d+)(?<suffix>[a-z]+)?$/;
const dmmMonoPics = 'https://p.dmm.co.jp/mono/movie/adult';
const dmmDigiPics = 'https://p.dmm.co.jp/digital/video';
const dmmVideos = 'https://cc3001.dmm.co.jp/litevideo/freepv';
const dmmVrVideos = 'https://cc3001.dmm.co.jp/vrsample';
const dmmMonoUrl = 'https://www.dmm.co.jp/mono/dvd/-/detail/=/cid=';
const dmmDigiUrl = 'https://www.dmm.co.jp/digital/videoa/-/detail/=/cid=';
const digiLabels = ['aiav', 'beaf', 'docd', 'docp', 'fax', 'fabs', 'hmrk', 'htms', 'hoks', 'kamef', 'kmai', 'maan', 'mdon', 'mfcd', 'mfct', 'mgtd', 'neob', 'open', 'sdhs', 'senn', 'seth', 'shyn', 'silks', 'silku', 'sprd', 'sqis', 'stzy', 'vov', 'xox', 'yyds'];
const vrLabels = ['aqube', 'aquco', 'aquga', 'aquma', 'exmo', 'fsvss', 'gopj', 'komz', 'slr', 'urvrsp', 'kmhrs'];
const labels = {
    1: ['aiav', 'boko', 'dandy', 'dldss', 'emois', 'fadss', 'fcdss', 'fsdss', 'fsvss', 'ftav', 'iene', 'kire', 'kkbt', 'kmhr', 'kmhrs', 'kuse', 'mgold', 'mist', 'mogi', 'moon', 'msfh', 'mtall', 'namh', 'nhdt', 'nhdta', 'nhdtb', 'noskn', 'open', 'piyo', 'rct', 'rctd', 'sace', 'sdab', 'sdam', 'sdde', 'sdhs', 'sdjs', 'sdmf', 'sdmm', 'sdms', 'sdmt', 'sdmu', 'sdmua', 'sdnm', 'sdth', 'senn', 'setm', 'seth', 'sgki', 'shyn', 'silk', 'silks', 'silku', 'sply', 'star', 'stars', 'start', 'stzy', 'sun', 'suwk', 'svbgr', 'svcao', 'svdvd', 'svmgm', 'svnnp', 'svsha', 'svvrt', 'sw', 'wo'],
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
    constructor(s) {
        const match = s.match(codePattern);
        if (match) {
            this.label = match.groups.label.toLowerCase();
            this.number = match.groups.number;
            this.suffix = match.groups.suffix || '';
            for (const [key, list] of Object.entries(labels)) {
                if (list.includes(this.label)) {
                    this.id = '' + key + this.label + this.number + this.suffix;
                    this.vid = '' + key + this.label + this.number.padStart(5, '0') + this.suffix;
                    return;
                }
            }
            this.id = '' + this.label + this.number + this.suffix;
            this.vid = '' + this.label + this.number.padStart(5, '0') + this.suffix;
        }
    }
    get isVr() {
        return this.label.endsWith('vr') || vrLabels.includes(this.label);
    }
    get url() {
        return this.isVr || digiLabels.includes(this.label) ? '' + dmmDigiUrl + this.vid + '/' : '' + dmmMonoUrl + this.id + '/';
    }
    get cover() {
        return this.isVr || digiLabels.includes(this.label) ? `${dmmDigiPics}/${this.vid}/${this.vid}pl.jpg` : `${dmmMonoPics}/${this.id}/${this.id}pl.jpg`;
    }
    get videos() {
        if (this.isVr) {
            return [
                `${dmmVrVideos}/${this.vid[0]}/${this.vid.substring(0, 3)}/${this.vid}/${this.vid}vrlite.mp4`,
                `${dmmVrVideos}/${this.id[0]}/${this.id.substring(0, 3)}/${this.id}/${this.id}vrlite.mp4`,
            ];
        } else {
            return ['hhb', 'mhb', '_dmb_w', '_dm_s'].reduce((arr, suffix) => {
                arr.push(`${dmmVideos}/${this.vid[0]}/${this.vid.substring(0, 3)}/${this.vid}/${this.vid}suffix.mp4`.replace('suffix', suffix));
                arr.push(`${dmmVideos}/${this.id[0]}/${this.id.substring(0, 3)}/${this.id}/${this.id}suffix.mp4`.replace('suffix', suffix));
                return arr;
            }, []);
        }
    }
}
// ---------- AV 类定义结束 ----------

module.exports = async (ctx) => {
    const { tagid } = ctx.params;
    const url = `https://tktube.com/zh/tags/${tagid}/`;

    const response = await got(url);
    const $ = cheerio.load(response.data);

    // 获取所有视频条目节点并转为数组
    const list = $('div.item').get();

    const items = await Promise.all(
        list.map(async (el) => {
            const $el = $(el);
            const $link = $el.find('a').first();
            const href = $link.attr('href');
            if (!href) return null;

            const title = $el.find('strong.title').text().trim();
            const videoId = $el.find('span.ico-fav-0').attr('data-fav-video-id');
            if (!title || !videoId) return null;

            const $img = $el.find('img.thumb');
            const imgSrc = $img.attr('data-webp') || $img.attr('src');
            const dateText = $el.find('div.added em').text().trim();
            const pubDate = dateText ? parseDate(dateText) : null;

            // 1. 提取番号
            const lastPart = href.match(/\/([^/]+)\/?$/)[1];
            let code = '';
            const av = new AV(lastPart);
            if (av && av.label && av.number) {
                code = av.label + '-' + av.number;
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

            if (!code) return null;

            // 2. 探测有效 DMM 视频链接
            const avObj = new AV(code);
            let dmmVideoUrl = '';

            if (avObj && avObj.videos && avObj.videos.length > 0) {
                // 优先探测前两个候选（补零版 vs 原始版）
                const candidates = [avObj.videos[0], avObj.videos[1]];
                for (const cand of candidates) {
                    try {
                        // 使用 HEAD 请求快速检测链接，设置 Referer 绕过某些防盗链检查
                        const check = await got.head(cand, {
                            headers: { Referer: 'https://www.dmm.co.jp/' },
                            timeout: 1500, // 设置短超时
                        });
                        if (check.statusCode === 200) {
                            dmmVideoUrl = cand;
                            break;
                        }
                    } catch (e) {
                        // 404 或超时则继续尝试下一个
                    }
                }
                // 如果探测都失败，保底使用第一个
                if (!dmmVideoUrl) dmmVideoUrl = avObj.videos[0];
            }

            const embedUrl = `https://tktube.com/zh/embed/${videoId}`;
            const description = `
                <img src="${imgSrc}" width="100%"/><br>
                <iframe width="544" height="306" src="${dmmVideoUrl}" frameborder="0" allowfullscreen></iframe><br>
                <iframe width="544" height="306" src="${embedUrl}" frameborder="0" allowfullscreen></iframe><br>
            `;

            return {
                title,
                link: href,
                description,
                guid: href,
                pubDate,
            };
        })
    );

    ctx.state.data = {
        title: `TKTube - ${$('title').text() || '标签页'}`,
        link: url,
        description: $('meta[name="description"]').attr('content') || '',
        item: items.filter((i) => i !== null),
    };
};
