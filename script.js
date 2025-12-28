// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE (CORREGIDA)
// ==========================================
const SUPABASE_URL = 'https://hzmhobnwqqwamdtzspbv.supabase.co';
// Tu clave anon public corregida:
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bWhvYm53cXF3YW1kdHpzcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzQwMzEsImV4cCI6MjA4MjQ1MDAzMX0.JGb8TpU6tbFfSBi2Gs34YzciYGgQu5gUvWtdnHm6F2I'; 

// Inicializamos con un nombre de variable único para evitar el error de "ya declarado"
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales originales
let lastFormData = null;
let connectionTested = false;

// ==========================================
// 2. INICIALIZACIÓN DE LA PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    debugLog('info', 'Página cargada correctamente');
    
    // Proceso original: Mostrar banner de debug en desarrollo
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        showDebugBanner();
    }
    
    // Proceso original: Configurar el envío del formulario
    const form = document.getElementById('confirmation-form');
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(e);
        });
    }
    
    // Proceso original: Configurar el indicador de scroll
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if(scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            document.querySelector('#formulario').scrollIntoView({ 
                behavior: 'smooth' 
            });
        });
    }
    
    // Proceso original: Prevenir Enter en campos que no son submit
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
            e.preventDefault();
        }
    });

    // Probar conexión inicial
    testConnection();
});

// ==========================================
// 3. MANEJO DEL FORMULARIO (PROCESO COMPLETO)
// ==========================================
async function handleFormSubmit(e) {
    const submitBtn = document.getElementById('submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    
    // Estado de carga original
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    try {
        const formData = new FormData(e.target);
        
        // Lógica original de captura de acompañantes
        const acompañantes = [];
        const nombresAcompañantes = document.querySelectorAll('.acompanante-input');
        nombresAcompañantes.forEach(input => {
            if (input.value.trim() !== '') {
                acompañantes.push({ nombre: input.value.trim() });
            }
        });

        // Tu estructura de datos original para la tabla
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

        debugLog('info', 'Intentando guardar en base de datos:', dbData);

        // INSERCIÓN EN SUPABASE (Usando el cliente corregido)
        const { data, error } = await supabaseClient
            .from('invitados_familia_cortez')
            .insert([dbData]);

        if (error) throw error;

        // Proceso original de éxito
        showSuccessModal(dbData.nombre_completo, dbData.total_personas);
        e.target.reset();

    } catch (error) {
        debugLog('error', 'Error en el proceso de envío:', error);
        // Si falla, se activa tu alternativa de WhatsApp
        showWhatsAppAlternative();
        alert('Hubo un problema al registrar tu asistencia. Por favor, intenta de nuevo o usa el botón de WhatsApp que aparecerá abajo.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// ==========================================
// 4. FUNCIONES DE APOYO Y DEBUG (ORIGINALES)
// ==========================================
async function testConnection() {
    try {
        const { data, error } = await supabaseClient
            .from('invitados_familia_cortez')
            .select('id')
            .limit(1);
        
        if (error) throw error;
        
        console.log('%c✅ [SUCCESS] Conexión con Supabase establecida correctamente', 'color: #10b981; font-weight: bold;');
        connectionTested = true;
    } catch (err) {
        console.error('%c❌ [ERROR] Falló la conexión inicial:', 'color: #ef4444; font-weight: bold;', err.message);
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
        <p>Tu asistencia ha sido registrada exitosamente para ${total} ${total > 1 ? 'personas' : 'persona'}.</p>
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
    banner.innerHTML = "🐛 MODO DESARROLLO - REVISA LA CONSOLA (F12) PARA VER LOS LOGS DE SUPABASE";
    document.body.appendChild(banner);
}

function showWhatsAppAlternative() {
    const container = document.getElementById('whatsapp-alternative-container');
    if(container) {
        container.innerHTML = `
            <div style="margin-top:20px; padding:20px; background:#f0fdf4; border-radius:12px; border:1px solid #bbf7d0; text-align:center;">
                <p style="color:#166534; font-weight:500; margin-bottom:15px;">¿Tuviste problemas con el formulario?</p>
                <a href="https://wa.me/56938654827" class="btn-share" style="background:#25D366; color:white; text-decoration:none; padding:10px 20px; border-radius:8px; display:inline-block;">
                    <i class="fab fa-whatsapp"></i> Confirmar vía WhatsApp
                </a>
            </div>
        `;
    }
}
