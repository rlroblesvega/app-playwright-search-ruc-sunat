import ExcelJS from "exceljs";

export class ExcelReader {
  constructor(filePath) {
    this.filePath = filePath;
    this.workbook = new ExcelJS.Workbook();
  }

  /* async readSheet(sheetNumber = 1) {
    await this.workbook.xlsx.readFile(this.filePath);

    const worksheet = this.workbook.getWorksheet(sheetNumber);
    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
      rows.push(row.values);
    });

    return rows;
  } */


  async  readColumn(columnNumber) {
    //const workbook = new ExcelJS.Workbook();
    await this.workbook.xlsx.readFile(this.filePath);
  
    // Get the first worksheet (index starts at 1)
    const worksheet = this.workbook.getWorksheet(1);
  
    const columnValues = [];
  
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const cellValue = row.getCell(columnNumber).value;
      columnValues.push(cellValue);
    });
  
    return columnValues;
  }
}

/* // Ejemplo de uso
(async () => {
  const reader = new ExcelReader("datos.xlsx");

  console.log("📌 Como filas:");
  const rows = await reader.readSheet();
  console.log(rows);

  console.log("📌 Como objetos:");
  const objects = await reader.readAsObjects();
  console.log(objects);
})();
 */