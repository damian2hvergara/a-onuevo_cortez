// script.js - Versión Final Optimizada y Probada
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGAbY49fhlFrt7rYapGo70NRLAVLP4rMfmm7XwDobQURipf3VGBs7Kb1ZRVhFOI5Dg7w/exec';

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema RSVP Familia Cortez iniciado');
    
    const form = document.getElementById('confirmation-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Lógica de scroll suave
    const scrollInd = document.querySelector('.scroll-indicator');
    if(scrollInd) {
        scrollInd.addEventListener('click', () => {
            const formSection = document.querySelector('#formulario');
            if(formSection) formSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    setupAcompanantesInput();
});

function setupAcompanantesInput() {
    const totalPersonasInput = document.getElementById('total_personas');
    if (!totalPersonasInput) return;

    // Crear el contenedor si no existe
    let acompanantesContainer = document.getElementById('acompanantes-container');
    if (!acompanantesContainer) {
        acompanantesContainer = document.createElement('div');
        acompanantesContainer.id = 'acompanantes-container';
        acompanantesContainer.className = 'form-group';
        totalPersonasInput.closest('.form-group').appendChild(acompanantesContainer);
    }
    
    // Escuchar cambios tanto por teclado como por botones +/-
    totalPersonasInput.addEventListener('change', updateAcompanantesInputs);
    totalPersonasInput.addEventListener('input', updateAcompanantesInputs);
    updateAcompanantesInputs();
}

function updateAcompanantesInputs() {
    const container = document.getElementById('acompanantes-container');
    const totalPersonas = parseInt(document.getElementById('total_personas').value) || 1;
    
    container.innerHTML = '';
    
    if (totalPersonas > 1) {
        const label = document.createElement('label');
        label.className = 'form-label';
        label.style.marginTop = '15px';
        label.innerHTML = `<i class="fas fa-users"></i> Nombres de tus ${totalPersonas - 1} acompañante(s):`;
        container.appendChild(label);
        
        for (let i = 1; i < totalPersonas; i++) {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'input-wrapper';
            inputGroup.style.marginBottom = '12px';
            inputGroup.innerHTML = `
                <input type="text" 
                       class="form-input acompanante-input" 
                       placeholder="Nombre completo del acompañante ${i}" 
                       required
                       style="width: 100%; padding: 12px 16px; border-radius: 8px; border: 1px solid #ddd;">
            `;
            container.appendChild(inputGroup);
        }
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerHTML;
    
    if (!validateForm()) return;
    
    // UI: Estado de carga
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando información...';
    
    try {
        const formData = new FormData(form);
        
        // Recolectar nombres de acompañantes
        const acompanantesArr = [];
        document.querySelectorAll('.acompanante-input').forEach(input => {
            if (input.value.trim()) acompanantesArr.push(input.value.trim());
        });
        
        // PREPARACIÓN DE DATOS PARA GOOGLE SHEETS
        // Usamos URLSearchParams para asegurar compatibilidad total con el script de Google
        const params = new URLSearchParams();
        params.append('fecha_registro', new Date().toLocaleString('es-CL'));
        params.append('nombre_completo', formData.get('nombre').trim());
        params.append('email', formData.get('email')?.trim() || 'No provisto');
        params.append('telefono', formData.get('telefono')?.trim() || 'No provisto');
        params.append('relacion_familia', formData.get('relacion'));
        params.append('plan_participacion', formData.get('plan'));
        params.append('hora_llegada', formData.get('hora'));
        params.append('total_personas', formData.get('total_personas'));
        params.append('acompanantes', acompanantesArr.join(', ') || 'Ninguno');
        params.append('comentarios', formData.get('comentarios')?.trim() || '');
        params.append('estado', formData.get('plan') === 'no-asistir' ? 'No asistirá' : 'Confirmado');

        // ENVÍO (Eliminado no-cors para evitar peticiones vacías)
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors', 
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        // Éxito
        showStatus('success', '¡Tu confirmación ha sido enviada con éxito!');
        const mockId = Math.random().toString(36).substr(2, 6).toUpperCase();
        showConfirmationModal({
            nombre_completo: formData.get('nombre'),
            total_personas: formData.get('total_personas'),
            id: mockId
        });
        
        form.reset();
        updateAcompanantesInputs();
        
    } catch (err) {
        console.error('Error de envío:', err);
        showStatus('error', 'Hubo un error al enviar. Por favor, usa WhatsApp.');
        showWhatsAppAlternative();
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function validateForm() {
    const requiredFields = ['nombre', 'relacion', 'plan', 'hora', 'total_personas'];
    for (const id of requiredFields) {
        const el = document.getElementById(id);
        // Validar radios por nombre si no se encuentra por ID
        if (id === 'plan' || id === 'hora') {
            const radioChecked = document.querySelector(`input[name="${id}"]:checked`);
            if (!radioChecked) {
                showStatus('warning', 'Por favor, selecciona una opción obligatoria.');
                return false;
            }
        } else if (!el || !el.value.trim()) {
            showStatus('warning', 'Por favor, completa todos los campos obligatorios.');
            if(el) el.focus();
            return false;
        }
    }
    return true;
}

function showStatus(type, message) {
    const statusMsg = document.getElementById('status-message');
    if (!statusMsg) return;
    
    statusMsg.className = `status-message ${type}`;
    statusMsg.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i> <span>${message}</span>`;
    statusMsg.style.display = 'flex';
    
    statusMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
        statusMsg.style.display = 'none';
    }, 8000);
}

function showConfirmationModal(data) {
    const modal = document.getElementById('confirmation-modal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.confirmation-content');
    const confirmationId = `CORTEZ-${data.id}`;
    
    modalContent.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 50px; color: #d4b483; margin-bottom: 15px;">
                <i class="fas fa-envelope-open-text"></i>
            </div>
            <h2 style="font-family: 'Playfair Display', serif; color: #0a1a3a; margin-bottom: 10px;">¡Confirmación Recibida!</h2>
            <p style="color: #666; margin-bottom: 20px;">Gracias por ser parte de nuestro Año Nuevo 2026.</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 10px; text-align: left; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <p><strong>Invitado:</strong> ${data.nombre_completo}</p>
                <p><strong>Asistentes:</strong> ${data.total_personas}</p>
                <p><strong>Código RSVP:</strong> <span style="color: #d4b483; font-weight: bold;">${confirmationId}</span></p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="shareConfirmation('${confirmationId}', '${data.nombre_completo}')" 
                        style="background: #25D366; color: white; border: none; padding: 12px; border-radius: 25px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <i class="fab fa-whatsapp"></i> Enviar Comprobante
                </button>
                <button onclick="closeConfirmationModal()" 
                        style="background: transparent; border: 1px solid #ccc; padding: 10px; border-radius: 25px; cursor: pointer; color: #666;">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function showWhatsAppAlternative() {
    const container = document.getElementById('whatsapp-alternative-container');
    if (!container) return;
    
    container.innerHTML = `
        <div style="background: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <p style="color: #856404; font-size: 0.9rem; margin-bottom: 10px;">
                <i class="fas fa-info-circle"></i> Si el formulario presenta problemas, pulsa aquí:
            </p>
            <a href="https://wa.me/56938654827?text=Hola! Quiero confirmar mi asistencia para Año Nuevo." 
               target="_blank" 
               style="background: #25D366; color: white; padding: 8px 15px; border-radius: 20px; text-decoration: none; font-weight: bold; font-size: 0.9rem; display: inline-block;">
               <i class="fab fa-whatsapp"></i> WhatsApp Directo
            </a>
        </div>
    `;
}

function shareConfirmation(id, nombre) {
    const text = `✅ *Confirmación Familia Cortez 2026*\n\n¡Hola! Ya registré mi asistencia.\n\n👤 *Nombre:* ${nombre}\n📋 *Código:* ${id}\n\n¡Nos vemos pronto! 🥂`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// Hacer funciones accesibles desde el HTML
window.closeConfirmationModal = closeConfirmationModal;
window.shareConfirmation = shareConfirmation;
