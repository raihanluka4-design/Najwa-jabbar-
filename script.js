/* ==========================================================
   HallBook — Online Hall Booking System (client-only demo)
   Data persists in this browser via localStorage.
   ========================================================== */

const DB_KEY = 'hallbook_db_v1';
const SLOTS = ['09:00-10:00','10:00-11:00','11:00-12:00','13:00-14:00','14:00-15:00','15:00-16:00','16:00-17:00'];

/* ---------------- storage helpers ---------------- */
function loadDB(){
  let raw = localStorage.getItem(DB_KEY);
  if(!raw){
    const db = seedDB();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }
  try{ return JSON.parse(raw); }catch(e){ const db = seedDB(); localStorage.setItem(DB_KEY, JSON.stringify(db)); return db; }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function uid(prefix){ return prefix + '_' + Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4); }

function seedDB(){
  return {
    users: [
      { id:'u_admin', name:'System Admin', email:'admin@hallbook.app', phone:'', password:'admin123', role:'admin' }
    ],
    halls: [
      { id:'h1', name:'Auditorium A', capacity:300, location:'Main Block, Ground Floor', facilities:['Projector','Sound System','Stage','AC'] },
      { id:'h2', name:'Seminar Hall 2', capacity:80, location:'AI&ML Block, 1st Floor', facilities:['Projector','Mic','AC'] },
      { id:'h3', name:'Conference Room C', capacity:25, location:'Admin Block, 2nd Floor', facilities:['Whiteboard','Video Call Setup'] }
    ],
    bookings: [],
    session: null
  };
}

let db = loadDB();

/* ---------------- toast ---------------- */
let toastTimer;
function toast(msg, isErr){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.toggle('err', !!isErr);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), 2600);
}

/* ---------------- auth ---------------- */
function currentUser(){
  if(!db.session) return null;
  return db.users.find(u => u.id === db.session) || null;
}
function showAuthError(msg){
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideAuthError(){
  document.getElementById('auth-error').classList.add('hidden');
}

document.getElementById('show-register').addEventListener('click', e=>{
  e.preventDefault();
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.remove('hidden');
  document.getElementById('toggle-to-register').classList.add('hidden');
  document.getElementById('toggle-to-login').classList.remove('hidden');
  document.getElementById('auth-sub').textContent = 'Create an account to start booking';
  hideAuthError();
});
document.getElementById('show-login').addEventListener('click', e=>{
  e.preventDefault();
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('toggle-to-login').classList.add('hidden');
  document.getElementById('toggle-to-register').classList.remove('hidden');
  document.getElementById('auth-sub').textContent = 'Sign in to book a hall';
  hideAuthError();
});

document.getElementById('login-form').addEventListener('submit', e=>{
  e.preventDefault();
  hideAuthError();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const user = db.users.find(u => u.email.toLowerCase() === email && u.password === password);
  if(!user){ showAuthError('No account matches that email and password.'); return; }
  db.session = user.id;
  saveDB(db);
  enterApp();
});

document.getElementById('register-form').addEventListener('submit', e=>{
  e.preventDefault();
  hideAuthError();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  if(db.users.some(u => u.email.toLowerCase() === email)){
    showAuthError('An account with that email already exists.');
    return;
  }
  const user = { id: uid('u'), name, email, phone, password, role:'user' };
  db.users.push(user);
  db.session = user.id;
  saveDB(db);
  enterApp();
});

document.getElementById('logout-btn').addEventListener('click', ()=>{
  db.session = null;
  saveDB(db);
  location.reload();
});

/* ---------------- view routing ---------------- */
const VIEW_META = {
  browse: { title:'Browse Halls', sub:'Find a hall and check live availability.' },
  mybookings: { title:'My Bookings', sub:'View, update, or cancel your reservations.' },
  'admin-halls': { title:'Manage Halls', sub:'Add, edit, or remove halls available for booking.' },
  'admin-bookings': { title:'All Bookings', sub:'Every reservation made across the system.' },
  'admin-reports': { title:'Reports', sub:'Booking activity at a glance.' }
};

function setView(view){
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById('view-' + view).classList.remove('hidden');
  document.getElementById('view-title').textContent = VIEW_META[view].title;
  document.getElementById('view-sub').textContent = VIEW_META[view].sub;
  if(view === 'browse') renderHalls();
  if(view === 'mybookings') renderMyBookings();
  if(view === 'admin-halls') renderAdminHalls();
  if(view === 'admin-bookings') renderAdminBookings();
  if(view === 'admin-reports') renderReports();
}
document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click', ()=> setView(item.dataset.view));
});

