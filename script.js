// script.js - Versión Final Optimizada para Google Sheets
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGAbY49fhlFrt7rYapGo70NRLAVLP4rMfmm7XwDobQURipf3VGBs7Kb1ZRVhFOI5Dg7w/exec';

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema RSVP Familia Cortez iniciado');
    
    const form = document.getElementById('confirmation-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    const scrollInd = document.querySelector('.scroll-indicator');
    if(scrollInd) {
        scrollInd.addEventListener('click', () => {
            document.querySelector('#formulario').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    setupAcompanantesInput();
});

function setupAcompanantesInput() {
    const totalPersonasInput = document.getElementById('total_personas');
    const acompanantesContainer = document.createElement('div');
    acompanantesContainer.id = 'acompanantes-container';
    acompanantesContainer.className = 'form-group';
    
    totalPersonasInput.parentNode.parentNode.appendChild(acompanantesContainer);
    totalPersonasInput.addEventListener('change', updateAcompanantesInputs);
    updateAcompanantesInputs();
}

function updateAcompanantesInputs() {
    const container = document.getElementById('acompanantes-container');
    const totalPersonas = parseInt(document.getElementById('total_personas').value) || 1;
    container.innerHTML = '';
    
    if (totalPersonas > 1) {
        const label = document.createElement('label');
        label.className = 'form-label';
        label.innerHTML = `Nombres de tus ${totalPersonas - 1} acompañantes:`;
        container.appendChild(label);
        
        for (let i = 1; i < totalPersonas; i++) {
            const inputGroup = document.createElement('div');
            inputGroup.style.marginBottom = '10px';
            inputGroup.innerHTML = `
                <input type="text" class="form-input acompanante-input" 
                       placeholder="Nombre completo de la persona ${i}" required
                       style="width: 100%; padding: 12px 16px; border-radius: 8px; border: 1px solid #ddd;">`;
            container.appendChild(inputGroup);
        }
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const btn = document.getElementById('submit-btn');
    const statusMsg = document.getElementById('status-message');
    const originalText = btn.innerHTML;
    
    if (!validateForm()) return;
    
    // UI: Iniciando envío
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando en lista...';
    
    try {
        const formData = new FormData(form);
        const totalPersonas = parseInt(formData.get('total_personas')) || 1;
        const acompanantes = [];
        
        document.querySelectorAll('.acompanante-input').forEach((input, index) => {
            if (input.value.trim()) {
                acompanantes.push({ nombre: input.value.trim() });
            }
        });
        
        const dataToSend = {
            nombre_completo: formData.get('nombre').trim(),
            email: formData.get('email')?.trim() || 'No provisto',
            telefono: formData.get('telefono')?.trim() || 'No provisto',
            relacion_familia: formData.get('relacion'),
            plan_participacion: formData.get('plan'),
            hora_llegada: formData.get('hora'),
            comentarios: formData.get('comentarios')?.trim() || '',
            total_personas: totalPersonas,
            acompanantes: acompanantes.length > 0 ? acompanantes.map(a => a.nombre).join(', ') : 'Ninguno',
            user_agent: navigator.userAgent,
            fecha_registro: new Date().toLocaleString('es-CL'),
            estado: formData.get('plan') === 'no-asistir' ? 'No asistirá' : 'Confirmado'
        };

        // Enviar a Google Sheets usando fetch
        // Se usa keepalive para asegurar que la petición se complete
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend),
            keepalive: true 
        });

        // Simulación de éxito inmediato (debido a no-cors)
        showStatus('success', '¡Información guardada correctamente!');
        
        const mockId = Math.random().toString(36).substr(2, 6).toUpperCase();
        showConfirmationModal({ ...dataToSend, id: mockId });
        
        form.reset();
        updateAcompanantesInputs();
        
    } catch (err) {
        console.error('Error:', err);
        showStatus('error', 'Hubo un problema al conectar. Intenta de nuevo o usa WhatsApp.');
        showWhatsAppAlternative();
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function validateForm() {
    const required = ['nombre', 'relacion', 'plan', 'hora', 'total_personas'];
    for (const id of required) {
        const el = document.getElementById(id);
        if (!el.value || el.value.trim() === "") {
            showStatus('warning', `Por favor completa todos los campos obligatorios.`);
            el.focus();
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
    statusMsg.style.padding = '15px';
    statusMsg.style.borderRadius = '8px';
    statusMsg.style.marginBottom = '20px';
    
    if (type === 'success') {
        statusMsg.style.backgroundColor = '#d4edda';
        statusMsg.style.color = '#155724';
    } else {
        statusMsg.style.backgroundColor = '#f8d7da';
        statusMsg.style.color = '#721c24';
    }

    setTimeout(() => { statusMsg.style.display = 'none'; }, 6000);
}

function showConfirmationModal(data) {
    const modal = document.getElementById('confirmation-modal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.confirmation-content');
    const cId = `CORTEZ-${data.id}`;
    
    modalContent.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 50px; color: #28a745; margin-bottom: 20px;">
                <i class="fas fa-check-double"></i>
            </div>
            <h2 style="font-family: 'Playfair Display', serif; margin-bottom: 15px;">¡Confirmación Exitosa!</h2>
            <p style="margin-bottom: 20px;">Tu respuesta ha sido registrada en nuestra lista oficial de invitados.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 10px; text-align: left; margin-bottom: 20px; border-left: 4px solid #d4af37;">
                <p><strong>Invitado:</strong> ${data.nombre_completo}</p>
                <p><strong>Asistentes:</strong> ${data.total_personas}</p>
                <p><strong>Plan:</strong> ${data.plan_participacion}</p>
                <p><strong>Código RSVP:</strong> <span style="color: #d4af37; font-weight: bold;">${cId}</span></p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="shareConfirmation('${cId}', '${data.nombre_completo}')" 
                        style="background: #25D366; color: white; border: none; padding: 12px; border-radius: 25px; cursor: pointer; font-weight: bold;">
                    <i class="fab fa-whatsapp"></i> Enviar Comprobante
                </button>
                <button onclick="closeConfirmationModal()" 
                        style="background: transparent; border: 1px solid #ccc; padding: 10px; border-radius: 25px; cursor: pointer;">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const btn = document.getElementById('submit-btn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Confirmar Asistencia';
    btn.classList.remove('loading');
}

function closeConfirmationModal() {
    document.getElementById('confirmation-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function showWhatsAppAlternative() {
    const container = document.getElementById('whatsapp-alternative-container');
    if (!container) return;
    container.innerHTML = `
        <div style="background: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <p style="color: #856404;"><i class="fas fa-info-circle"></i> Si el formulario falla, pulsa aquí:</p>
            <a href="https://wa.me/56938654827?text=Hola! No pude usar el formulario, quiero confirmar mi asistencia." 
               target="_blank" style="color: #25D366; font-weight: bold; text-decoration: none;">
               <i class="fab fa-whatsapp"></i> Confirmar por WhatsApp
            </a>
        </div>`;
}

function shareConfirmation(id, nombre) {
    const msg = `✅ *Confirmación Familia Cortez 2026*\n\n¡Hola! He confirmado mi asistencia.\n\n👤 *Nombre:* ${nombre}\n📋 *Código:* ${id}\n\n¡Nos vemos pronto!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

window.closeConfirmationModal = closeConfirmationModal;
window.shareConfirmation = shareConfirmation;
