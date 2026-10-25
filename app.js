"use strict";

const $ = selector => document.querySelector(selector);
const STORAGE_KEY = "fireacademy_courses_v1";
const MAX_IMAGE_SIZE = 1.5 * 1024 * 1024;
let toastTimer;
let selectedImage = "";

const sampleCourses = [
  {id:"course-1",title:"Combate contra incendios: nivel básico",category:"Combate contra incendios",description:"Introducción a la prevención, reconocimiento de peligros, clasificación de incendios y selección segura del agente extintor. Incluye prácticas supervisadas según las instalaciones y los equipos disponibles.",duration:"8 horas",modality:"Presencial",price:1500,date:"",location:"Centro de capacitación",requirements:"Ropa de trabajo y equipo de protección definido por el instructor.",featured:true,image:""},
  {id:"course-2",title:"Uso y manejo de extintores",category:"Prevención",description:"Reconocimiento de tipos de extintores, inspección visual, selección conforme al riesgo y prácticas de operación únicamente en condiciones controladas y supervisadas.",duration:"4 horas",modality:"Presencial",price:850,date:"",location:"Instalaciones del cliente",requirements:"Seguir las indicaciones del instructor y utilizar el equipo de protección requerido.",featured:true,image:""},
  {id:"course-3",title:"Formación de brigadas de emergencia",category:"Brigadas",description:"Funciones de las brigadas, organización de la respuesta inicial, comunicación, evacuación, reconocimiento de riesgos y coordinación con los servicios de emergencia.",duration:"12 horas",modality:"Mixta",price:2200,date:"",location:"Por confirmar",requirements:"Aptitud para las actividades previstas y cumplimiento de las instrucciones de seguridad.",featured:true,image:""},
  {id:"course-4",title:"Prevención de incendios en el trabajo",category:"Prevención",description:"Identificación de fuentes de ignición, combustibles, prácticas preventivas, orden, limpieza y comunicación de condiciones peligrosas en el entorno laboral.",duration:"6 horas",modality:"En línea",price:1000,date:"",location:"Plataforma virtual",requirements:"Acceso a internet para la modalidad en línea.",featured:false,image:""},
  {id:"course-5",title:"Evacuación y respuesta a emergencias",category:"Emergencias",description:"Organización de la evacuación, reconocimiento de rutas, puntos de reunión, comunicación de emergencias y coordinación con los responsables del inmueble.",duration:"6 horas",modality:"Presencial",price:1200,date:"",location:"Por confirmar",requirements:"Calzado y ropa apropiados para el ejercicio programado.",featured:false,image:""},
  {id:"course-6",title:"Combate contra incendios: nivel intermedio",category:"Combate contra incendios",description:"Formación para participantes con preparación previa. Incluye evaluación de riesgos, límites de actuación, coordinación de equipos y ejercicios prácticos autorizados.",duration:"16 horas",modality:"Presencial",price:3500,date:"",location:"Campo de prácticas autorizado",requirements:"Experiencia previa cuando corresponda, evaluación del instructor y equipo de protección específico.",featured:false,image:""}
];

function loadCourses(){
  try{
    const saved=localStorage.getItem(STORAGE_KEY);
    if(saved===null)return structuredClone(sampleCourses);
    const parsed=JSON.parse(saved);
    if(!Array.isArray(parsed))throw new Error("Formato inválido");
    return parsed.filter(c=>c&&typeof c.id==="string"&&typeof c.title==="string"&&typeof c.description==="string");
  }catch(error){console.error("No se pudieron cargar los cursos:",error);return structuredClone(sampleCourses);}
}
let courses=loadCourses();