/* ---------------- entering the app ---------------- */
function enterApp(){
  const user = currentUser();
  if(!user){ return; }
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  document.getElementById('who-name').textContent = user.name;
  document.getElementById('who-role').textContent = user.role === 'admin' ? 'Administrator' : 'User';
  const isAdmin = user.role === 'admin';
  document.getElementById('nav-admin-halls').classList.toggle('hidden', !isAdmin);
  document.getElementById('nav-admin-bookings').classList.toggle('hidden', !isAdmin);
  document.getElementById('nav-admin-reports').classList.toggle('hidden', !isAdmin);
  setView('browse');
}

/* ---------------- helpers ---------------- */
function hallById(id){ return db.halls.find(h => h.id === id); }
function userById(id){ return db.users.find(u => u.id === id); }
function fmtDate(d){
  if(!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString(undefined, { weekday:'short', year:'numeric', month:'short', day:'numeric' });
}
function todayStr(){
  const d = new Date();
  return d.toISOString().slice(0,10);
}
function bookingsFor(hallId, date){
  return db.bookings.filter(b => b.hallId === hallId && b.date === date && b.status !== 'cancelled');
}

/* ---------------- BROWSE HALLS ---------------- */
function renderHalls(){
  const grid = document.getElementById('hall-grid');
  grid.innerHTML = '';
  db.halls.forEach(h=>{
    const card = document.createElement('div');
    card.className = 'hall-card';
    card.innerHTML = `
      <h3>${escapeHTML(h.name)}</h3>
      <div class="hall-meta">Capacity ${h.capacity} · ${escapeHTML(h.location)}</div>
      <div class="hall-facilities">${h.facilities.map(f=>`<span class="chip">${escapeHTML(f)}</span>`).join('')}</div>
      <button class="btn btn-primary" data-hall="${h.id}">Check availability &amp; book</button>
    `;
    card.querySelector('button').addEventListener('click', ()=> openBookingModal(h.id));
    grid.appendChild(card);
  });
}

/* ---------------- BOOKING MODAL ---------------- */
let editingBookingId = null;

function openBookingModal(hallId, existingBooking){
  editingBookingId = existingBooking ? existingBooking.id : null;
  const hall = hallById(hallId);
  document.getElementById('booking-hall-id').value = hallId;
  document.getElementById('booking-edit-id').value = editingBookingId || '';
  document.getElementById('booking-modal-title').textContent = (editingBookingId ? 'Update booking — ' : 'Book — ') + hall.name;
  const dateInput = document.getElementById('booking-date');
  dateInput.min = todayStr();
  dateInput.value = existingBooking ? existingBooking.date : todayStr();
  document.getElementById('booking-purpose').value = existingBooking ? (existingBooking.purpose || '') : '';
  renderSlotGrid(hallId, dateInput.value, existingBooking ? existingBooking.slot : null);
  dateInput.onchange = ()=> renderSlotGrid(hallId, dateInput.value, null);
  document.getElementById('booking-modal').classList.remove('hidden');
}

let selectedSlot = null;
function renderSlotGrid(hallId, date, preselect){
  selectedSlot = preselect || null;
  const taken = bookingsFor(hallId, date)
    .filter(b => b.id !== editingBookingId)
    .map(b => b.slot);
  const grid = document.getElementById('booking-slot-grid');
  grid.innerHTML = '';
  SLOTS.forEach(slot=>{
    const isTaken = taken.includes(slot);
    const el = document.createElement('div');
    el.className = 'slot-opt' + (isTaken ? ' taken' : '') + (slot === selectedSlot ? ' selected' : '');
    el.textContent = slot;
    if(!isTaken){
      el.addEventListener('click', ()=>{
        selectedSlot = slot;
        grid.querySelectorAll('.slot-opt').forEach(s=> s.classList.remove('selected'));
        el.classList.add('selected');
      });
    }
    grid.appendChild(el);
  });
}

document.getElementById('booking-cancel').addEventListener('click', closeBookingModal);
function closeBookingModal(){
  document.getElementById('booking-modal').classList.add('hidden');
  editingBookingId = null;
  selectedSlot = null;
}

document.getElementById('booking-confirm').addEventListener('click', ()=>{
  const hallId = document.getElementById('booking-hall-id').value;
  const date = document.getElementById('booking-date').value;
  const purpose = document.getElementById('booking-purpose').value.trim();
  if(!date){ toast('Please choose a date.', true); return; }
  if(!selectedSlot){ toast('Please choose a time slot.', true); return; }

  const conflict = bookingsFor(hallId, date).some(b => b.slot === selectedSlot && b.id !== editingBookingId);
  if(conflict){ toast('That slot was just taken — pick another.', true); renderSlotGrid(hallId, date, null); return; }

  const user = currentUser();
  if(editingBookingId){
    const b = db.bookings.find(x => x.id === editingBookingId);
    b.date = date; b.slot = selectedSlot; b.purpose = purpose; b.status = 'confirmed';
    toast('Booking updated.');
  } else {
    db.bookings.push({
      id: uid('b'), userId: user.id, hallId, date, slot: selectedSlot,
      purpose, status:'confirmed', createdAt: Date.now()
    });
    toast('Hall booked successfully.');
  }
  saveDB(db);
  closeBookingModal();
  renderMyBookings();
  renderAdminBookings();
  renderReports();
});

/* ---------------- MY BOOKINGS ---------------- */
function renderMyBookings(){
  const user = currentUser();
  const rows = db.bookings.filter(b => b.userId === user.id)
    .sort((a,b)=> (a.date+a.slot).localeCompare(b.date+b.slot));
  const body = document.getElementById('mybookings-body');
  body.innerHTML = '';
  document.getElementById('mybookings-empty').classList.toggle('hidden', rows.length > 0);
  rows.forEach(b=>{
    const hall = hallById(b.hallId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHTML(hall ? hall.name : 'Deleted hall')}</td>
      <td>${fmtDate(b.date)}</td>
      <td>${b.slot}</td>
      <td>${escapeHTML(b.purpose || '—')}</td>
      <td><span class="status ${b.status}">${b.status}</span></td>
      <td><div class="row-actions"></div></td>
    `;
    const actions = tr.querySelector('.row-actions');
    if(b.status === 'confirmed'){
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-outline btn-sm';
      editBtn.textContent = 'Update';
      editBtn.addEventListener('click', ()=> openBookingModal(b.hallId, b));
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn btn-danger btn-sm';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', ()=> cancelBooking(b.id));
      actions.appendChild(editBtn);
      actions.appendChild(cancelBtn);
    }
    body.appendChild(tr);
  });
}

function cancelBooking(id){
  const b = db.bookings.find(x => x.id === id);
  if(!b) return;
  b.status = 'cancelled';
  saveDB(db);
  toast('Booking cancelled.');
  renderMyBookings();
  renderAdminBookings();
  renderReports();
}

/* ---------------- ADMIN: HALLS ---------------- */
const hallForm = document.getElementById('hall-form');
hallForm.addEventListener('submit', e=>{
  e.preventDefault();
  const editId = document.getElementById('hall-edit-id').value;
  const name = document.getElementById('hall-name').value.trim();
  const capacity = parseInt(document.getElementById('hall-capacity').value, 10);
  const location = document.getElementById('hall-location').value.trim();
  const facilities = document.getElementById('hall-facilities').value.split(',').map(s=>s.trim()).filter(Boolean);

  if(editId){
    const h = hallById(editId);
    h.name = name; h.capacity = capacity; h.location = location; h.facilities = facilities;
    toast('Hall updated.');
  } else {
    db.halls.push({ id: uid('h'), name, capacity, location, facilities });
    toast('Hall added.');
  }
  saveDB(db);
  resetHallForm();
  renderAdminHalls();
  renderHalls();
});
document.getElementById('hall-cancel-edit').addEventListener('click', resetHallForm);
function resetHallForm(){
  hallForm.reset();
  document.getElementById('hall-edit-id').value = '';
  document.getElementById('hall-form-title').textContent = 'Add a hall';
  document.getElementById('hall-cancel-edit').classList.add('hidden');
}

function renderAdminHalls(){
  const body = document.getElementById('admin-halls-body');
  body.innerHTML = '';
  db.halls.forEach(h=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHTML(h.name)}</td>
      <td>${h.capacity}</td>
      <td>${escapeHTML(h.location)}</td>
      <td>${h.facilities.map(escapeHTML).join(', ') || '—'}</td>
      <td><div class="row-actions"></div></td>
    `;
    const actions = tr.querySelector('.row-actions');
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-outline btn-sm';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', ()=>{
      document.getElementById('hall-edit-id').value = h.id;
      document.getElementById('hall-name').value = h.name;
      document.getElementById('hall-capacity').value = h.capacity;
      document.getElementById('hall-location').value = h.location;
      document.getElementById('hall-facilities').value = h.facilities.join(', ');
      document.getElementById('hall-form-title').textContent = 'Edit hall — ' + h.name;
      document.getElementById('hall-cancel-edit').classList.remove('hidden');
      window.scrollTo({top:0, behavior:'smooth'});
    });
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger btn-sm';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', ()=>{
      if(!confirm('Delete "' + h.name + '"? Existing bookings for this hall will remain on record.')) return;
      db.halls = db.halls.filter(x => x.id !== h.id);
      saveDB(db);
      renderAdminHalls();
      renderHalls();
      toast('Hall deleted.');
    });
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    body.appendChild(tr);
  });
}

