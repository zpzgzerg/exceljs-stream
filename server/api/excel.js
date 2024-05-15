import ExcelJS from 'exceljs';

export default defineEventHandler(async (event) => {
    const response = await fetch('http://localhost:8080/');
    const reader = response.body.getReader();

    event.res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    event.res.setHeader('Content-Disposition', 'attachment; filename="output.xlsx"');

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: event.res, // Excel 데이터를 직접 HTTP 응답 스트림에 쓰기
        useStyles: false,
        useSharedStrings: false
    });
    const worksheet = workbook.addWorksheet('Data');

    // 스트림 처리
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const json = new TextDecoder('utf-8').decode(value);
        json.split('\n').forEach(line => {
            if (line) {
                const data = JSON.parse(line);
                worksheet.addRow(data).commit();
            }
        });
    }

    await workbook.commit();
    event.res.end();
});