const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "Usuarios-Ignacio-Tabla";

module.exports.login = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const { username, password } = body;

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Usuario y contraseña son obligatorios"
        }),
      };
    }

    if (username !== "admin" || password !== "1234") {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: "Credenciales incorrectas"
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Login exitoso",
        token: "fake-jwt-token"
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message
      }),
    };
  }
};

module.exports.createUser = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const user = {
      id: Date.now().toString(),
      name: body.name
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: user
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Usuario creado",
        user
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message
      }),
    };
  }
};

module.exports.users = async () => {
  try {
    const data = await dynamo.send(
      new ScanCommand({
        TableName: TABLE_NAME
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        users: data.Items
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message
      }),
    };
  }
};