const Promise = require('bluebird');
const writeFile = Promise.promisify(require("fs").writeFile);

/**
 * @public
 * @async
 * Save the changes made to config.json
 * @returns {Promise<void>} Resolve when done
 */
exports.saveConfig = () => {
    return new Promise((resolve, reject) => {
        writeFile('config.json', JSON.stringify(global.Config, null, 2), 'utf8').then(() => {
            resolve();
        });
    })
}
/**
 * @public
 * @async
 * Overwrite databaseConfig with the given Object 
 * @param {Object} databaseConfig 
 * @returns {Promise<void>} Resolve when done
 */
exports.saveDatabaseConfig = (databaseConfig) => {
    return new Promise((resolve, reject) => {
        writeFile('database/config/config.json', JSON.stringify(databaseConfig, null, 2), 'utf8').then(() => {
            resolve();
        });
    })
}
/**
 * @public
 * @async
 * Generic save to disk function
 * @param {String} path Where to save
 * @param {Object} object What to save
 * @returns {Promise<void>} Resolve when done
 */
exports.save = (path, object) => {
    return new Promise((resolve, reject) => {
        writeFile(path, JSON.stringify(object, null, 2), 'utf8').then(() => {
            resolve();
        });
    })
}