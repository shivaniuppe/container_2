const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app2 = express();
app2.use(express.json());

app2.post('/calculate', (req, res) => {
    const data = req.body;
    const fileName = data.file;
    const product = data.product;
    const results = [];

    const filePath = path.join('/data', fileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({"file": fileName, "error": "File not found."});
    }

    let isCSVFormatValid = true;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headers) => {
            const trimmedHeaders = headers.map(header => header.trim().toLowerCase());
            const validHeaders = trimmedHeaders.length === 2 && 
                                 trimmedHeaders[0] === 'product' && 
                                 trimmedHeaders[1].replace(/\s/g, '') === 'amount';
            if (!validHeaders) {
                isCSVFormatValid = false;
            }
        })
        .on('data', (row) => {
            if (isCSVFormatValid) {
                const trimmedRow = {
                    product: row.product.trim(),
                    amount: row.amount.trim()
                };
                if (trimmedRow.product && trimmedRow.amount && !isNaN(parseInt(trimmedRow.amount, 10))) {
                    if (trimmedRow.product === product) {
                        results.push(parseInt(trimmedRow.amount, 10));
                    }
                } else {
                    isCSVFormatValid = false;
                }
            }
        })
        .on('end', () => {
            if (!isCSVFormatValid) {
                return res.status(400).json({"file": fileName, "error": "Input file not in CSV format."});
            }
            if (results.length === 0) {
                return res.status(400).json({"file": fileName, "error": "No matching product found."});
            }
            const sum = results.reduce((acc, curr) => acc + curr, 0);
            res.json({"file": fileName, "sum": sum});
        })
        .on('error', () => {
            res.status(400).json({"file": fileName, "error": "Input file not in CSV format."});
        });
});

app2.listen(6001, () => {
    console.log('Container 2 listening on port 6001');
});
