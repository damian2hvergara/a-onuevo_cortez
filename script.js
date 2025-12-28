// CONFIGURACIÓN
const SUPABASE_URL = 'https://hzmhobnwqqwamdtzspbv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bWhvYm53cXF3YW1kdHpzcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzQwMzEsImV4cCI6MjA4MjQ1MDAzMX0.JGb8TpU6tbFfSBi2Gs34YzciYGgQu5gUvWtdnHm6F2I';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema listo');
    const form = document.getElementById('confirmation-form');
    if(form) form.addEventListener('submit', handleFormSubmit);
    
    // Probar conexión
    testConnection();
});

async function testConnection() {
    const { error } = await supabaseClient.from('invitados_familia_cortez').select('id').limit(1);
    if (error) console.error('❌ Error de conexión (Probablemente falta ejecutar el SQL):', error.message);
    else console.log('✅ CONEXIÓN EXITOSA: La tabla está lista.');
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const formData = new FormData(e.target);
        
        // Lógica de acompañantes
        const acompañantes = [];
        document.querySelectorAll('.acompanante-input').forEach(input => {
            if (input.value.trim()) acompañantes.push({ nombre: input.value.trim() });
        });

        // OBJETO DE DATOS (Exactamente como la tabla SQL)
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

        // ÉXITO: Mostrar modal
        document.getElementById('confirmation-modal').classList.add('active');
        document.querySelector('.confirmation-content').innerHTML = `
            <i class="fas fa-check-circle" style="font-size:4rem; color:#10b981; margin-bottom:1rem;"></i>
            <h2>¡Todo listo!</h2>
            <p>Tu asistencia ha sido confirmada correctamente.</p>
            <button onclick="location.reload()" class="btn-submit" style="margin-top:1.5rem;">Cerrar</button>
        `;
        e.target.reset();

    } catch (err) {
        console.error('Error detallado:', err);
        alert('Error: ' + err.message + '. Asegúrate de haber ejecutado el SQL en el panel de Supabase.');
        showWhatsAppAlternative();
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function showWhatsAppAlternative() {
    const container = document.getElementById('whatsapp-alternative-container');
    if(container) {
        container.innerHTML = `
            <div style="margin-top:20px; padding:15px; background:#f0fdf4; border-radius:8px; border:1px solid #bbf7d0; text-align:center;">
                <p style="color:#166534; margin-bottom:10px;">¿Falló el sistema? Confirma aquí:</p>
                <a href="https://wa.me/56938654827" style="background:#25D366; color:white; padding:10px 20px; border-radius:5px; text-decoration:none; display:inline-block;">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
            </div>`;
    }
}
