// script.js - Versión optimizada y corregida
const SUPABASE_URL = 'https://hzmhobnwqqwamdtzspbv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bWhvYm53cXF3YW1kdHpzcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzQwMzEsImV4cCI6MjA4MjQ1MDAzMX0.JGb8TpU6tbFfSBi2Gs34YzciYGgQu5gUvWtdnHm6F2I';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema RSVP Familia Cortez iniciado');
    
    // 1. Configurar submit del formulario
    const form = document.getElementById('confirmation-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // 2. Lógica de scroll (original preservada)
    const scrollInd = document.querySelector('.scroll-indicator');
    if(scrollInd) {
        scrollInd.addEventListener('click', () => {
            document.querySelector('#formulario').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // 3. Generar inputs dinámicos para acompañantes
    setupAcompanantesInput();
});

function setupAcompanantesInput() {
    const totalPersonasInput = document.getElementById('total_personas');
    const acompanantesContainer = document.createElement('div');
    acompanantesContainer.id = 'acompanantes-container';
    acompanantesContainer.className = 'form-group';
    
    // Insertar después del contador de personas
    totalPersonasInput.parentNode.parentNode.appendChild(acompanantesContainer);
    
    totalPersonasInput.addEventListener('change', updateAcompanantesInputs);
    updateAcompanantesInputs();
}

function updateAcompanantesInputs() {
    const container = document.getElementById('acompanantes-container');
    const totalPersonas = parseInt(document.getElementById('total_personas').value) || 1;
    
    // Limpiar container
    container.innerHTML = '';
    
    // Si hay más de 1 persona, mostrar campos para acompañantes
    if (totalPersonas > 1) {
        const label = document.createElement('label');
        label.className = 'form-label';
        label.innerHTML = `Nombres de las ${totalPersonas - 1} persona(s) que te acompañan:`;
        container.appendChild(label);
        
        for (let i = 1; i < totalPersonas; i++) {
            const inputGroup = document.createElement('div');
            inputGroup.style.marginBottom = '10px';
            inputGroup.innerHTML = `
                <input type="text" 
                       class="form-input acompanante-input" 
                       placeholder="Nombre completo de la persona ${i}"
                       required
                       style="width: 100%; padding: 12px 16px; border-radius: 8px;">
            `;
            container.appendChild(inputGroup);
        }
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Obtener elementos DOM
    const form = e.target;
    const btn = document.getElementById('submit-btn');
    const statusMsg = document.getElementById('status-message');
    const originalText = btn.innerHTML;
    
    // Resetear mensajes de estado
    statusMsg.className = 'status-message';
    statusMsg.style.display = 'none';
    
    // Validación básica del formulario
    if (!validateForm()) {
        showStatus('error', 'Por favor, completa todos los campos requeridos correctamente.');
        return;
    }
    
    // Preparar UI para envío
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando confirmación...';
    
    try {
        // 1. Preparar datos del formulario
        const formData = new FormData(form);
        const totalPersonas = parseInt(formData.get('total_personas')) || 1;
        
        // 2. Capturar acompañantes si existen
        const acompanantes = [];
        if (totalPersonas > 1) {
            document.querySelectorAll('.acompanante-input').forEach((input, index) => {
                if (input.value.trim()) {
                    acompanantes.push({
                        id: index + 1,
                        nombre: input.value.trim(),
                        fecha_registro: new Date().toISOString()
                    });
                }
            });
        }
        
        // 3. Construir objeto para Supabase
        const dataToSend = {
            nombre_completo: formData.get('nombre').trim(),
            email: formData.get('email')?.trim() || null,
            telefono: formData.get('telefono')?.trim() || null,
            relacion_familia: formData.get('relacion'),
            plan_participacion: formData.get('plan'),
            hora_llegada: formData.get('hora'),
            comentarios: formData.get('comentarios')?.trim() || '',
            total_personas: totalPersonas,
            acompanantes: acompanantes.length > 0 ? acompanantes : null,
            user_agent: navigator.userAgent,
            fecha_registro: new Date().toISOString(),
            estado: 'confirmado' // Nuevo campo para tracking
        };
        
        // 4. Validar plan "no asistir"
        if (dataToSend.plan_participacion === 'no-asistir') {
            dataToSend.estado = 'no_asistira';
            dataToSend.total_personas = 1; // Forzar a 1 si no asiste
            dataToSend.acompanantes = null;
        }
        
        console.log('📤 Enviando datos a Supabase:', dataToSend);
        
        // 5. Insertar en Supabase
        const { data, error } = await _supabase
            .from('invitados_familia_cortez')
            .insert([dataToSend])
            .select();
        
        if (error) {
            console.error('❌ Error Supabase:', error);
            throw new Error(`Error en el servidor: ${error.message}`);
        }
        
        console.log('✅ Datos guardados exitosamente:', data);
        
        // 6. Mostrar modal de confirmación exitosa
        showConfirmationModal(data[0]);
        
        // 7. Resetear formulario
        form.reset();
        updateAcompanantesInputs(); // Resetear acompañantes
        
    } catch (err) {
        console.error('❌ Error crítico:', err);
        
        // Mostrar mensaje de error
        showStatus('error', `Error al enviar: ${err.message}`);
        
        // Mostrar alternativa WhatsApp
        showWhatsAppAlternative();
        
        // Re-enable button
        btn.disabled = false;
        btn.classList.remove('loading');
        btn.innerHTML = originalText;
        
    } finally {
        // Nota: El botón se mantiene deshabilitado si fue exitoso
        // porque el modal está mostrándose
    }
}

function validateForm() {
    const requiredFields = [
        { id: 'nombre', name: 'Nombre completo' },
        { id: 'relacion', name: 'Relación con la familia' },
        { id: 'plan', name: 'Plan de participación' },
        { id: 'hora', name: 'Hora de llegada' },
        { id: 'total_personas', name: 'Total de personas' }
    ];
    
    // Verificar campos requeridos
    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        
        if (element.type === 'radio' || element.type === 'select-one') {
            // Para radios y selects
            const selected = document.querySelector(`[name="${element.name || field.id}"]:checked`);
            if (!selected) {
                showStatus('warning', `Por favor, selecciona "${field.name}"`);
                element.focus();
                return false;
            }
        } else {
            // Para inputs de texto
            if (!element.value.trim()) {
                showStatus('warning', `Por favor, completa "${field.name}"`);
                element.focus();
                return false;
            }
        }
    }
    
    // Validar número de personas
    const totalPersonas = parseInt(document.getElementById('total_personas').value);
    if (isNaN(totalPersonas) || totalPersonas < 1 || totalPersonas > 20) {
        showStatus('warning', 'El número de personas debe estar entre 1 y 20');
        return false;
    }
    
    // Validar acompañantes si total > 1
    if (totalPersonas > 1) {
        const acompanantesInputs = document.querySelectorAll('.acompanante-input');
        let allFilled = true;
        
        acompanantesInputs.forEach(input => {
            if (!input.value.trim()) allFilled = false;
        });
        
        if (!allFilled) {
            showStatus('warning', 'Por favor, completa los nombres de todos tus acompañantes');
            return false;
        }
    }
    
    return true;
}

function showStatus(type, message) {
    const statusMsg = document.getElementById('status-message');
    
    statusMsg.className = `status-message ${type}`;
    statusMsg.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'exclamation-triangle'}"></i>
        <span>${message}</span>
    `;
    statusMsg.style.display = 'flex';
    
    // Auto-ocultar después de 5 segundos (excepto errores)
    if (type !== 'error') {
        setTimeout(() => {
            statusMsg.style.display = 'none';
        }, 5000);
    }
}

function showConfirmationModal(confirmationData) {
    const modal = document.getElementById('confirmation-modal');
    const modalContent = modal.querySelector('.confirmation-content');
    
    // Generar ID de confirmación amigable
    const confirmationId = `CORTEZ-${confirmationData.id.slice(0, 8).toUpperCase()}`;
    
    // Determinar mensaje según plan
    let planMessage = '';
    if (confirmationData.plan_participacion === 'no-asistir') {
        planMessage = `
            <p style="color: var(--gris-medio); font-style: italic;">
                <i class="fas fa-heart"></i> Te extrañaremos esta vez. ¡Esperamos verte en la próxima celebración!
            </p>
        `;
    } else {
        planMessage = `
            <p>Nos alegra mucho que nos acompañes en esta celebración especial.</p>
            <p><strong>Detalles de tu confirmación:</strong></p>
            <div class="confirmation-details">
                <p><i class="fas fa-user"></i> <strong>Invitado:</strong> ${confirmationData.nombre_completo}</p>
                <p><i class="fas fa-users"></i> <strong>Total personas:</strong> ${confirmationData.total_personas}</p>
                <p><i class="fas fa-clock"></i> <strong>Hora estimada:</strong> ${confirmationData.hora_llegada}</p>
                <p><i class="fas fa-calendar-check"></i> <strong>Plan:</strong> ${confirmationData.plan_participacion === 'cena-fiesta' ? 'Cena + Fiesta' : 'Solo Fiesta'}</p>
                <p><i class="fas fa-fingerprint"></i> <strong>ID de confirmación:</strong> <span class="confirmation-id">${confirmationId}</span></p>
            </div>
            <p style="margin-top: 20px; font-size: 0.95rem; color: var(--gris-medio);">
                <i class="fas fa-info-circle"></i> Los valores se comunicarán de forma personalizada al cierre de confirmaciones.
            </p>
        `;
    }
    
    // Configurar contenido del modal
    modalContent.innerHTML = `
        <div class="confirmation-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <h2 class="confirmation-title">¡Confirmación Exitosa!</h2>
        ${planMessage}
        <div class="confirmation-actions">
            <button onclick="shareConfirmation('${confirmationId}', '${confirmationData.nombre_completo}')" class="btn-share">
                <i class="fab fa-whatsapp"></i> Compartir vía WhatsApp
            </button>
            <button onclick="closeConfirmationModal()" class="btn-close-modal">
                <i class="fas fa-times"></i> Cerrar
            </button>
        </div>
    `;
    
    // Mostrar modal con animación
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevenir scroll
    
    // Resetear botón de submit
    const btn = document.getElementById('submit-btn');
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Confirmar Asistencia';
}

function closeConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto'; // Restaurar scroll
}

function showWhatsAppAlternative() {
    const container = document.getElementById('whatsapp-alternative-container');
    
    const message = `Hola Familia Cortez! Quiero confirmar mi asistencia al Año Nuevo 2026 pero tuve un problema con el formulario web. Mi nombre es: [TU_NOMBRE]`;
    const whatsappUrl = `https://wa.me/56938654827?text=${encodeURIComponent(message)}`;
    
    container.innerHTML = `
        <div class="whatsapp-alternative">
            <h3><i class="fas fa-exclamation-triangle"></i> ¿Hubo un problema?</h3>
            <p>No te preocupes, puedes confirmar directamente por WhatsApp:</p>
            <div class="whatsapp-buttons">
                <a href="${whatsappUrl}" target="_blank" class="whatsapp-btn">
                    <i class="fab fa-whatsapp"></i> Confirmar con Damián
                </a>
                <a href="https://wa.me/56930373866" target="_blank" class="whatsapp-btn secondary">
                    <i class="fab fa-whatsapp"></i> Confirmar con Fernanda
                </a>
            </div>
            <p style="margin-top: 15px; font-size: 0.9rem; color: var(--gris-medio);">
                <i class="fas fa-info-circle"></i> Envíanos un mensaje con tu nombre y número de personas.
            </p>
        </div>
    `;
    
    // Animar la aparición
    container.style.animation = 'fadeIn 0.5s ease';
}

function shareConfirmation(confirmationId, nombre) {
    const message = `✅ Confirmación Familia Cortez 2026\n\nHola! Ya confirmé mi asistencia para el Año Nuevo.\n\n📋 ID: ${confirmationId}\n👤 Nombre: ${nombre}\n\n¡Nos vemos el 31 de diciembre!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
}

// Exportar funciones globalmente
window.closeConfirmationModal = closeConfirmationModal;
window.shareConfirmation = shareConfirmation;
