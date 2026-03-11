const got = require('@/utils/got');
const { load } = require('cheerio');
const { parseDate } = require('@/utils/parse-date');

// ---------- 复用您提供的 AV 类逻辑 ----------
const dmmVideos = 'https://cc3001.dmm.co.jp/litevideo/freepv';
const labels = {
    h_237: ['ambi', 'clot', 'find', 'hdka', 'nacr', 'nacx', 'zmar'],
    // ... 其他标签建议保留在类外部作为常量 ...
};

class AV {
    constructor(s) {
        const match = s.match(/^(?<label>[a-zA-Z]+)[-_]?(?<number>\d+)(?<suffix>[a-z]+)?$/);
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
            this.id = this.label + this.number;
            this.vid = this.label + this.number.padStart(5, '0');
        }
    }
    get videos() {
        return ['hhb', 'mhb', '_dmb_w', '_dm_s'].reduce((arr, suffix) => {
            arr.push(`${dmmVideos}/${this.vid?.[0]}/${this.vid?.substring(0, 3)}/${this.vid}/${this.vid}${suffix}.mp4`);
            arr.push(`${dmmVideos}/${this.id?.[0]}/${this.id?.substring(0, 3)}/${this.id}/${this.id}${suffix}.mp4`);
            return arr;
        }, []);
    }
}

// ---------- 按照“新路由制作方法”导出 ----------
module。exports = {
    route: {
        path: '/tag/:tagid',
        categories: ['multimedia'],
        example: '/tktube/tag/d16507037fea89b20ca12ea5159474e5',
        parameters: { tagid: '标签 ID' },
        name: '标签视频订阅',
        maintainers: ['YourName'],
        handler: async (ctx) => {
            const tagid = ctx.req.param('tagid');
            const url = `https://tktube.com/zh/tags/${tagid}/`;

            const response = await got(url);
            const $ = load(response.data);
            const list = $('div.item').get();

            const items = await Promise.全部(
                list.map(async (el) => {
                    const $el = $(el);
                    const href = $el.find('a').first().attr('href');
                    const title = $el.find('strong.title').text().trim();
                    const videoId = $el.find('span.ico-fav-0').attr('data-fav-video-id');
                    
                    if (!href || !videoId) return null;

                    const dateText = $el.find('div.added em').text().trim();
                    const imgSrc = $el.find('img.thumb').attr('data-webp') || $el.find('img.thumb').attr('src');

                    // 提取番号并探测有效 DMM 链接
                    const lastPart = href.match(/\/([^/]+)\/?$/)[1];
                    const avObj = new AV(lastPart);
                    let dmmVideoUrl = '';

                    if (avObj && avObj.videos) {
                        const candidates = [avObj.videos[0], avObj.videos[1]]; // 0是补零版，1是原始版
                        for (const cand of candidates) {
                            try {
                                const check = await got.head(cand, {
                                    headers: { Referer: 'https://www.dmm.co.jp/' },
                                    timeout: 1000,
                                });
                                if (check.statusCode === 200) {
                                    dmmVideoUrl = cand;
                                    break;
                                }
                            } catch (e) { /* ignore */ }
                        }
                        if (!dmmVideoUrl) dmmVideoUrl = avObj.videos[0];
                    }

                    return {
                        title,
                        link: href,
                        description: `
                            <img src="${imgSrc}" width="100%"/><br>
                            <iframe width="544" height="306" src="${dmmVideoUrl}" frameborder="0" allowfullscreen></iframe><br>
                            <iframe width="544" height="306" src="https://tktube.com/zh/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                        `,
                        pubDate: parseDate(dateText),
                    };
                })
            );

            return {
                title: `TKTube - ${$('title').text()}`,
                link: url,
                item: items.filter((i) => i !== null),
            };
        },
    },
};
