var winston = require('winston');
var src = process.cwd() + '/app/';

winston.emitErrs = true;

/**
 * Logger
 * @param module
 * @returns {*}
 */
function logger(module) {
    return new winston.Logger({
        transports: [
            new winston.transports.File({
                level: 'info',
                filename: src + 'log/all.log',
                handleException: true,
                json: true,
                maxSize: 5242880, //5mb 
                maxFiles: 2,
                colorize: false
            }),
            new winston.transports.Console({
                level: 'debug',
                label: getFilePath(module),
                handleException: true,
                json: false,
                colorize: true
            })
        ],
        exitOnError: false
    });
}

function getFilePath(module) {
    return module.filename.split('/').slice(-2).join('/');
}

module.exports = logger;
