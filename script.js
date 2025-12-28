// Configuración de Supabase
// CORRECCIÓN EN script.js
const SUPABASE_URL = 'https://hzmhobnwqqwamdtzspbv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bWhvYm53cXF3YW1kdHpzcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzQwMzEsImV4cCI6MjA4MjQ1MDAzMX0.JGb8TpU6tbFfSBi2Gs34YzciYGgQu5gUvWtdnHm6F2I';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Variables globales
let lastFormData = null;
let connectionTested = false;

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    debugLog('info', 'Página cargada correctamente');
    
    // Mostrar banner de debug en desarrollo
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        showDebugBanner();
    }
    
    // Configurar el envío del formulario
    document.getElementById('confirmation-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit(e);
    });
    
    // Configurar el indicador de scroll
    document.querySelector('.scroll-indicator').addEventListener('click', function() {
        document.querySelector('#formulario').scrollIntoView({ 
            behavior: 'smooth' 
        });
    });
    
    // Prevenir envío del formulario al presionar Enter en campos no submit
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
            e.preventDefault();
        }
    });
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeConfirmationModal();
        }
    });
    
    // Cerrar modal al hacer clic fuera
    document.getElementById('confirmation-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeConfirmationModal();
        }
    });
    
    // Suavizar desplazamiento para los enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    const offset = 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Inicializar efectos metálicos
    setTimeout(addMetalEffects, 1000);
    
    // Probar conexión con Supabase (silenciosamente)
    setTimeout(testSupabaseConnection, 1000);
});

// ==================== FUNCIONES UTILITARIAS ====================

// Sistema de logging mejorado
function debugLog(type, message, data = null) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const colors = {
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        supabase: '#8b5cf6'
    };
    
    console.log(
        `%c[${timestamp}] ${type.toUpperCase()}:`,
        `color: ${colors[type] || '#6b7280'}; font-weight: bold;`,
        message
    );
    
    if (data) {
        console.log('📦 Data:', data);
    }
    
    // También guardar en localStorage para depuración
    try {
        const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
        logs.push({
            timestamp: new Date().toISOString(),
            type,
            message,
            data: data ? JSON.stringify(data).substring(0, 200) : null
        });
        // Mantener solo los últimos 50 logs
        if (logs.length > 50) logs.shift();
        localStorage.setItem('debug_logs', JSON.stringify(logs));
    } catch (e) {}
}

// Mostrar banner de debug
function showDebugBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #0a1a3a;
        color: white;
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 12px;
        font-family: monospace;
        z-index: 9999;
        opacity: 0.9;
        border: 2px solid #d4b483;
        cursor: pointer;
    `;
    banner.innerHTML = '🐛 DEBUG MODE';
    banner.title = 'Click para ver logs';
    banner.onclick = function() {
        const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
        console.table(logs);
        alert('Logs mostrados en consola');
    };
    document.body.appendChild(banner);
}

// Obtener la IP del usuario
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        debugLog('warning', 'Error al obtener IP:', error);
        return 'desconocida';
    }
}

// Agregar efecto de brillo metálico a elementos
function addMetalEffects() {
    const metalElements = document.querySelectorAll('.metal-badge, .btn-hero, .confirmation-icon');
    metalElements.forEach(el => {
        el.classList.add('metal-effect');
    });
}

// ==================== MANEJO DE FORMULARIO ====================

// Actualizar estado del botón de envío
function updateSubmitButton(state, message = '') {
    const btn = document.getElementById('submit-btn');
    const icon = btn.querySelector('i');
    
    btn.classList.remove('success', 'error', 'loading');
    btn.disabled = false;
    
    switch(state) {
        case 'loading':
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            btn.classList.add('loading');
            break;
            
        case 'success':
            icon.className = 'fas fa-check-circle';
            btn.innerHTML = `<i class="fas fa-check-circle"></i> ${message || '¡Enviado!'}`;
            btn.classList.add('success');
            
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Confirmar Asistencia';
                btn.classList.remove('success');
            }, 3000);
            break;
            
        case 'error':
            icon.className = 'fas fa-exclamation-circle';
            btn.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message || 'Error - Reintentar'}`;
            btn.classList.add('error');
            
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Confirmar Asistencia';
                btn.classList.remove('error');
            }, 3000);
            break;
            
        default:
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Confirmar Asistencia';
    }
}

