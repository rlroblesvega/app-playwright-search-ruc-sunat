import pkg from "pg";
const { Pool } = pkg;

export class Database {
  constructor(config) {
   this.pool = new Pool(config);
  }

  /* async connect() {
    await this.client.connect();
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS representantes_legales (
        id SERIAL PRIMARY KEY,
        document_type VARCHAR(10),
        document_numer VARCHAR(20),
        full_name VARCHAR(100),
        position VARCHAR(40),
        position_date DATE
      )
    `);
    console.log("Conectado a PostgreSQL ✅");
  } */

  async insertRepresentante(item) {
    await this.pool.query(
      `INSERT INTO db_rimac_cl_dev.representantes_legales
       (document_type, document_numer, full_name, position, position_date)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        item.tipoDocumento,
        item.nroDocumento,
        item.nombre,
        item.cargo,
        item.fechaDesde,
      ]
    );
  }

  async close() {
    await this.pool.end();
    console.log("Conexión a PostgreSQL cerrada ✅");
  }
}
