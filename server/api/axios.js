import ExcelJS from 'exceljs';
import axios from 'axios';
import JSONStream from 'JSONStream';

export default defineEventHandler(async (event) => {
    try {
        // Spring 백엔드로부터 데이터를 스트리밍으로 가져옵니다.
        const response = await axios.get('http://localhost:8080/excel', {
            responseType: 'stream'
        });

        event.res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        event.res.setHeader('Content-Disposition', 'attachment; filename="output.xlsx"');

        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
            stream: event.res, // Excel 데이터를 직접 HTTP 응답 스트림에 쓰기
            useStyles: false,
            useSharedStrings: false
        });
        const worksheet = workbook.addWorksheet('Data');

        const reader = response.data.pipe(JSONStream.parse('*'));
        reader.on('data', (data) => {
            worksheet.addRow(data).commit();
        });

        reader.on('end', async () => {
            await workbook.commit();
            event.res.end();
        });

        reader.on('error', (err) => {
            console.error('Error while reading stream:', err);
            event.res.statusCode = 500;
            event.res.end('Internal Server Error');
        });

    } catch (error) {
        console.error('Error while fetching data:', error);
        event.res.statusCode = 500;
        event.res.end('Internal Server Error');
    }
});
