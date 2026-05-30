require("dotenv").config();

const mysql = require("mysql2/promise");

const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

const response = (statusCode, body) => ({
  statusCode,
  body: JSON.stringify(body),
});

const parseBody = (event) => {
  if (!event?.body) return {};
  if (typeof event.body === "object") return event.body;
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
};

module.exports.login = async (event) => {
  try {
    const body = parseBody(event);
    const { username, password } = body;

    if (!username || !password) {
      return response(400, { message: "Usuario y contraseña son obligatorios" });
    }

    if (username !== "admin" || password !== "1234") {
      return response(401, { message: "Credenciales incorrectas" });
    }

    return response(200, {
      message: "Login exitoso",
      token: "fake-jwt-token",
    });

  } catch (error) {
    return response(500, { message: error.message });
  }
};

module.exports.createUser = async (event) => {
  let conn;
  try {
    const data = parseBody(event);
    conn = await getConnection();

    const [result] = await conn.execute(
      `INSERT INTO User (firstName, lastName, email, phoneNumber, password, active, idEnterprise, birthday, locale)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.firstName ?? null,
        data.lastName ?? null,
        data.email ?? null,
        data.phoneNumber ?? null,
        data.password ?? '123',
        data.active ?? 1,
        data.idEnterprise ?? null,
        data.birthday ?? null,
        data.locale ?? 'es_ES'
      ]
    );

    return response(201, {
      message: "Usuario creado",
      id: result.insertId,
    });

  } catch (error) {
    return response(500, { message: error.message });
  } finally {
    if (conn) await conn.end();
  }
};

module.exports.verUser = async (event) => {
  let conn;
  try {
    const id = event?.pathParameters?.id;
    if (!id) return response(400, { message: "Falta el id" });

    conn = await getConnection();
    const [rows] = await conn.execute(
      "SELECT * FROM User WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return response(404, { message: "Usuario no encontrado" });
    }

    return response(200, rows[0]);

  } catch (error) {
    return response(500, { message: error.message });
  } finally {
    if (conn) await conn.end();
  }
};

module.exports.modificarUser = async (event) => {
  let conn;
  try {
    const data = parseBody(event);
    const id = data.id; 
    
    if (!id) return response(400, { message: "Falta el id en el JSON" });

    const allowedFields = [
      "firstName", "lastName", "email", "phoneNumber", 
      "active", "idEnterprise", "birthday", "locale", "password"
    ];
    
    const fieldsToUpdate = [];
    const values = [];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        fieldsToUpdate.push(`${field} = ?`);
        values.push(data[field]);
      }
    });

    if (fieldsToUpdate.length === 0) {
      return response(400, { message: "No se han enviado campos para modificar" });
    }

    values.push(id);

    conn = await getConnection();

    const query = `UPDATE User SET ${fieldsToUpdate.join(", ")} WHERE id = ?`;

    await conn.execute(query, values);

    return response(200, { message: "Usuario actualizado correctamente", id });

  } catch (error) {
    return response(500, { message: error.message });
  } finally {
    if (conn) await conn.end();
  }
};

module.exports.eliminarUser = async (event) => {
  let conn;
  try {
    const data = parseBody(event);
    const id = data.id; 
    
    if (!id) return response(400, { message: "Falta el id en el JSON" });

    conn = await getConnection();
    await conn.execute("DELETE FROM User WHERE id = ?", [id]);

    return response(200, { message: `Usuario con ID ${id} eliminado` });

  } catch (error) {
    return response(500, { message: error.message });
  } finally {
    if (conn) await conn.end();
  }
};

module.exports.listUsers = async () => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute("SELECT * FROM User");

    return response(200, { users: rows });

  } catch (error) {
    return response(500, { message: error.message });
  } finally {
    if (conn) await conn.end();
  }
};