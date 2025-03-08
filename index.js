const keyApi = "AIzaSyCG72aaO654MbYShXtATG0NcsA9JutJlBo";
const box = document.querySelector(".box");
const searchInput = document.getElementById("searchInput");

// Función para obtener datos de la API de YouTube
const fetchYouTubeData = async (urlApi) => {
    const response = await fetch(urlApi);
    if (!response.ok) {
        throw new Error("Error al realizar la búsqueda en YouTube");
    }
    return await response.json();
};

// Función para mostrar videos en el contenedor
const displayVideos = (videos, fromDatabase = false) => {
    box.innerHTML = ""; // Limpiar el contenedor
    videos.forEach((video) => {
        const videoId = video.id_manual || video.id.videoId || video.id;
        const title = video.title || video.snippet?.title;
        const description = video.description || video.snippet?.description;

        box.innerHTML += `
        <div class="video" data-id="${videoId}">
            <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
            <div class="video-info">
                <input class="video-title" type="text" value="${title}" ${fromDatabase ? '' : 'readonly'} />
                <textarea class="video-description" ${fromDatabase ? '' : 'readonly'}>${description}</textarea>
                ${fromDatabase ? `
                <button class="editBtn">Guardar Cambios</button>
                <button class="cancelBtn">Cancelar</button>
                <button class="deleteBtn">Eliminar</button>` : ''}
            </div>
        </div>
        `;
    });
};

// Función para buscar videos en la API de YouTube (solo noticias y entretenimiento)
async function searchVideos(query) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${query}&type=video&key=${keyApi}&videoCategoryId=25,24`;

    const data = await fetchYouTubeData(apiUrl);
    return data.items;
}

// Función para guardar videos en la base de datos
const saveVideoToDatabase = async (video) => {
    const response = await fetch('http://localhost:3000/saveVideo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            videoId: video.id.videoId || video.id,
            title: video.snippet?.title,
            description: video.snippet?.description
        })
    });

    if (!response.ok) {
        console.error('Error al guardar el video en la base de datos');
    } else {
        console.log('Video guardado exitosamente');
    }
};

// Función para obtener videos guardados en la base de datos
const fetchVideosFromDatabase = async () => {
    const response = await fetch('http://localhost:3000/getVideos');
    if (!response.ok) {
        console.error('Error al obtener videos de la base de datos');
        return [];
    }
    return await response.json();
};

// Función para actualizar video
const updateVideoInDatabase = async (videoId, title, description) => {
    try {
        const response = await fetch(`http://localhost:3000/updateVideoManual/${videoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description }),
        });

        if (!response.ok) {
            throw new Error('Error al actualizar el video');
        }

        const result = await response.json();
        if (result.message === 'Video actualizado correctamente') {
            alert('Cambios guardados exitosamente en la base de datos');
            return true;
        } else {
            alert('Cambios no guardados correctamente');
            return false;
        }
    } catch (error) {
        console.error('Error al actualizar el video:', error);
        alert('Hubo un error al guardar los cambios');
        return false;
    }
};

// Función para eliminar video
const deleteVideoFromDatabase = async (videoId) => {
    try {
        const response = await fetch(`http://localhost:3000/deleteVideoManual/${videoId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Error al eliminar el video');
        }

        const result = await response.json();
        if (result.message === 'Video eliminado correctamente') {
            alert('Video eliminado correctamente');
            return true;
        } else {
            alert('No se pudo eliminar el video');
            return false;
        }
    } catch (error) {
        console.error('Error al eliminar el video:', error);
        alert('Hubo un error al eliminar el video');
        return false;
    }
};

// Función para extraer el videoId de una URL de YouTube
function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Evento de búsqueda
document.getElementById("buscarYoutube").addEventListener("click", async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();

    // Intentar cargar desde la base de datos
    let videos = await fetchVideosFromDatabase();

    // Si no hay resultados, consultar la API de YouTube
    if (videos.length === 0 && query) {
        videos = await searchVideos(query);
        displayVideos(videos, true); // Mostrar videos con opciones de editar y eliminar

        // Guardar automáticamente en la base de datos
        videos.forEach(saveVideoToDatabase);
    } else {
        displayVideos(videos, true); // Mostrar videos obtenidos de la base de datos
    }
});

// Mostrar/ocultar el formulario para agregar un nuevo video
document.getElementById("addVideoBtn").addEventListener("click", () => {
    document.getElementById("addVideoForm").style.display = "block";
});

document.getElementById("cancelAddVideoBtn").addEventListener("click", () => {
    document.getElementById("addVideoForm").style.display = "none";
});

// Guardar el nuevo video en la base de datos
document.getElementById("saveVideoBtn").addEventListener("click", async () => {
    const title = document.getElementById("newVideoTitle").value;
    const description = document.getElementById("newVideoDescription").value;
    const url = document.getElementById("newVideoUrl").value;

    if (!title || !description || !url) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
        alert("La URL del video de YouTube no es válida.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/saveVideo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                videoId,
                title,
                description
            })
        });

        if (!response.ok) {
            throw new Error("Error al guardar el video en la base de datos");
        }

        alert("Video guardado exitosamente");
        document.getElementById("addVideoForm").style.display = "none";

        // Actualizar la lista de videos
        const videos = await fetchVideosFromDatabase();
        displayVideos(videos, true);

    } catch (error) {
        console.error("Error:", error);
        alert("Hubo un error al guardar el video");
    }
});

// Eventos de guardar cambios y eliminar
box.addEventListener('click', async (e) => {
    const target = e.target;
    const videoElement = target.closest('.video');
    const videoId = videoElement.dataset.id;

    if (target.classList.contains('editBtn')) {
        const newTitle = videoElement.querySelector('.video-title').value;
        const newDescription = videoElement.querySelector('.video-description').value;
        const isUpdated = await updateVideoInDatabase(videoId, newTitle, newDescription);

        if (isUpdated) {
            videoElement.querySelector('.video-title').readOnly = true;
            videoElement.querySelector('.video-description').readOnly = true;
        }
    } else if (target.classList.contains('deleteBtn')) {
        const isDeleted = await deleteVideoFromDatabase(videoId);
        if (isDeleted) {
            // Refrescar la lista de videos desde la base de datos
            const videos = await fetchVideosFromDatabase();
            displayVideos(videos, true); // Mostrar la lista actualizada
        }
    } else if (target.classList.contains('cancelBtn')) {
        alert('Edición cancelada');
    }
});

// Cargar videos desde la base de datos al inicio
const loadVideosFromDatabase = async () => {
    const videos = await fetchVideosFromDatabase();
    if (videos.length > 0) {
        displayVideos(videos, true); // Mostrar videos desde la base de datos
    }
};

// Cargar los videos cuando se carga la página
loadVideosFromDatabase();

//comentario prueba