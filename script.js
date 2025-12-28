const SUPABASE_URL = 'https://hzmhobnwqqwamdtzspbv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bWhvYm53cXF3YW1kdHpzcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzQwMzEsImV4cCI6MjA4MjQ1MDAzMX0.JGb8TpU6tbFfSBi2Gs34YzciYGgQu5gUvWtdnHm6F2I';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('confirmation-form');
    if(form) form.addEventListener('submit', handleFormSubmit);
    testConnection();
});

async function testConnection() {
    const { error } = await supabaseClient.from('invitados_familia_cortez').select('id').limit(1);
    if (error) console.error('❌ Error de conexión:', error.message);
    else console.log('✅ Conexión establecida correctamente');
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerHTML = 'Guardando...';

    try {
        const formData = new FormData(e.target);
        const acompañantes = [];
        document.querySelectorAll('.acompanante-input').forEach(input => {
            if (input.value.trim()) acompañantes.push({ nombre: input.value.trim() });
        });

        const { error } = await supabaseClient.from('invitados_familia_cortez').insert([{
            nombre_completo: formData.get('nombre'),
            relacion_familia: formData.get('relacion'),
            plan_participacion: formData.get('plan'),
            hora_llegada: formData.get('hora'),
            comentarios: formData.get('comentarios'),
            acompanantes: acompañantes,
            total_personas: acompañantes.length + 1,
            user_agent: navigator.userAgent,
            fecha_registro: new Date().toISOString()
        }]);

        if (error) throw error;
        
        alert('¡Confirmación enviada con éxito!');
        e.target.reset();
        location.reload(); 
    } catch (err) {
        console.error('Error detallado:', err);
        alert('Error al guardar. Asegúrate de ejecutar el código SQL en Supabase.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Confirmar Asistencia';
    }
}
