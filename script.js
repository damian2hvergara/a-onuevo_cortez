const SUPABASE_URL = 'https://hzmhobnwqqwamdtzspbv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bWhvYm53cXF3YW1kdHpzcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzQwMzEsImV4cCI6MjA4MjQ1MDAzMX0.JGb8TpU6tbFfSBi2Gs34YzciYGgQu5gUvWtdnHm6F2I';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('confirmation-form');
    if (form) form.addEventListener('submit', handleFormSubmit);
});

async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = 'Enviando...';

    try {
        const formData = new FormData(e.target);
        const acompañantes = [];
        // Captura los inputs de acompañantes si existen
        document.querySelectorAll('.acompanante-input').forEach(input => {
            if (input.value.trim()) acompañantes.push({ nombre: input.value.trim() });
        });

        const dataToSend = {
            nombre_completo: formData.get('nombre'),
            relacion_familia: formData.get('relacion'),
            plan_participacion: formData.get('plan'),
            hora_llegada: formData.get('hora'),
            comentarios: formData.get('comentarios') || '',
            acompanantes: acompañantes,
            total_personas: acompañantes.length + 1,
            user_agent: navigator.userAgent,
            fecha_registro: new Date().toISOString()
        };

        const { error } = await _supabase.from('invitados_familia_cortez').insert([dataToSend]);

        if (error) throw error;

        // Modal de éxito
        const modal = document.getElementById('confirmation-modal');
        modal.classList.add('active');
        modal.querySelector('.confirmation-content').innerHTML = `
            <h2>¡Confirmado!</h2>
            <p>Gracias por registrarte, ${dataToSend.nombre_completo}.</p>
            <button onclick="location.reload()">Cerrar</button>
        `;

    } catch (err) {
        console.error('Fallo crítico:', err);
        alert('Error al guardar: ' + err.message);
        showWhatsApp();
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function showWhatsApp() {
    document.getElementById('whatsapp-alternative-container').innerHTML = `
        <a href="https://wa.me/56938654827" style="color: green;">Confirmar por WhatsApp aquí</a>
    `;
}
