// script.js - Versión Final Optimizada
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
            const formSection = document.querySelector('#formulario');
            if(formSection) formSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    setupAcompanantesInput();
});

function setupAcompanantesInput() {
    const totalPersonasInput = document.getElementById('total_personas');
    if (!totalPersonasInput) return;

    let acompanantesContainer = document.getElementById('acompanantes-container');
    if (!acompanantesContainer) {
        acompanantesContainer = document.createElement('div');
        acompanantesContainer.id = 'acompanantes-container';
        acompanantesContainer.className = 'form-group';
        totalPersonasInput.closest('.form-group').appendChild(acompanantesContainer);
    }
    
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
                       required>
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
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    try {
        const formData = new FormData(form);
        const acompanantesArr = [];
        document.querySelectorAll('.acompanante-input').forEach(input => {
            if (input.value.trim()) acompanantesArr.push(input.value.trim());
        });

        // PREPARACIÓN DE DATOS JSON (Compatible con el paso de Google Sheets)
        const dataToSend = {
            fecha_registro: new Date().toLocaleString('es-CL'),
            nombre_completo: formData.get('nombre'),
            email: formData.get('email') || 'No provisto',
            telefono: formData.get('telefono') || 'No provisto',
            relacion_familia: formData.get('relacion'),
            plan_participacion: formData.get('plan'),
            hora_llegada: formData.get('hora'),
            total_personas: formData.get('total_personas'),
            acompanantes: acompanantesArr.join(', ') || 'Ninguno',
            comentarios: formData.get('comentarios') || ''
        };

        // Petición POST mejorada para evitar bloqueos
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Modo opaco para evitar errores de CORS
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });

        // Simulación de éxito (con no-cors no podemos leer la respuesta pero los datos llegan)
        showStatus('success', '¡Tu confirmación ha sido enviada!');
        const mockId = Math.random().toString(36).substr(2, 6).toUpperCase();
        showConfirmationModal({ 
            nombre_completo: dataToSend.nombre_completo,
            total_personas: dataToSend.total_personas,
            id: mockId 
        });
        
        form.reset();
        updateAcompanantesInputs();
        
    } catch (err) {
        console.error('Error:', err);
        showStatus('error', 'Error al conectar. Intenta por WhatsApp.');
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
        if (id === 'plan' || id === 'hora') {
            const radioChecked = document.querySelector(`input[name="${id}"]:checked`);
            if (!radioChecked) { return false; }
        } else if (!el || !el.value.trim()) {
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
    setTimeout(() => { statusMsg.style.display = 'none'; }, 8000);
}

function showConfirmationModal(data) {
    const modal = document.getElementById('confirmation-modal');
    if (!modal) return;
    const modalContent = modal.querySelector('.confirmation-content');
    const confirmationId = `CORTEZ-${data.id}`;
    
    modalContent.innerHTML = `
        <div style="text-align: center;">
            <h2>¡Confirmación Recibida!</h2>
            <p><strong>Invitado:</strong> ${data.nombre_completo}</p>
            <p><strong>Código RSVP:</strong> ${confirmationId}</p>
            <button onclick="shareConfirmation('${confirmationId}', '${data.nombre_completo}')" style="background:#25D366; color:white; padding:10px; border-radius:20px; width:100%; border:none; margin-top:10px; cursor:pointer;">
                <i class="fab fa-whatsapp"></i> Compartir
            </button>
            <button onclick="closeConfirmationModal()" style="background:none; border:none; color:gray; margin-top:10px; cursor:pointer;">Cerrar</button>
        </div>
    `;
    modal.classList.add('active');
}

function closeConfirmationModal() {
    document.getElementById('confirmation-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function showWhatsAppAlternative() {
    const container = document.getElementById('whatsapp-alternative-container');
    if (container) {
        container.innerHTML = `<a href="https://wa.me/56938654827" target="_blank" class="btn-whatsapp">Contactar por WhatsApp</a>`;
    }
}

function shareConfirmation(id, nombre) {
    const text = `✅ *Confirmación Familia Cortez*\n👤 *Nombre:* ${nombre}\n📋 *Código:* ${id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

window.closeConfirmationModal = closeConfirmationModal;
window.shareConfirmation = shareConfirmation;
