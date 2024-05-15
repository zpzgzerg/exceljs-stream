import { sendStream, sendError, createError, defineEventHandler } from 'h3';
import ExcelJS from 'exceljs';
import axios from 'axios';
import JSONStream from 'JSONStream';
import { PassThrough } from 'stream';

export default defineEventHandler(async (event) => {
    try {
        // Spring 백엔드로부터 데이터를 스트리밍으로 가져옵니다.
        const response = await axios.get('http://localhost:8080/excel', {
            responseType: 'stream'
        });

        // ExcelJS 스트림을 위한 PassThrough 스트림 생성
        const passthrough = new PassThrough();

        // ExcelJS 스트림 설정
        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
            stream: passthrough,
            useStyles: false,
            useSharedStrings: false
        });
        const worksheet = workbook.addWorksheet('Data');

        // JSON 데이터를 읽어와서 Excel로 쓰기
        const reader = response.data.pipe(JSONStream.parse('*'));
        reader.on('data', (data) => {
            worksheet.addRow(data).commit();
        });

        reader.on('end', async () => {
            await workbook.commit();
            passthrough.end();
        });

        reader.on('error', (err) => {
            console.error('Error while reading stream:', err);
            passthrough.destroy(err);
        });

        // Content-Type 및 Content-Disposition 헤더 설정
        event.node.res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        event.node.res.setHeader('Content-Disposition', 'attachment; filename="output.xlsx"');

        // 스트림 전송
        return sendStream(event, passthrough);

    } catch (error) {
        console.error('Error while fetching data:', error);
        sendError(event, createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error'
        }));
    }
});
