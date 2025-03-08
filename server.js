const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Habilitar CORS
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta principal
app.use(express.static(__dirname));

// Ruta para servir index.html cuando se acceda a la raíz "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Fidel200310',  // Reemplazar por tu contraseña
    database: 'youtube',
    port: 3306
});

// Conexión a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
        return;
    }
    console.log('Conectado a la base de datos MySQL');

    // Crear la tabla si no existe
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS videos (
        id_auto INT AUTO_INCREMENT PRIMARY KEY,
        id_manual VARCHAR(255) UNIQUE,
        title VARCHAR(255),
        description TEXT
    )`;

    db.query(createTableQuery, (err, result) => {
        if (err) {
            console.error('Error al crear la tabla:', err.message);
        } else {
            console.log('Tabla "videos" verificada/creada correctamente');
        }
    });

    // Cargar videos desde la API de YouTube al iniciar el servidor
    loadVideosFromAPI();
});

// Función para cargar videos desde la API de YouTube
const loadVideosFromAPI = async () => {
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=music&type=video&key=AIzaSyCG72aaO654MbYShXtATG0NcsA9JutJlBo`;

    try {
        const response = await axios.get(apiUrl);
        const videos = response.data.items;

        // Verificar si los videos ya existen en la base de datos antes de guardarlos
        const existingVideos = await fetchVideosFromDatabase();
        const existingVideoIds = existingVideos.map(video => video.id_manual);

        videos.forEach(video => {
            const videoId = video.id.videoId;
            if (!existingVideoIds.includes(videoId)) {
                saveVideoToDatabase(video); // Guardar solo si no existe
            }
        });

        console.log('Videos cargados desde la API y guardados en la base de datos');
    } catch (error) {
        console.error('Error al cargar videos desde la API:', error.message);
    }
};

// Función para guardar videos en la base de datos
const saveVideoToDatabase = async (video) => {
    const { videoId, title, description } = {
        videoId: video.id.videoId,
        title: video.snippet.title,
        description: video.snippet.description
    };

    const sql = 'INSERT INTO videos (id_manual, title, description) VALUES (?, ?, ?)';
    db.query(sql, [videoId, title, description], (err, result) => {
        if (err) {
            console.error('Error al guardar el video:', err);
        } else {
            console.log('Video guardado exitosamente');
        }
    });
};

// Función para obtener videos guardados en la base de datos
const fetchVideosFromDatabase = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM videos';
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error al obtener videos de la base de datos:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

app.post('/saveVideo', (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'El título y la descripción son obligatorios' });
    }

    console.log("Datos recibidos:", req.body);

    const sql = 'INSERT INTO videos (title, description) VALUES (?, ?)';
    db.query(sql, [title, description], (err, result) => {
        if (err) {
            console.error('Error al guardar el video:', err);
            return res.status(500).json({ message: 'Error al guardar el video' });
        }
        res.status(200).json({ 
            message: 'Video guardado exitosamente',
            videoId: result.insertId // Devuelve el ID generado automáticamente
        });
    });
});



// Endpoint para obtener todos los videos
app.get('/getVideos', (req, res) => {
    const sql = 'SELECT * FROM videos';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener videos de la base de datos:', err);
            return res.status(500).json({ message: 'Error al obtener los videos' });
        }
        res.status(200).json(results);
    });
});

// Endpoint para actualizar video (usando id_auto)
app.put('/updateVideo/:id', (req, res) => {
    const videoId = req.params.id;
    const { title, description } = req.body;
    const sql = 'UPDATE videos SET title = ?, description = ? WHERE id_auto = ?';
    db.query(sql, [title, description, videoId], (err, result) => {
        if (err) {
            console.error('Error al actualizar el video:', err);
            return res.status(500).json({ message: 'Error al actualizar el video' });
        }
        res.status(200).json({ message: 'Video actualizado correctamente' });
    });
});

// Endpoint para actualizar video (usando id_manual)
app.put('/updateVideoManual/:id', (req, res) => {
    const videoId = req.params.id;
    const { title, description } = req.body;
    const sql = 'UPDATE videos SET title = ?, description = ? WHERE id_manual = ?';
    db.query(sql, [title, description, videoId], (err, result) => {
        if (err) {
            console.error('Error al actualizar el video:', err);
            return res.status(500).json({ message: 'Error al actualizar el video' });
        }
        res.status(200).json({ message: 'Video actualizado correctamente' });
    });
});

// Endpoint para eliminar video (usando id_auto)
app.delete('/deleteVideo/:id', (req, res) => {
    const videoId = req.params.id;
    const sql = 'DELETE FROM videos WHERE id_auto = ?';
    db.query(sql, [videoId], (err, result) => {
        if (err) {
            console.error('Error al eliminar el video:', err);
            return res.status(500).json({ message: 'Error al eliminar el video' });
        }
        res.status(200).json({ message: 'Video eliminado correctamente' });
    });
});

// Endpoint para eliminar video (usando id_manual)
app.delete('/deleteVideoManual/:id', (req, res) => {
    const videoId = req.params.id;
    const sql = 'DELETE FROM videos WHERE id_manual = ?';
    db.query(sql, [videoId], (err, result) => {
        if (err) {
            console.error('Error al eliminar el video:', err);
            return res.status(500).json({ message: 'Error al eliminar el video' });
        }
        res.status(200).json({ message: 'Video eliminado correctamente' });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
