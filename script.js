const SUPABASE_URL = 'https://hzmhobnwqqwamdtzspbv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bWhvYm53cXF3YW1kdHpzcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzQwMzEsImV4cCI6MjA4MjQ1MDAzMX0.JGb8TpU6tbFfSBi2Gs34YzciYGgQu5gUvWtdnHm6F2I';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;

    try {
        const formData = new FormData(e.target);
        const acompañantes = [];
        document.querySelectorAll('.acompanante-input').forEach(input => {
            if (input.value.trim()) acompañantes.push({ nombre: input.value.trim() });
        });

        // Este objeto debe ser IGUAL a las columnas de tu tabla
        const dataToInsert = {
            nombre_completo: formData.get('nombre'),
            relacion_familia: formData.get('relacion'),
            plan_participacion: formData.get('plan'),
            hora_llegada: formData.get('hora'),
            comentarios: formData.get('comentarios'),
            acompanantes: acompañantes,
            total_personas: acompañantes.length + 1,
            user_agent: navigator.userAgent,
            fecha_registro: new Date().toISOString()
        };

        const { error } = await supabaseClient.from('invitados_familia_cortez').insert([dataToInsert]);

        if (error) throw error;

        // Mostrar éxito
        document.getElementById('confirmation-modal').classList.add('active');
        document.querySelector('.confirmation-content').innerHTML = `
            <i class="fas fa-check-circle" style="font-size:4rem; color:#10b981;"></i>
            <h2>¡Confirmado!</h2>
            <p>Gracias por confirmar tu asistencia.</p>
            <button onclick="location.reload()" class="btn-submit">Cerrar</button>
        `;
    } catch (err) {
        console.error('Error final:', err);
        alert('Error: ' + err.message);
    } finally {
        btn.disabled = false;
    }
}
