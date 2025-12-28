// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE (CORREGIDA)
// ==========================================
const SUPABASE_URL = 'https://hzmhobnwqqwamdtzspbv.supabase.co';
// Usamos tu clave ANON PUBLIC (la segura para el navegador)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bWhvYm53cXF3YW1kdHpzcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzQwMzEsImV4cCI6MjA4MjQ1MDAzMX0.JGb8TpU6tbFfSBi2Gs34YzciYGgQu5gUvWtdnHm6F2I'; 

// Inicialización con nombre único para evitar error de "already declared"
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales originales
let lastFormData = null;
let connectionTested = false;

// ==========================================
// 2. INICIALIZACIÓN DE LA PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema de Invitación Familia Cortez Iniciado');
    
    // Modo Debug original
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        showDebugBanner();
    }
    
    // Configurar envío de formulario
    const form = document.getElementById('confirmation-form');
    if(form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Configurar scroll suave
    const scrollInd = document.querySelector('.scroll-indicator');
    if(scrollInd) {
        scrollInd.addEventListener('click', () => {
            document.querySelector('#formulario').scrollIntoView({ behavior: 'smooth' });
        });
    }

    testConnection();
});

// ==========================================
// 3. MANEJO DE ENVÍO (MANTENIENDO TODOS TUS PROCESOS)
// ==========================================
async function handleFormSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const formData = new FormData(e.target);
        
        // Captura de acompañantes original
        const acompañantes = [];
        document.querySelectorAll('.acompanante-input').forEach(input => {
            if (input.value.trim() !== '') {
                acompañantes.push({ nombre: input.value.trim() });
            }
        });

        // Tu objeto de datos completo
        const dbData = {
            nombre_completo: formData.get('nombre'),
            relacion_familia: formData.get('relacion'),
            plan_participacion: formData.get('plan'),
            hora_llegada: formData.get('hora'),
            comentarios: formData.get('comentarios'),
            acompanantes: acompañantes,
            total_personas: acompañantes.length + 1,
            user_agent: navigator.userAgent,
            pagina_origen: 'formulario-web-v2',
            fecha_registro: new Date().toISOString(),
            fecha_confirmacion: new Date().toISOString(),
            estado: 'confirmado'
        };

        // Inserción en Supabase
        const { error } = await supabaseClient
            .from('invitados_familia_cortez')
            .insert([dbData]);

        if (error) throw error;

        showSuccessModal(dbData.nombre_completo, dbData.total_personas);
        e.target.reset();

    } catch (error) {
        console.error('Error en el envío:', error);
        alert('Hubo un error al guardar. Se activará la opción de WhatsApp.');
        showWhatsAppAlternative();
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// ==========================================
// 4. FUNCIONES DE APOYO (TUS MODALES Y LOGS)
// ==========================================
async function testConnection() {
    try {
        const { data, error } = await supabaseClient.from('invitados_familia_cortez').select('id').limit(1);
        if (error) throw error;
        console.log('%c✅ CONEXIÓN EXITOSA', 'color: #10b981; font-weight: bold;');
    } catch (err) {
        console.error('❌ Error de conexión:', err.message);
    }
}

function showSuccessModal(nombre, total) {
    const modal = document.getElementById('confirmation-modal');
    const content = modal.querySelector('.confirmation-content');
    content.innerHTML = `
        <div class="success-icon"><i class="fas fa-check-circle"></i></div>
        <h2 class="confirmation-title">¡Confirmado, ${nombre}!</h2>
        <p>Tu asistencia ha sido registrada para ${total} ${total > 1 ? 'personas' : 'persona'}.</p>
        <button onclick="closeModal()" class="btn-submit" style="margin-top:20px">Cerrar</button>
    `;
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('confirmation-modal').classList.remove('active');
}

function showDebugBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = "position:fixed; top:0; left:0; width:100%; background:#ef4444; color:white; text-align:center; z-index:9999; font-size:11px; padding:4px; font-weight:bold;";
    banner.innerHTML = "🐛 MODO DESARROLLO - REVISA LA CONSOLA (F12)";
    document.body.appendChild(banner);
}

function showWhatsAppAlternative() {
    const container = document.getElementById('whatsapp-alternative-container');
    if(container) {
        container.innerHTML = `
            <div style="margin-top:20px; padding:15px; background:#f0fdf4; border-radius:8px; border:1px solid #bbf7d0; text-align:center;">
                <p style="font-size:14px; color:#166534; margin-bottom:10px;">¿Problemas con el formulario? Confirma aquí:</p>
                <a href="https://wa.me/56938654827" class="btn-share" style="background:#25D366; text-decoration:none; display:inline-block; padding:10px 20px; border-radius:5px; color:white;">
                    <i class="fab fa-whatsapp"></i> Enviar WhatsApp
                </a>
            </div>
        `;
    }
}

function debugLog(type, message, data = null) {
    const colors = { info: '#3b82f6', error: '#ef4444', success: '#10b981' };
    console.log(`%c[${type.toUpperCase()}] %c${message}`, `color: ${colors[type]}; font-weight: bold;`, 'color: inherit;', data || '');
}
