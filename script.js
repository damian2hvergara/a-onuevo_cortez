// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://hzmhobnwqqwamdtzspbv.supabase.co';
// CLAVE ANON PUBLIC (ESTA ES LA QUE FUNCIONA)
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bWhvYm53cXF3YW1kdHpzcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzQwMzEsImV4cCI6MjA4MjQ1MDAzMX0.JGb8TpU6tbFfSBi2Gs34YzciYGgQu5gUvWtdnHm6F2I';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando conexión...');
    
    const form = document.getElementById('confirmation-form');
    if(form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    testConnection();
});

// PRUEBA DE CONEXIÓN REAL
async function testConnection() {
    const { data, error } = await supabaseClient.from('invitados_familia_cortez').select('id').limit(1);
    if (error) {
        console.error('❌ Error de conexión:', error.message);
    } else {
        console.log('✅ CONEXIÓN EXITOSA. Ya puedes recibir invitados.');
    }
}

// ENVÍO DEL FORMULARIO
async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const formData = new FormData(e.target);
        const acompañantes = [];
        document.querySelectorAll('.acompanante-input').forEach(input => {
            if (input.value.trim() !== '') acompañantes.push({ nombre: input.value.trim() });
        });

        const dbData = {
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

        const { error } = await supabaseClient.from('invitados_familia_cortez').insert([dbData]);

        if (error) throw error;

        showSuccessModal(dbData.nombre_completo);
        e.target.reset();

    } catch (err) {
        console.error('Error:', err);
        alert('Error al guardar. Verifica que ejecutaste el código SQL en Supabase.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function showSuccessModal(nombre) {
    const modal = document.getElementById('confirmation-modal');
    modal.querySelector('.confirmation-content').innerHTML = `
        <i class="fas fa-check-circle" style="font-size:3rem; color:green"></i>
        <h2>¡Listo, ${nombre}!</h2>
        <p>Tu asistencia ha sido registrada.</p>
        <button onclick="location.reload()" class="btn-submit">Cerrar</button>
    `;
    modal.classList.add('active');
}
