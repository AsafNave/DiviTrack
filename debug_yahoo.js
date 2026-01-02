
import http from 'http';

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/yahoo/v8/finance/chart/AAPL?interval=1d&range=1y&events=div',
    method: 'GET',
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            const result = parsed.chart.result[0];
            console.log('Events:', JSON.stringify(result.events, null, 2));
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw data:', data.substring(0, 500));
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
