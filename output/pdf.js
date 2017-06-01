const fs = require('fs');
const markdownpdf = require('markdown-pdf');

const markdown = require('./markdown');
const Cli = require('./../include/cli');

class pdf extends markdown {
    toFile(file, resolve, style = 'default') {
        if (fs.existsSync(file)) fs.unlinkSync(file);

        markdownpdf({
            cssPath: `${__dirname}/styles/layout/${style}.css`,
            highlightCssPath: `${__dirname}/styles/highlight/${style}.css`
        }).from.string(this.out).to(file, () => resolve());
    }

    toStdOut() {
        Cli.error(`Can't output pdf to std out`);
    }
}

module.exports = pdf;