/* ---------------- ADMIN: ALL BOOKINGS ---------------- */
function renderAdminBookings(){
  const rows = [...db.bookings].sort((a,b)=> b.createdAt - a.createdAt);
  const body = document.getElementById('admin-bookings-body');
  body.innerHTML = '';
  document.getElementById('admin-bookings-empty').classList.toggle('hidden', rows.length > 0);
  rows.forEach(b=>{
    const hall = hallById(b.hallId);
    const user = userById(b.userId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHTML(user ? user.name : 'Deleted user')}</td>
      <td>${escapeHTML(hall ? hall.name : 'Deleted hall')}</td>
      <td>${fmtDate(b.date)}</td>
      <td>${b.slot}</td>
      <td><span class="status ${b.status}">${b.status}</span></td>
      <td><div class="row-actions"></div></td>
    `;
    if(b.status === 'confirmed'){
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn btn-danger btn-sm';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', ()=> cancelBooking(b.id));
      tr.querySelector('.row-actions').appendChild(cancelBtn);
    }
    body.appendChild(tr);
  });
}

/* ---------------- ADMIN: REPORTS ---------------- */
function renderReports(){
  const confirmed = db.bookings.filter(b=>b.status==='confirmed');
  const cancelled = db.bookings.filter(b=>b.status==='cancelled');
  const upcoming = confirmed.filter(b=> b.date >= todayStr());
  const stats = document.getElementById('report-stats');
  stats.innerHTML = `
    <div class="stat"><b>${db.halls.length}</b><span>Halls listed</span></div>
    <div class="stat"><b>${confirmed.length}</b><span>Active bookings</span></div>
    <div class="stat"><b>${upcoming.length}</b><span>Upcoming bookings</span></div>
    <div class="stat"><b>${cancelled.length}</b><span>Cancelled bookings</span></div>
    <div class="stat"><b>${db.users.filter(u=>u.role==='user').length}</b><span>Registered users</span></div>
  `;
  const body = document.getElementById('report-body');
  body.innerHTML = '';
  db.halls.forEach(h=>{
    const c = confirmed.filter(b=>b.hallId===h.id).length;
    const x = cancelled.filter(b=>b.hallId===h.id).length;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHTML(h.name)}</td><td>${c}</td><td>${x}</td>`;
    body.appendChild(tr);
  });
}

/* ---------------- utils ---------------- */
function escapeHTML(str){
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* ---------------- boot ---------------- */
(function boot(){
  if(currentUser()){
    enterApp();
  }
})();
