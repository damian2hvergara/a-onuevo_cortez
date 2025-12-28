// ============================================
// SISTEMA FAMILIA CORTEZ 2026 - VERSIÓN SIMPLIFICADA
// ============================================

// CONFIGURACIÓN SUPABASE - ¡FUNCIONAL!
const SUPABASE_URL = 'https://hzmhobnwqqwamdtzspbv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bWhvYm53cXF3YW1kdHpzcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MzIyMDAsImV4cCI6MjA1MTIwODIwMH0.R_6A5F8m7hC3J7QvW5Z9X8YV1XZ3KjL9MpNqR0S1T2U';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema iniciado');
    
    // Configurar formulario
    const form = document.getElementById('confirmation-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitForm();
        });
    }
    
    // Botón WhatsApp alternativo
    const whatsappBtn = document.getElementById('whatsapp-alternative-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', showWhatsAppOption);
    }
});

// ============================================
// ENVÍO DE FORMULARIO
// ============================================

async function submitForm() {
    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerHTML;
    
    // Mostrar loading
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    btn.disabled = true;
    
    try {
        // 1. Validar
        if (!validateForm()) {
            throw new Error('Por favor, completa todos los campos requeridos');
        }
        
        // 2. Recolectar datos
        const formData = getFormData();
        
        // 3. Confirmación del usuario
        if (!confirm(`¿Confirmar asistencia para ${formData.nombre_completo}?`)) {
            resetButton(btn, originalText);
            return;
        }
        
        // 4. Obtener IP
        const ip = await getIP();
        
        // 5. Preparar datos para Supabase
        const dataToSave = {
            ...formData,
            ip_address: ip,
            user_agent: navigator.userAgent,
            estado: 'confirmado'
        };
        
        // 6. Guardar en Supabase
        console.log('Enviando a Supabase:', dataToSave);
        const { data, error } = await supabase
            .from('invitados_familia_cortez')
            .insert([dataToSave])
            .select();
        
        if (error) throw error;
        
        // 7. Mostrar éxito
        showSuccess();
        showConfirmationModal(data[0]);
        
        // 8. Limpiar formulario
        document.getElementById('confirmation-form').reset();
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al enviar');
    } finally {
        resetButton(btn, originalText);
    }
}

function getFormData() {
    return {
        nombre_completo: document.getElementById('nombre').value.trim(),
        relacion_familia: document.getElementById('relacion').value,
        plan_participacion: document.querySelector('input[name="plan"]:checked')?.value,
        hora_llegada: document.querySelector('input[name="hora"]:checked')?.value,
        comentarios: document.getElementById('comentarios').value.trim(),
        total_personas: parseInt(document.getElementById('total_personas').value) || 1,
        email: document.getElementById('email').value.trim() || null,
        telefono: document.getElementById('telefono').value.trim() || null,
        fecha_registro: new Date().toISOString(),
        fecha_confirmacion: new Date().toISOString()
    };
}

function validateForm() {
    const nombre = document.getElementById('nombre').value.trim();
    const relacion = document.getElementById('relacion').value;
    const plan = document.querySelector('input[name="plan"]:checked');
    const hora = document.querySelector('input[name="hora"]:checked');
    const personas = document.getElementById('total_personas').value;
    
    if (!nombre || nombre.length < 2) return false;
    if (!relacion) return false;
    if (!plan) return false;
    if (!hora) return false;
    if (!personas || personas < 1 || personas > 20) return false;
    
    return true;
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function getIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'desconocida';
    }
}

function resetButton(btn, text) {
    setTimeout(() => {
        btn.innerHTML = text;
        btn.disabled = false;
    }, 2000);
}

// ============================================
// MENSAJES
// ============================================

function showSuccess() {
    const status = document.getElementById('status-message');
    status.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-check-circle" style="color: #10b981;"></i>
            <div>
                <strong style="color: #10b981;">¡Confirmación exitosa!</strong>
                <div style="font-size: 0.9rem;">Los datos se han guardado correctamente.</div>
            </div>
        </div>
    `;
    status.className = 'status-message success';
    status.style.display = 'flex';
}

function showError(message) {
    const status = document.getElementById('status-message');
    status.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
            <div>
                <strong style="color: #ef4444;">Error</strong>
                <div style="font-size: 0.9rem;">${message}</div>
            </div>
        </div>
    `;
    status.className = 'status-message error';
    status.style.display = 'flex';
    
    // Mostrar alternativa WhatsApp
    showWhatsAppOption();
}