function saveCourses(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(courses));return true;}
  catch(error){console.error(error);showToast("No se pudo guardar. Reduce el tamaño de las imágenes.");return false;}
}
function escapeHTML(value=""){
  return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function formatPrice(price){
  if(price===""||price===null||price===undefined)return "Consultar";
  const n=Number(price);if(!Number.isFinite(n)||n<0)return "Consultar";
  return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:2}).format(n);
}
function formatDate(date){
  if(!date)return "Fecha por confirmar";
  const p=date.split("-").map(Number);
  if(p.length!==3||p.some(n=>!Number.isFinite(n)))return "Fecha por confirmar";
  return new Intl.DateTimeFormat("es-MX",{dateStyle:"medium",timeZone:"UTC"}).format(new Date(Date.UTC(p[0],p[1]-1,p[2])));
}
function showToast(message){
  const toast=$("#toast");toast.textContent=message;toast.classList.add("show");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),3000);
}
function renderCourses(){
  const query=$("#searchInput").value.trim().toLowerCase();
  const category=$("#categoryFilter").value;
  const filtered=courses.filter(c=>[c.title,c.category,c.description,c.location].join(" ").toLowerCase().includes(query)&&(!category||c.category===category));
  $("#courseCount").textContent=`${filtered.length} ${filtered.length===1?"curso":"cursos"}`;
  $("#emptyMessage").classList.toggle("hidden",filtered.length>0);
  $("#courseGrid").innerHTML=filtered.map(c=>{
    const image=c.image?`<img src="${escapeHTML(c.image)}" alt="${escapeHTML(c.title)}" loading="lazy">`:`<span class="course-placeholder" aria-hidden="true">🔥</span>`;
    const priceMissing=c.price===""||c.price===null||c.price===undefined;
    return `<article class="course-card"><div class="course-image">${image}</div><div class="course-body"><span class="category">${escapeHTML(c.category)}</span><h3>${escapeHTML(c.title)}</h3><p>${escapeHTML(c.description)}</p><div class="course-meta"><span>◷ ${escapeHTML(c.duration||"Por definir")}</span><span>▣ ${escapeHTML(c.modality||"Por definir")}</span></div><div class="course-bottom"><div class="price">${escapeHTML(formatPrice(c.price))}<small>${priceMissing?"Precio por consultar":"MXN"}</small></div><button class="btn btn-outline detail-btn" data-id="${escapeHTML(c.id)}">Ver detalles ↗</button></div></div></article>`;
  }).join("");
}
function renderAdminList(){
  const container=$("#adminCourseList");
  if(!courses.length){container.innerHTML='<p class="empty">Todavía no hay cursos registrados.</p>';return;}
  container.innerHTML=courses.map(c=>`<div class="admin-item"><div><h3>${escapeHTML(c.title)}</h3><p>${escapeHTML(c.category)} · ${escapeHTML(formatPrice(c.price))}</p></div><div class="admin-actions"><button class="small-btn edit-btn" data-id="${escapeHTML(c.id)}">Editar</button><button class="small-btn delete-btn" data-id="${escapeHTML(c.id)}">Eliminar</button></div></div>`).join("");
}
function openAdmin(){renderAdminList();$("#adminDialog").showModal();}
function resetForm(){
  $("#courseForm").reset();$("#courseId").value="";selectedImage="";$("#imagePreview").innerHTML="";$("#formTitle").textContent="Nuevo curso";
}
function openNewCourse(){resetForm();$("#formTitle").textContent="Nuevo curso";$("#formDialog").showModal();}
function openEditCourse(id){
  const c=courses.find(item=>item.id===id);if(!c)return;
  resetForm();
  $("#courseId").value=c.id;$("#title").value=c.title||"";$("#category").value=c.category||"Prevención";
  $("#description").value=c.description||"";$("#duration").value=c.duration||"";$("#modality").value=c.modality||"Presencial";
  $("#price").value=c.price??"";$("#date").value=c.date||"";$("#location").value=c.location||"";
  $("#requirements").value=c.requirements||"";$("#featured").checked=Boolean(c.featured);
  selectedImage=c.image||"";showImagePreview(selectedImage);$("#formTitle").textContent="Editar curso";
  $("#adminDialog").close();$("#formDialog").showModal();
}
function showImagePreview(image){
  $("#imagePreview").innerHTML=image?`<img src="${escapeHTML(image)}" alt="Vista previa de la imagen">`:"";
}
$("#imageFile").addEventListener("change",event=>{
  const file=event.target.files[0];if(!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){showToast("Selecciona una imagen JPG, PNG o WebP.");event.target.value="";return;}
  if(file.size>MAX_IMAGE_SIZE){showToast("La imagen supera el límite de 1.5 MB.");event.target.value="";return;}
  const reader=new FileReader();
  reader.onload=()=>{selectedImage=reader.result;showImagePreview(selectedImage);};
  reader.onerror=()=>showToast("No se pudo leer la imagen.");
  reader.readAsDataURL(file);
});
$("#courseForm").addEventListener("submit",event=>{
  event.preventDefault();
  const id=$("#courseId").value||(crypto.randomUUID?crypto.randomUUID():`course-${Date.now()}`);
  const rawPrice=$("#price").value.trim(),price=rawPrice===""?"":Number(rawPrice);
  if(rawPrice!==""&&(!Number.isFinite(price)||price<0)){showToast("Introduce un precio válido.");return;}
  const existing=courses.find(c=>c.id===id);
  const course={id,title:$("#title").value.trim(),category:$("#category").value,description:$("#description").value.trim(),duration:$("#duration").value.trim(),modality:$("#modality").value,price,date:$("#date").value,location:$("#location").value.trim(),requirements:$("#requirements").value.trim(),featured:$("#featured").checked,image:selectedImage};
  if(!course.title||!course.description){showToast("Completa el nombre y la descripción.");return;}
  const previous=courses;courses=existing?courses.map(c=>c.id===id?course:c):[...courses,course];
  if(!saveCourses()){courses=previous;return;}
  $("#formDialog").close();renderCourses();renderAdminList();showToast(existing?"Curso actualizado.":"Curso agregado.");
});
function deleteCourse(id){
  const course=courses.find(c=>c.id===id);if(!course)return;
  if(!confirm(`¿Eliminar el curso "${course.title}"?`))return;
  const previous=courses;courses=courses.filter(c=>c.id!==id);
  if(!saveCourses()){courses=previous;return;}
  renderCourses();renderAdminList();showToast("Curso eliminado.");
}
function openCourseDetails(id){
  const c=courses.find(item=>item.id===id);if(!c)return;
  $("#detailTitle").textContent=c.title;
  $("#detailContent").innerHTML=`${c.image?`<img class="detail-image" src="${escapeHTML(c.image)}" alt="${escapeHTML(c.title)}">`:""}<p><span class="category">${escapeHTML(c.category)}</span></p><p class="detail-description">${escapeHTML(c.description)}</p><div class="course-meta"><span>Duración: ${escapeHTML(c.duration||"Por definir")}</span><span>Modalidad: ${escapeHTML(c.modality||"Por definir")}</span></div><p><strong>Precio:</strong> ${escapeHTML(formatPrice(c.price))}</p><p><strong>Fecha:</strong> ${escapeHTML(formatDate(c.date))}</p><p><strong>Sede:</strong> ${escapeHTML(c.location||"Por confirmar")}</p>${c.requirements?`<p><strong>Requisitos:</strong> ${escapeHTML(c.requirements)}</p>`:""}<p class="notice">Consulta previamente los requisitos, la disponibilidad y las condiciones de seguridad antes de inscribirte.</p>`;
  $("#detailDialog").showModal();
}
$("#adminBtn").addEventListener("click",openAdmin);
$("#closeAdmin").addEventListener("click",()=>$("#adminDialog").close());
$("#newCourseBtn").addEventListener("click",openNewCourse);
$("#closeForm").addEventListener("click",()=>$("#formDialog").close());
$("#cancelForm").addEventListener("click",()=>$("#formDialog").close());
$("#closeDetail").addEventListener("click",()=>$("#detailDialog").close());
$("#searchInput").addEventListener("input",renderCourses);
$("#categoryFilter").addEventListener("change",renderCourses);
$("#courseGrid").addEventListener("click",event=>{const button=event.target.closest(".detail-btn");if(button)openCourseDetails(button.dataset.id);});
$("#adminCourseList").addEventListener("click",event=>{
  const edit=event.target.closest(".edit-btn"),del=event.target.closest(".delete-btn");
  if(edit)openEditCourse(edit.dataset.id);if(del)deleteCourse(del.dataset.id);
});
$("#exportBtn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(courses,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download="fireacademy-cursos.json";link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);showToast("Respaldo preparado.");
});
$("#importBtn").addEventListener("click",()=>$("#importFile").click());
$("#importFile").addEventListener("change",async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    if(file.size>8*1024*1024)throw new Error("El archivo supera el límite de 8 MB.");
    const parsed=JSON.parse(await file.text());
    if(!Array.isArray(parsed))throw new Error("El archivo debe contener una lista de cursos.");
    const valid=parsed.every(c=>c&&typeof c.id==="string"&&typeof c.title==="string"&&typeof c.description==="string"&&typeof c.category==="string"&&typeof (c.image||"")==="string"&&(c.image||"").length<2_100_000);
    if(!valid)throw new Error("El archivo contiene datos inválidos.");
    if(!confirm(`¿Importar ${parsed.length} cursos y reemplazar el catálogo actual?`))return;
    const previous=courses;courses=parsed;
    if(!saveCourses()){courses=previous;return;}
    renderCourses();renderAdminList();showToast("Cursos importados correctamente.");
  }catch(error){showToast(error.message||"No se pudo importar el archivo.");}
  finally{event.target.value="";}
});
$("#contactBtn").addEventListener("click",event=>{
  event.preventDefault();$("#cursos").scrollIntoView({behavior:"smooth"});$("#searchInput").focus({preventScroll:true});
});
$("#year").textContent=new Date().getFullYear();
renderCourses();
