const fs = require('fs');
const path = require('path');

class Logger {
    static getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    static logToFile(type, message) {
        const logDate = this.getCurrentDate();
        const logFileName = `${logDate}.log`;
        const logsFolderPath = path.join(__dirname, '..', 'Logs');
        const logFilePath = path.join(logsFolderPath, logFileName);

        if (!fs.existsSync(logsFolderPath)) {
            fs.mkdirSync(logsFolderPath);
        }

        const formattedDate = new Date().toJSON();
        const formattedMessage = `[${formattedDate}] [${type}] ${message}\n`;

        fs.appendFile(logFilePath, formattedMessage, (err) => {
            if (err) {
                console.error(`Error writing to log file: ${err.message}`);
            }
        });
    }

    static info(message) {
        try {
            this.logToFile('INFO', message);
            console.log(message);
        } catch (error) {
            console.log(error.stack);
        }
    }

    static error(message) {
        try {
            this.logToFile('ERROR', message);
            console.log(message);
        } catch (error) {
            console.log(error.stack);
        }
    }

    static debug(message) {
        try {
            this.logToFile('DEBUG', message);
            console.log(message);
        } catch (error) {
            console.log(error.stack);
        }
    }
}

module.exports = Logger;