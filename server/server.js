const http = require('http');
const Firebird = require('node-firebird');
const path = require('path');

const dbName = 'INAREPS';
const baseDir = path.join(__dirname, 'databases');
const databasePath = path.join(baseDir, `${dbName}.fdb`);

// Configuración base para la conexión a Firebird
const firebirdOptions = {
  host: 'localhost',
  port: 3050,
  database: databasePath,
  user: 'SYSDBA',
  password: 'masterkey',
  wireCrypt: 'Enabled'
};

// Función para conectar a la base de datos
function connectToDatabase(callback) {
  Firebird.attach(firebirdOptions, (err, db) => {
    if (err) {
      console.error('Error al conectar con la base de datos:', err);
      return callback(err);
    }
    console.log('Conexión exitosa a la base de datos Firebird');
    callback(null, db);
  });
}

// Función para conectar a la base de datos
function connectToDatabase(callback) {
  Firebird.attach(firebirdOptions, (err, db) => {
    if (err) {
      console.error('Error al conectar con la base de datos:', err.message);
      return callback(err);
    }
    console.log('Conexión exitosa a la base de datos Firebird');
    callback(null, db);
  });
}

const requestHandler = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); // No Content
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/guardar-datos') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      let productos;
      try {
        productos = JSON.parse(body);
      } catch (e) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'Datos inválidos' }));
      }

      if (!Array.isArray(productos)) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'Datos inválidos' }));
      }

      connectToDatabase((err, db) => {
        if (err) return res.writeHead(500).end(JSON.stringify({ message: 'Error de conexión a la base de datos' }));
          productos.forEach(producto => {
            const { CodigoProducto, Cantidad, Fecha, Hora } = producto;
            const insertQuery = 'INSERT INTO Inventario (Codigo, Cantidad, Fecha, Hora) VALUES (?, ?, ?, ?)';

            db.query(insertQuery, [CodigoProducto, Cantidad, Fecha, Hora], (err) => {
            if (err) {
                // Si hay un error, hacer rollback y cerrar la conexión
                  db.query('ROLLBACK', () => {
                    db.detach(); // Cerrar la conexión
                  });
                }
            })
        })
      })
    });

  } else if (req.method === 'GET' && req.url === '/mostrar-datos') {
    connectToDatabase((err, db) => {
      if (err) {
        return res.writeHead(500).end(JSON.stringify({ message: 'Error de conexión a la base de datos' }));
      }

      const selectQuery = 'SELECT * FROM Inventario';
      db.query(selectQuery, (err, result) => {
        db.detach(); // Cerrar la conexión

        if (err) {
          return res.writeHead(500).end(JSON.stringify({ message: `Error al obtener datos: ${err.message}` }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      });
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
  }
};

// Iniciar el servidor
const server = http.createServer(requestHandler);

server.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});
