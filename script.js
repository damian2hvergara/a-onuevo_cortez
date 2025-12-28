const SUPABASE_URL = 'https://hzmhobnwqqwamdtzspbv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bWhvYm53cXF3YW1kdHpzcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzQwMzEsImV4cCI6MjA4MjQ1MDAzMX0.JGb8TpU6tbFfSBi2Gs34YzciYGgQu5gUvWtdnHm6F2I';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema iniciado');
    const form = document.getElementById('confirmation-form');
    if (form) form.addEventListener('submit', handleFormSubmit);
    
    // Tu lógica de scroll original
    const scrollInd = document.querySelector('.scroll-indicator');
    if(scrollInd) {
        scrollInd.addEventListener('click', () => {
            document.querySelector('#formulario').scrollIntoView({ behavior: 'smooth' });
        });
    }
});

async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
        const formData = new FormData(e.target);
        const acompañantes = [];
        
        // Captura de acompañantes original
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

        // Modal de éxito original
        const modal = document.getElementById('confirmation-modal');
        modal.classList.add('active');
        modal.querySelector('.confirmation-content').innerHTML = `
            <i class="fas fa-check-circle" style="font-size:3rem; color:#d4b483; margin-bottom:1rem;"></i>
            <h2>¡Asistencia Confirmada!</h2>
            <p>Gracias por ser parte de esta noche, ${dataToSend.nombre_completo}.</p>
            <button onclick="location.reload()" class="btn-submit" style="margin-top:20px">Cerrar</button>
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
    const container = document.getElementById('whatsapp-alternative-container');
    if (container) {
        container.innerHTML = `
            <div style="margin-top:20px; padding:15px; background:rgba(212,180,131,0.1); border-radius:8px; border:1px solid var(--oro-metalico); text-align:center;">
                <p style="margin-bottom:10px;">¿Hubo un error? Confirma por aquí:</p>
                <a href="https://wa.me/56938654827" style="color:var(--oro-metalico); text-decoration:none; font-weight:bold;">
                    <i class="fab fa-whatsapp"></i> Enviar WhatsApp
                </a>
            </div>`;
    }
}
