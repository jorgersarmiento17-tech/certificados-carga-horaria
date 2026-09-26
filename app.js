// =========================================================================
// ARCHIVO: app.js (MOTOR AUTOMATIZADO CON DETECCIÓN INTELIGENTE DE GÉNERO)
// Comisión de Planeamiento Institucional - UEF La Dolorosa
// Elaborado por: Ab. Giovanna Salinas y Jorge Sarmiento Zumba
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("docente-select");
    const articuloSelect = document.getElementById("articulo-select");
    const override = document.getElementById("titulo-override");
    const btn = document.getElementById("btn-print");
    const container = document.getElementById("certificado-a4");

    if (typeof DATA_DOCENTES === 'undefined' || typeof DATA_HORARIOS === 'undefined') {
        console.error("Error crítico: No se detectan las variables globales de docentes o horarios.");
        return;
    }

    // Asegurar limpieza previa del selector en la SPA
    select.innerHTML = '<option value="">-- Seleccione un docente --</option>';

    // 1. Población del Selector Alfabético (A-Z)
    const profesoresDisponibles = Object.keys(DATA_DOCENTES).sort((a, b) => a.localeCompare(b));
    profesoresDisponibles.forEach(profesor => {
        const option = document.createElement("option"); 
        option.value = profesor; 
        option.textContent = profesor; 
        select.appendChild(option);
    });

    select.addEventListener("change", renderCertificado);
    if (articuloSelect) articuloSelect.addEventListener("change", renderCertificado);
    override.addEventListener("change", renderCertificado);
    btn.addEventListener("click", () => window.print());

    function normalizarIdentificador(str) {
        if (!str) return "";
        return str.toString().toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\./g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    // 2. Motor dinámico de renderizado y conversión cronológica legal
    function renderCertificado() {
        const profesorKey = select.value;
        if (!profesorKey) {
            container.innerHTML = '<div class="placeholder-text"><p>Por favor, seleccione un docente del listado de la barra lateral izquierda para procesar las horas pedagógicas y generar la vista previa del certificado legal A4.</p></div>';
            btn.disabled = true;
            return;
        }

        btn.disabled = false;
        const meta = DATA_DOCENTES[profesorKey];
        let tituloFormal = override.value === "AUTO" ? meta.titulo : override.value;

        // 🛠️ REGLA DE INTELIGENCIA DE GÉNERO AUTOMÁTICA: Detecta el sexo por la última letra del título
        let articuloElegido = "El";
        let ultimoCaracterTitulo = tituloFormal.trim().slice(-1).toLowerCase();
        
        if (ultimoCaracterTitulo === "a") {
            articuloElegido = "La";
        }

        // Si el usuario cambia manualmente el selector de la barra, respetamos su elección externa
        if (articuloSelect && articuloSelect.value !== "El" && articuloSelect.value !== "La") {
            // Si tiene el valor por defecto del HTML usa la detección automática, sino la del select
        } else if (articuloSelect) {
            // Sincronizar visualmente el menú lateral con la detección automática para que no confunda
            articuloSelect.value = articuloElegido;
        }

        // Mapeo automático riguroso de concordancia gramatical interna
        const sustantivoProfesional = (articuloElegido === "El") ? "el profesional mencionado" : "la profesional mencionada";

        const claveBuscada = normalizarIdentificador(profesorKey);
        const clasesDocente = DATA_HORARIOS.filter(clase => normalizarIdentificador(clase.Profesor) === claveBuscada);

        let totalHoras = 0;
        let tutorDeCurso = null;
        const agrupacion = {};

        clasesDocente.forEach(clase => {
            totalHoras++;
            if (normalizarIdentificador(clase.Asignatura).includes("civica y acompanamiento")) {
                tutorDeCurso = clase.Curso;
            }
            const hashKey = clase.Asignatura + " | " + clase.Curso;
            if (!agrupacion[hashKey]) {
                agrupacion[hashKey] = { asignatura: clase.Asignatura, curso: clase.Curso, hours: 0 };
            }
            agrupacion[hashKey].hours++;
        });

        const tablaResumen = Object.values(agrupacion).sort((a, b) => a.asignatura.localeCompare(b.asignatura));

        const conversionLetras = (num) => {
            const u = ["cero", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuna", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve", "treinta"];
            return u[num] || num.toString();
        };

        // Algoritmo Cronológico del Sistema
        const fechaActual = new Date();
        const diasTexto = ["cero", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve", "treinta", "treinta y un"];
        const mesesTexto = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        
        const diaNum = fechaActual.getDate();
        const mesTexto = mesesTexto[fechaActual.getMonth()];
        const anioNum = fechaActual.getFullYear();

        let anioTexto = "dos mil veintiséis";
        if (anioNum === 2027) anioTexto = "dos mil veintisiete";
        else if (anioNum === 2028) anioTexto = "dos mil veintiocho";
        else if (anioNum !== 2026) anioTexto = anioNum.toString();

        let diaEstructurado = "a los " + diasTexto[diaNum] + " días";
        if (diaNum === 1) diaEstructurado = "al primer día";

        let tablaHTML = '<div class="cert-table-title">CUADRO RESUMEN DE DISTRIBUCIÓN DE TRABAJO:</div><table class="cert-table"><thead><tr><th>ASIGNATURA ASIGNADA</th><th>CURSO / NIVEL</th><th class="col-horas">HORAS SEMANALES</th></tr></thead><tbody>';
        tablaResumen.forEach(fila => {
            tablaHTML += '<tr><td>' + fila.asignatura + '</td><td>' + fila.curso + '</td><td class="col-horas">' + fila.hours + ' hor(as)</td></tr>';
        });
        tablaHTML += '<tr class="row-total"><td colspan="2">Total de horas pedagógicas semanales</td><td class="col-horas">' + totalHoras + ' horas</td></tr></tbody></table>';

        let textoTutoriaHTML = "";
        if (tutorDeCurso) {
            textoTutoriaHTML = '<p>De igual manera, se deja constancia formal que ' + sustantivoProfesional + ' ejerce las funciones de <strong>Docente Tutor</strong> del curso <strong>' + tutorDeCurso + '</strong>, liderando el acompañamiento educativo integral del paralelo respectivo durante el presente periodo.</p>';
        }

        // Inyección estructural total del Certificado oficial A4 corregido
        container.innerHTML = 
            '<div class="cert-header">' +
                '<img src="escudo.png" alt="Escudo UEF La Dolorosa" class="cert-logo">' +
                '<div class="cert-header-text">MINISTERIO DE EDUCACIÓN<br>COORDINACIÓN ZONAL 7 - DISTRITO 11D01<br>UNIDAD EDUCATIVA FISCOMISIONAL "LA DOLOROSA"</div>' +
            '</div>' +
            '<div class="cert-title">CERTIFICADO DE DISTRIBUTIVO DE CARGA HORARIA SEMANAL</div>' +
            '<div class="cert-body">' +
                '<p>El Vicerrectorado de la Unidad Educativa Fiscomisional "La Dolorosa", en cumplimiento con las normativas legales vigentes y la planificación del orgánico funcional institucional,</p>' +
                '<p><strong>CERTIFICA QUE:</strong></p>' +
                '<p>' + articuloElegido + ' docente <strong>' + tituloFormal + ' ' + meta.nombre_completo + '</strong>, portador/a de la cédula de ciudadanía Nro. <strong>' + meta.cedula + '</strong>, cumple de manera efectiva con su distributivo de labor pedagógica en la <strong>Jornada Matutina</strong> durante el presente Año Lectivo <strong>2026 - 2027</strong>.</p>' +
                '<p>Su carga horaria semanal consolidada asciende a un total de <strong>' + conversionLetras(totalHoras) + ' (' + totalHoras + ') horas pedagógicas</strong>, las cuales se encuentran distribuidas detalladamente en las asignaturas y niveles descritos en la tabla resumen adjunta.</p>' +
                textoTutoriaHTML +
                '<p>Para que así conste y a petición verbal de la parte interesada para los fines pertinentes, se firma el presente certificado en la ciudad de Loja, ' + diaEstructurado + ' del mes de ' + mesTexto + ' del año ' + anioTexto + '.</p>' +
            '</div>' +
            tablaHTML +
            '<div class="cert-signatures">' +
                '<div class="signature-block"><div class="signature-line"></div><strong>Mgtr. Patricio Espinoza</strong><br>Vicerrector de la Jornada Matutina</div>' +
                '<div class="signature-block"><div class="signature-line"></div><strong>Ab. Giovanna Salinas</strong><br>Secretaria / Vicerrectorado</div>' +
            '</div>' +
            '<div class="cert-footer-note">Elaborado por: Jorge Sarmiento Zumba | Coordinador de la Comisión de Planeamiento Institucional.</div>';
    }
});
