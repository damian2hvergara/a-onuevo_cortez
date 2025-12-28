// ==========================================
// 1. CONFIGURACIÓN Y CLIENTE (CORREGIDO)
// ==========================================
const SUPABASE_URL = 'https://hzmhobnwqqwamdtzspbv.supabase.co';
// USA LA CLAVE QUE EMPIEZA CON eyJ...
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bWhvYm53cXF3YW1kdHpzcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzQwMzEsImV4cCI6MjA4MjQ1MDAzMX0.JGb8TpU6tbFfSBi2Gs34YzciYGgQu5gUvWtdnHm6F2I'; 

// Cambiamos el nombre de la variable a 'supabaseClient' para evitar el error "Identifier already declared"
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mantener todas tus variables globales originales
let lastFormData = null;
let connectionTested = false;

// ==========================================
// 2. INICIALIZACIÓN (TODOS TUS PROCESOS)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    debugLog('info', 'Página cargada correctamente');
    
    // Modo Debug original
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        showDebugBanner();
    }
    
    // Configurar el envío del formulario
    const form = document.getElementById('confirmation-form');
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(e);
        });
    }
    
    // Scroll original
    const scrollInd = document.querySelector('.scroll-indicator');
    if(scrollInd) {
        scrollInd.addEventListener('click', function() {
            document.querySelector('#formulario').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Bloqueo de tecla Enter original
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
            e.preventDefault();
        }
    });

    // Probar conexión inicial
    testConnection();
});

// ==========================================
// 3. MANEJO DE FORMULARIO (PROCESO ORIGINAL)
// ==========================================
async function handleFormSubmit(e) {
    const submitBtn = document.getElementById('submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    try {
        const formData = new FormData(e.target);
        
        // Recoger acompañantes (Tu lógica original)
        const acompañantes = [];
        const nombresAcompañantes = document.querySelectorAll('.acompanante-input');
        nombresAcompañantes.forEach(input => {
            if (input.value.trim() !== '') {
                acompañantes.push({ nombre: input.value.trim() });
            }
        });

        // Tu estructura de base de datos completa
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

        debugLog('info', 'Enviando datos:', dbData);

        // INSERCIÓN (Usando el cliente corregido)
        const { data, error } = await supabaseClient
            .from('invitados_familia_cortez')
            .insert([dbData]);

        if (error) throw error;

        showSuccessModal(dbData.nombre_completo, dbData.total_personas);
        e.target.reset();

    } catch (error) {
        debugLog('error', 'Error en el proceso:', error);
        alert('Error al guardar. Si el problema persiste, usa la opción de WhatsApp.');
        showWhatsAppAlternative(); // Tu función de respaldo
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// ==========================================
// 4. FUNCIONES DE APOYO (TUS LOGS Y MODALES)
// ==========================================
async function testConnection() {
    try {
        const { data, error } = await supabaseClient.from('invitados_familia_cortez').select('id').limit(1);
        if (error) throw error;
        console.log('%c✅ [SUCCESS] Conexión con Supabase establecida', 'color: #10b981; font-weight: bold;');
        connectionTested = true;
    } catch (err) {
        debugLog('error', 'Error de conexión inicial', err);
    }
}

function debugLog(type, message, data = null) {
    const colors = { info: '#3b82f6', error: '#ef4444', success: '#10b981' };
    console.log(`%c[${type.toUpperCase()}] %c${message}`, `color: ${colors[type]}; font-weight: bold;`, 'color: inherit;', data || '');
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
    banner.innerHTML = "🐛 MODO DEBUG: LAS CLAVES DEBEN SER 'anon public' PARA FUNCIONAR";
    document.body.appendChild(banner);
}

function showWhatsAppAlternative() {
    const container = document.getElementById('whatsapp-alternative-container');
    if(container) {
        container.innerHTML = `
            <div style="margin-top:20px; padding:15px; background:#f0fdf4; border-radius:8px; border:1px solid #bbf7d0;">
                <p style="font-size:14px; color:#166534; margin-bottom:10px;">¿Problemas con el formulario? Envía tu confirmación por WhatsApp:</p>
                <a href="https://wa.me/56938654827" class="btn-share" style="background:#25D366; text-decoration:none; display:inline-block; padding:10px 20px; border-radius:5px; color:white;">
                    <i class="fab fa-whatsapp"></i> Enviar por WhatsApp
                </a>
            </div>
        `;
    }
}
