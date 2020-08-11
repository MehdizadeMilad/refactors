
const { promisify } = require('util');

const Redis = require('ioredis')
var client = client ? client : new Redis();

client.on('connect', function () {
    console.log('Redis OK');
});

client.on('error', function (err) {
    console.log('redis error: ' + err);
});

module.exports = {
    getInstance: client,

    /**
     * خواندنِ رکوردی خاص از حافظه موقت
     * @param {INTEGER} key کلیدِ رکوردِ مورد نظر
     */
    async get(key) {
        const getAsync = promisify(client.get).bind(client);
        let redisData = await getAsync(key);

        if (redisData === null || Object.keys(redisData).length === 0) return null;

        return await JSON.parse(redisData);
    },

    /**
     * ثبت داده در حافظه موقت
     * @param {INTEGER} key کلیدِ رکوردِ 
     * @param {INTEGER} objectValue داده برای ذخیره‌سازی
     * @param {INTEGER} expireTimeInSeconds مدت زمان به ثانیه، قبل از انقضاء
     */
    async set(key, objectValue, expireTimeInSeconds = 3600) {
        return await client.set(key, JSON.stringify(objectValue), 'EX', expireTimeInSeconds);
    },

    /**
     * ثبتِ داده در حافظه موقت تنها درصورتی که از قبل رکورد متناظر وجود نداشته باشد
     * @param {INTEGER} key کلیدِ رکوردِ 
     * @param {OBJECT} value مقدارِ داده
     */
    async setIfNotExists(key, value) {
        return await redis.setnx(key, value);
    },

    /**
     * افزایش مقدار عددی در حافظه موقت
     * @param {INTEGER} key کلیدِ رکوردِ 
     */
    async increaseIntegerValueInline(key) {
        client.incr(key);
    },

    /**
     * واکشیِ کلیدِ رکورد‌های حافظه موقت براساس یک الگو
     * @param {INTEGER} pattern الگوی مورد جستجو
     */
    async readMultiple(pattern) {
        const keysAsync = promisify(client.keys).bind(client);
        const mgetAsync = promisify(client.mget).bind(client);
        const redisKeys = await keysAsync(pattern);
        if (!redisKeys.length) return null;

        const allRecords = await mgetAsync(redisKeys);

        return await redisKeys.map((item, index) => {
            return {
                key: [item][0],
                values: allRecords[index]
            }
        })
    },

    /**
     * پاکسازی رکوردی خاص از حافظه موقت
     * @param {INTEGER} key کلیدِ رکوردِ مورد نظر
     */
    async clear(key) {
        await client.del(key);
    },

}