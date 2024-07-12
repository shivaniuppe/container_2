const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Transform } = require('stream');

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

    const trimStream = new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        transform(chunk, encoding, callback) {
            const trimmedLine = chunk.toString().split('\n').map(line => line.split(',').map(part => part.trim()).join(',')).join('\n');
            callback(null, trimmedLine);
        }
    });

    fs.createReadStream(filePath)
        .pipe(trimStream)
        .pipe(csv())
        .on('headers', (headers) => {
            if (headers.length !== 2 || headers[0] !== 'product' || headers[1] !== 'amount') {
                isCSVFormatValid = false;
            }
        })
        .on('data', (row) => {
            if (isCSVFormatValid) {
                if (row.product && row.amount && !isNaN(parseInt(row.amount, 10))) {
                    if (row.product === product) {
                        results.push(parseInt(row.amount, 10));
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
    console.log('Container 2 listening on port 6010');
});