// Validar formulario
function validateForm() {
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const relacion = document.getElementById('relacion').value;
    const planSeleccionado = document.querySelector('input[name="plan"]:checked');
    const horaSeleccionada = document.querySelector('input[name="hora"]:checked');
    const totalPersonas = parseInt(document.getElementById('total_personas').value);
    
    // Validaciones básicas
    if (!nombre) {
        throw new Error('El nombre es obligatorio');
    }
    
    if (!relacion) {
        throw new Error('Por favor, selecciona tu relación con la familia');
    }
    
    if (!planSeleccionado) {
        throw new Error('Por favor, selecciona tu plan para la noche');
    }
    
    if (!horaSeleccionada) {
        throw new Error('Por favor, selecciona tu hora de llegada');
    }
    
    if (isNaN(totalPersonas) || totalPersonas < 1 || totalPersonas > 20) {
        throw new Error('Por favor, ingresa un número válido de personas (1-20)');
    }
    
    if (email && !validateEmail(email)) {
        throw new Error('Por favor, ingresa un email válido');
    }
    
    if (telefono && !validateChileanPhone(telefono)) {
        throw new Error('Por favor, ingresa un teléfono chileno válido (ej: +569 1234 5678)');
    }
    
    return true;
}

// Validar email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validar teléfono chileno
function validateChileanPhone(phone) {
    const re = /^(\+?56)?(\s?)(0?9)(\s?)[98765432]\d{7}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// Recolectar datos del formulario
function collectFormData() {
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const relacion = document.getElementById('relacion').value;
    const planSeleccionado = document.querySelector('input[name="plan"]:checked');
    const horaSeleccionada = document.querySelector('input[name="hora"]:checked');
    const comentarios = document.getElementById('comentarios').value.trim();
    const totalPersonas = parseInt(document.getElementById('total_personas').value);
    
    // Crear array de acompañantes
    const acompanantes = [];
    for (let i = 1; i < totalPersonas; i++) {
        acompanantes.push({
            nombre: `Acompañante ${i}`,
            edad: 18
        });
    }
    
    return {
        nombre_completo: nombre,
        relacion_familia: relacion,
        plan_participacion: planSeleccionado ? planSeleccionado.value : null,
        hora_llegada: horaSeleccionada ? horaSeleccionada.value : null,
        comentarios: comentarios || null,
        acompanantes: acompanantes,
        total_personas: totalPersonas,
        email: email || null,
        telefono: telefono || null,
        fecha_registro: new Date().toISOString()
    };
}

// ==================== MANEJO DE ERRORES MEJORADO ====================

// Mostrar mensaje de error mejorado
function showEnhancedErrorMessage(message, hint = '', showRetry = false) {
    const statusElement = document.getElementById('status-message');
    
    statusElement.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="color: #ef4444; font-size: 1.2rem;"></i>
        <div style="flex: 1;">
            <strong style="display: block; margin-bottom: 5px;">${message}</strong>
            ${hint ? `<div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 10px;">${hint}</div>` : ''}
            ${showRetry ? `
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button onclick="retryLastSubmission()" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 8px; font-size: 0.9rem; cursor: pointer;">
                        <i class="fas fa-redo"></i> Reintentar envío
                    </button>
                    <button onclick="showWhatsAppAlternative()" style="padding: 8px 16px; background: #25D366; color: white; border: none; border-radius: 8px; font-size: 0.9rem; cursor: pointer;">
                        <i class="fab fa-whatsapp"></i> Confirmar por WhatsApp
                    </button>
                </div>
            ` : ''}
        </div>
        <button onclick="this.parentElement.style.display='none'" style="background: none; border: none; color: #6b7280; cursor: pointer; padding: 5px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    statusElement.className = 'status-message error';
    statusElement.style.display = 'flex';
    
    // Scroll al error
    setTimeout(() => {
        statusElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }, 100);
    
    debugLog('error', 'Error mostrado al usuario:', { message, hint });
}

// Mostrar mensaje de éxito
function showSuccessMessage(message, details = '') {
    const statusElement = document.getElementById('status-message');
    
    statusElement.innerHTML = `
        <i class="fas fa-check-circle" style="color: #10b981; font-size: 1.2rem;"></i>
        <div style="flex: 1;">
            <strong style="display: block; margin-bottom: 5px;">${message}</strong>
            ${details ? `<div style="font-size: 0.85rem; color: #6b7280;">${details}</div>` : ''}
        </div>
        <button onclick="this.parentElement.style.display='none'" style="background: none; border: none; color: #6b7280; cursor: pointer; padding: 5px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    statusElement.className = 'status-message success';
    statusElement.style.display = 'flex';
    
    debugLog('success', 'Éxito mostrado al usuario:', { message, details });
}

// Manejar errores de Supabase
function handleSupabaseError(error) {
    debugLog('error', 'Error de Supabase:', error);
    
    let userMessage = 'Error al guardar los datos';
    let developerHint = '';
    let showRetry = false;
    
    // Mensajes específicos por tipo de error
    if (error.code === '42501') {
        userMessage = 'Error de permisos: No se pudo guardar la confirmación';
        developerHint = 'Revisa RLS (Row Level Security) en Supabase Dashboard';
        showRetry = true;
    } else if (error.code === '42P01') {
        userMessage = 'Error del sistema: La tabla no existe';
        developerHint = 'Necesitas crear la tabla "invitados_familia_cortez" en Supabase';
        showRetry = true;
    } else if (error.message.includes('timeout')) {
        userMessage = 'Conexión lenta. ¿Intentar de nuevo?';
        developerHint = 'Problema de red o Supabase sobrecargado';
        showRetry = true;
    } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
        userMessage = 'Sin conexión a internet';
        developerHint = 'Verifica tu conexión a internet y reintenta';
        showRetry = true;
    } else if (error.message.includes('JWT')) {
        userMessage = 'Error de autenticación';
        developerHint = 'Verifica tu clave de Supabase en el código';
        showRetry = false;
    } else {
        userMessage = `Error técnico: ${error.message.substring(0, 100)}`;
        developerHint = 'Por favor, intenta más tarde o usa WhatsApp';
        showRetry = true;
    }
    
    showEnhancedErrorMessage(userMessage, developerHint, showRetry);
}

// ==================== SUPABASE Y ENVÍO DE DATOS ====================

// Probar conexión con Supabase
async function testSupabaseConnection() {
    if (connectionTested) return;
    
    try {
        debugLog('supabase', 'Probando conexión a Supabase...');
        
        // Intentar con diferentes nombres de tabla
        const tableNames = [
            'invitados_familia_cortez',
            'confirmaciones',
            'invitados',
            'asistentes',
            'confirmaciones_2026',
            'familia_cortez_invitados'
        ];
        
        let connected = false;
        let foundTable = null;
        
        for (const tableName of tableNames) {
            const { data, error } = await supabase
                .from(tableName)
                .select('count', { count: 'exact', head: true })
                .limit(1);
            
            if (!error) {
                connected = true;
                foundTable = tableName;
                debugLog('success', `✅ Conexión exitosa a Supabase - Tabla: ${tableName}`);
                showSuccessMessage(`Conectado a la base de datos`, `Tabla: ${tableName}`);
                break;
            }
        }
        
        if (!connected) {
            debugLog('error', '❌ No se pudo conectar a ninguna tabla en Supabase');
            showEnhancedErrorMessage(
                'Base de datos no disponible', 
                'Puedes confirmar por WhatsApp como alternativa',
                false
            );
        }
        
        connectionTested = true;
        return { connected, table: foundTable };
        
    } catch (error) {
        debugLog('error', 'Error inesperado en test de conexión:', error);
        return { connected: false, table: null };
    }
}

// Guardar datos en Supabase
async function saveToSupabase(formData) {
    debugLog('supabase', 'Intentando guardar en Supabase...');
    
    const userIP = await getUserIP();
    const enhancedData = {
        ...formData,
        estado: 'confirmado',
        ip_address: userIP,
        user_agent: navigator.userAgent,
        pagina_origen: 'formulario-web-v2',
        fecha_confirmacion: new Date().toISOString()
    };
    
    // Intentar con diferentes nombres de tabla
    const tableNames = [
        'invitados_familia_cortez',
        'confirmaciones',
        'invitados',
        'asistentes',
        'confirmaciones_2026'
    ];
    
    let lastError = null;
    
    for (const tableName of tableNames) {
        debugLog('supabase', `Intentando tabla: ${tableName}`);
        
        const { data, error } = await supabase
            .from(tableName)
            .insert([enhancedData])
            .select();
        
        if (!error) {
            debugLog('success', `✅ Datos guardados en tabla: ${tableName}`, data);
            return { success: true, data: data[0], table: tableName };
        }
        
        lastError = error;
        debugLog('warning', `Tabla ${tableName} falló:`, error.message);
    }
    
    // Si todas fallan
    throw lastError;
}

// ==================== MANEJO PRINCIPAL DEL FORMULARIO ====================

// Manejar el envío del formulario
async function handleFormSubmit(event) {
    event.preventDefault();
    
    debugLog('info', 'Iniciando envío del formulario');
    updateSubmitButton('loading');
    
    try {
        // Guardar datos para posible reintento
        lastFormData = collectFormData();
        
        // Validar
        validateForm();
        debugLog('success', 'Validación exitosa');
        
        // Confirmación del usuario
        if (!confirm('¿Confirmar asistencia al Año Nuevo 2026 con la Familia Cortez?')) {
            updateSubmitButton('default');
            debugLog('info', 'Usuario canceló la confirmación');
            return;
        }
        
        // Intentar guardar en Supabase
        const result = await saveToSupabase(lastFormData);
        
        // ÉXITO - Mostrar modal mejorado
        updateSubmitButton('success', '¡Confirmado!');
        showEnhancedConfirmationModal(lastFormData, result.data);
        
        // Limpiar formulario
        document.getElementById('confirmation-form').reset();
        document.getElementById('total_personas').value = 1;
        
        // Limpiar alternativa WhatsApp si existe
        const whatsappContainer = document.getElementById('whatsapp-alternative-container');
        whatsappContainer.innerHTML = '';
        
        debugLog('success', 'Proceso completo exitoso');
        
    } catch (error) {
        debugLog('error', 'Error en el proceso:', error);
        
        if (error.message && error.message.includes('Error al guardar')) {
            // Error de validación del formulario
            showEnhancedErrorMessage(error.message, '', true);
        } else {
            // Error de Supabase
            handleSupabaseError(error);
        }
        
        updateSubmitButton('error', 'Error');
        
        // Mostrar alternativa WhatsApp después de 2 segundos
        setTimeout(showWhatsAppAlternative, 2000);
    }
}

// Reintentar el último envío
async function retryLastSubmission() {
    if (!lastFormData) {
        showEnhancedErrorMessage('No hay datos para reintentar', 'Por favor, completa el formulario nuevamente');
        return;
    }
    
    debugLog('info', 'Reintentando envío...');
    updateSubmitButton('loading');
    
    try {
        const result = await saveToSupabase(lastFormData);
        updateSubmitButton('success', '¡Reenviado!');
        showEnhancedConfirmationModal(lastFormData, result.data);
        debugLog('success', 'Reintento exitoso');
    } catch (error) {
        debugLog('error', 'Error en reintento:', error);
        handleSupabaseError(error);
        updateSubmitButton('error');
    }
}

// ==================== MODAL DE CONFIRMACIÓN MEJORADO ====================

// Mostrar modal de confirmación mejorado
function showEnhancedConfirmationModal(formData, supabaseData = null) {
    const modal = document.getElementById('confirmation-modal');
    const content = modal.querySelector('.confirmation-content');
    
    // Generar ID único
    const confirmationId = supabaseData?.id 
        ? `CORTEZ-${supabaseData.id}` 
        : `CORTEZ-TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Formatear hora de llegada
    const horaDisplay = formData.hora_llegada || 'No especificada';
    
    // Determinar icono según plan
    let planIcon = 'fas fa-calendar-check';
    if (formData.plan_participacion === 'cena-fiesta') planIcon = 'fas fa-utensils';
    if (formData.plan_participacion === 'solo-fiesta') planIcon = 'fas fa-glass-cheers';
    if (formData.plan_participacion === 'no-asistir') planIcon = 'fas fa-heart';
    
    content.innerHTML = `
        <div class="confirmation-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <h2 class="confirmation-title">¡Confirmado Exitosamente! 🎉</h2>
        
        <div class="confirmation-details">
            <p style="margin-bottom: 12px; font-weight: 600;">
                <i class="fas fa-database" style="color: var(--exito);"></i>
                Confirmación guardada en nuestra base de datos
            </p>
            
            <p style="margin-bottom: 8px;">
                <strong>ID de Registro:</strong>
                <span class="confirmation-id">${confirmationId}</span>
            </p>
            
            <p style="margin-bottom: 8px;">
                <strong>Nombre:</strong> ${formData.nombre_completo}
            </p>
            
            <p style="margin-bottom: 8px;">
                <strong><i class="${planIcon}"></i> Plan:</strong> 
                ${formData.plan_participacion === 'cena-fiesta' ? 'Cena + Fiesta' : 
                  formData.plan_participacion === 'solo-fiesta' ? 'Solo Fiesta' : 
                  'No asistirá'}
            </p>
            
            <p style="margin-bottom: 8px;">
                <strong><i class="fas fa-users"></i> Total Personas:</strong> ${formData.total_personas}
            </p>
            
            <p style="margin-bottom: 8px;">
                <strong><i class="fas fa-clock"></i> Hora de llegada:</strong> ${horaDisplay}
            </p>
            
            ${formData.comentarios ? `
                <p style="margin-bottom: 8px;">
                    <strong><i class="fas fa-comment"></i> Comentarios:</strong> ${formData.comentarios.substring(0, 100)}${formData.comentarios.length > 100 ? '...' : ''}
                </p>
            ` : ''}
            
            <p style="font-size: 0.85rem; color: #64748b; margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
                <i class="fas fa-info-circle"></i> 
                Guarda este ID para cualquier consulta: <strong>${confirmationId}</strong>
            </p>
        </div>
        
        <p class="confirmation-text">
            <strong>¡Perfecto! Ya tenemos todo listo para recibirte.</strong><br><br>
            Te contactaremos personalmente en los próximos días con todos los detalles finales.<br><br>
            <strong>Nos vemos el 31 de diciembre para recibir el 2026 juntos.</strong>
        </p>
        
        <div class="confirmation-signature">Familia Cortez</div>
        
        <div class="confirmation-actions">
            <a href="https://wa.me/?text=¡Confirmé%20mi%20asistencia%20a%20la%20celebración%20de%20Año%20Nuevo%20de%20la%20Familia%20Cortez!%20🎆%20ID:%20${confirmationId}%20¿Y%20tú?" 
               class="btn-share" target="_blank">
                <i class="fab fa-whatsapp"></i> Compartir invitación
            </a>
            
            <button onclick="closeModalAndReset()" class="btn-close-modal">
                <i class="fas fa-home"></i> Volver al inicio
            </button>
        </div>
    `;
    
    modal.classList.add('active');
    
    // Guardar ID en localStorage para referencia
    try {
        localStorage.setItem('last_confirmation_id', confirmationId);
        localStorage.setItem('last_confirmation_date', new Date().toISOString());
        localStorage.setItem('last_confirmation_name', formData.nombre_completo);
    } catch (e) {
        debugLog('warning', 'No se pudo guardar en localStorage:', e);
    }
    
    // Scroll al modal
    setTimeout(() => {
        modal.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });
    }, 300);
    
    debugLog('success', 'Modal de confirmación mostrado', { confirmationId });
}