// ============================================
// MODAL DE CONFIRMACIÓN
// ============================================

function showConfirmationModal(data) {
    const modal = document.getElementById('confirmation-modal');
    const content = modal.querySelector('.confirmation-content');
    
    content.innerHTML = `
        <div class="confirmation-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        
        <h2 class="confirmation-title">¡Confirmado! 🎉</h2>
        
        <div class="confirmation-details">
            <p><strong>Nombre:</strong> ${data.nombre_completo}</p>
            <p><strong>Plan:</strong> ${getPlanText(data.plan_participacion)}</p>
            <p><strong>Personas:</strong> ${data.total_personas}</p>
            <p><strong>Hora:</strong> ${data.hora_llegada}</p>
            <p><strong>ID:</strong> ${data.codigo_confirmacion || 'CORTEZ-' + data.id}</p>
        </div>
        
        <p class="confirmation-text">
            ¡Perfecto! Ya estamos listos para recibirte.<br>
            Nos vemos el 31 de diciembre.
        </p>
        
        <div class="confirmation-signature">Familia Cortez</div>
        
        <div class="confirmation-actions">
            <button onclick="shareOnWhatsApp('${data.codigo_confirmacion || data.id}')" class="btn-share">
                <i class="fab fa-whatsapp"></i> Compartir
            </button>
            <button onclick="closeModal()" class="btn-close-modal">
                <i class="fas fa-times"></i> Cerrar
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

function getPlanText(plan) {
    const plans = {
        'cena-fiesta': 'Cena + Fiesta',
        'solo-fiesta': 'Solo Fiesta',
        'no-asistir': 'No asistirá'
    };
    return plans[plan] || plan;
}

function closeModal() {
    document.getElementById('confirmation-modal').classList.remove('active');
}

function shareOnWhatsApp(id) {
    const text = `¡Confirmé mi asistencia al Año Nuevo de la Familia Cortez! 🎆 ID: ${id}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// ============================================
// ALTERNATIVA WHATSAPP
// ============================================

function showWhatsAppOption() {
    const nombre = document.getElementById('nombre').value.trim() || '';
    const personas = document.getElementById('total_personas').value || '1';
    
    const container = document.getElementById('whatsapp-alternative-container');
    container.innerHTML = `
        <div class="whatsapp-alternative">
            <p><i class="fab fa-whatsapp"></i> <strong>¿Problemas con el formulario?</strong></p>
            <p>Confirma directamente por WhatsApp:</p>
            <div class="whatsapp-buttons">
                <a href="https://wa.me/56938654827?text=Hola,%20quiero%20confirmar%20mi%20asistencia%20al%20Año%20Nuevo%202026.%20Nombre:%20${encodeURIComponent(nombre)}%20Personas:%20${personas}" 
                   target="_blank" class="whatsapp-btn">
                    <i class="fab fa-whatsapp"></i> Confirmar a Damián
                </a>
                <a href="https://wa.me/56930373866?text=Hola,%20quiero%20confirmar%20mi%20asistencia%20al%20Año%20Nuevo%202026.%20Nombre:%20${encodeURIComponent(nombre)}%20Personas:%20${personas}" 
                   target="_blank" class="whatsapp-btn secondary">
                    <i class="fab fa-whatsapp"></i> Confirmar a Fernanda
                </a>
            </div>
        </div>
    `;
}

// ============================================
// FUNCIONES GLOBALES
// ============================================

window.closeModal = closeModal;
window.shareOnWhatsApp = shareOnWhatsApp;
window.showWhatsAppOption = showWhatsAppOption;

// Mensaje de consola
console.log('%c🎉 FAMILIA CORTEZ 2026', 'color: #d4b483; font-size: 18px; font-weight: bold;');
console.log('✅ Sistema listo para usar');