// Cerrar modal y resetear
function closeModalAndReset() {
    const modal = document.getElementById('confirmation-modal');
    modal.classList.remove('active');
    
    // Scroll al inicio
    setTimeout(() => {
        document.getElementById('hero').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }, 300);
}

// Cerrar solo el modal
function closeConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.classList.remove('active');
}

// ==================== ALTERNATIVA WHATSAPP ====================

// Mostrar alternativa WhatsApp
function showWhatsAppAlternative() {
    const container = document.getElementById('whatsapp-alternative-container');
    
    // Si ya existe, no mostrar de nuevo
    if (container.innerHTML.trim() !== '') return;
    
    container.innerHTML = `
        <div class="whatsapp-alternative">
            <h4 style="color: var(--whatsapp); margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                <i class="fab fa-whatsapp"></i> ¿Problemas con el formulario?
            </h4>
            <p style="margin-bottom: 15px; color: var(--gris-oscuro);">
                También puedes confirmar por WhatsApp directamente con nuestros anfitriones:
            </p>
            
            <div class="whatsapp-buttons">
                <a href="https://wa.me/56938654827?text=Hola%20Familia%20Cortez,%20quiero%20confirmar%20mi%20asistencia%20al%20Año%20Nuevo%202026.%20Mi%20nombre%20es:%20${encodeURIComponent(lastFormData?.nombre_completo || '')}%20y%20seremos%20${lastFormData?.total_personas || 1}%20personas." 
                   target="_blank" class="whatsapp-btn">
                    <i class="fab fa-whatsapp"></i> Confirmar a Damián
                </a>
                
                <a href="https://wa.me/56930373866?text=Hola%20Familia%20Cortez,%20quiero%20confirmar%20mi%20asistencia%20al%20Año%20Nuevo%202026.%20Mi%20nombre%20es:%20${encodeURIComponent(lastFormData?.nombre_completo || '')}%20y%20seremos%20${lastFormData?.total_personas || 1}%20personas." 
                   target="_blank" class="whatsapp-btn secondary">
                    <i class="fab fa-whatsapp"></i> Confirmar a Fernanda
                </a>
            </div>
            
            <p style="margin-top: 15px; font-size: 0.85rem; color: var(--gris-medio);">
                <i class="fas fa-info-circle"></i> 
                Al hacer clic se abrirá WhatsApp con un mensaje predeterminado que puedes editar.
            </p>
        </div>
    `;
    
    // Scroll a la alternativa
    setTimeout(() => {
        container.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });
    }, 500);
    
    debugLog('info', 'Alternativa WhatsApp mostrada');
}

// ==================== INICIALIZACIÓN FINAL ====================

// Mensaje inicial en consola
console.log('%c🎯 FAMILIA CORTEZ - SISTEMA DE CONFIRMACIÓN 2026', 'color: #0a1a3a; font-size: 18px; font-weight: bold;');
console.log('%c🚀 Versión 2.0 con mejoras implementadas', 'color: #d4b483; font-size: 14px;');
console.log('%c📊 Estado del sistema:', 'color: #3b82f6; font-weight: bold;');
console.log('- Supabase URL:', SUPABASE_URL);
console.log('- Online:', navigator.onLine);
console.log('- User Agent:', navigator.userAgent.substring(0, 80) + '...');
console.log('%c🔧 Para soporte técnico:', 'color: #10b981; font-weight: bold;');
console.log('1. Verifica que la tabla "invitados_familia_cortez" exista en Supabase');
console.log('2. Deshabilita RLS temporalmente para pruebas');
console.log('3. SQL para crear tabla disponible en logs');

// Guardar SQL para crear tabla en localStorage
const createTableSQL = `
    CREATE TABLE invitados_familia_cortez (
        id BIGSERIAL PRIMARY KEY,
        nombre_completo TEXT NOT NULL,
        relacion_familia TEXT NOT NULL,
        plan_participacion TEXT NOT NULL,
        hora_llegada TEXT NOT NULL,
        comentarios TEXT,
        acompanantes JSONB DEFAULT '[]',
        email TEXT,
        telefono TEXT,
        estado TEXT DEFAULT 'confirmado',
        total_personas INTEGER DEFAULT 1,
        ip_address TEXT,
        user_agent TEXT,
        pagina_origen TEXT DEFAULT 'formulario-web-v2',
        fecha_registro TIMESTAMPTZ DEFAULT NOW(),
        fecha_confirmacion TIMESTAMPTZ DEFAULT NOW()
    );

    -- Deshabilitar RLS para pruebas
    ALTER TABLE invitados_familia_cortez DISABLE ROW LEVEL SECURITY;

    -- O crear política permisiva
    CREATE POLICY "Permitir todas las operaciones" 
    ON invitados_familia_cortez 
    FOR ALL USING (true);
`;

try {
    localStorage.setItem('supabase_create_table_sql', createTableSQL);
} catch (e) {
    console.log('SQL para crear tabla:', createTableSQL);
}
