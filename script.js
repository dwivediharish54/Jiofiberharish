const STORAGE_KEY = 'jioBookings';
const bookingForm = document.getElementById('bookingForm');
const confirmationMessage = document.getElementById('confirmationMessage');
const contactActions = document.getElementById('contactActions');

function getBookings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveBooking(booking) {
  const bookings = getBookings();
  bookings.push(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function renderDashboard() {
  const bookingList = document.getElementById('bookingList');
  const emptyState = document.getElementById('emptyState');
  const totalCount = document.getElementById('totalCount');
  const pendingCount = document.getElementById('pendingCount');
  const completedCount = document.getElementById('completedCount');
  const clearAllButton = document.getElementById('clearAllButton');

  if (!bookingList || !totalCount) return;

  const bookings = getBookings();
  const pending = bookings.filter((item) => item.status === 'Pending').length;
  const completed = bookings.filter((item) => item.status === 'Completed').length;

  totalCount.textContent = bookings.length;
  pendingCount.textContent = pending;
  completedCount.textContent = completed;

  bookingList.innerHTML = '';

  if (bookings.length === 0) {
    emptyState.classList.remove('hidden');
    clearAllButton.disabled = true;
    return;
  }

  emptyState.classList.add('hidden');
  clearAllButton.disabled = false;

  bookings.forEach((booking, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${booking.customerName}</td>
      <td>${booking.customerPhone}</td>
      <td>${booking.customerEmail}</td>
      <td>${booking.serviceType}</td>
      <td>${booking.preferredDate}</td>
      <td>${booking.preferredTime}</td>
      <td>${booking.address || '-'}</td>
<td>${new Date(booking.createdAt).toLocaleString()}</td>
      <td><span class="status-pill ${booking.status === 'Completed' ? 'status-completed' : 'status-pending'}">${booking.status}</span></td>
      <td>
        <button class="action-button action-complete" data-index="${index}">${booking.status === 'Completed' ? 'Reopen' : 'Complete'}</button>
        <button class="action-button action-delete" data-index="${index}">Delete</button>
      </td>
    `;
    bookingList.appendChild(row);
  });
}

function updateBookingStatus(index) {
  const bookings = getBookings();
  if (!bookings[index]) return;
  bookings[index].status = bookings[index].status === 'Completed' ? 'Pending' : 'Completed';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  renderDashboard();
}

function deleteBooking(index) {
  const bookings = getBookings();
  bookings.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  renderDashboard();
}

function clearAllBookings() {
  if (!confirm('Clear all booking requests from the dashboard?')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderDashboard();
}

if (bookingForm) {
  bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(bookingForm);
    const values = Object.fromEntries(formData.entries());

    const rawBody = `New Jio WiFi booking request from ${values.customerName}\nPhone: ${values.customerPhone}\nEmail: ${values.customerEmail}\nService: ${values.serviceType}\nPreferred Date: ${values.preferredDate}\nPreferred Time: ${values.preferredTime}\nMessage: ${values.message}`;
    const encodedBody = encodeURIComponent(rawBody);
    const mailtoLink = `mailto:dwivediharish78@gmail.com?subject=${encodeURIComponent('New Jio WiFi Booking Request')}&body=${encodedBody}`;
    const whatsappLink = `https://wa.me/919479913226?text=${encodedBody}`;

    const booking = {
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerEmail: values.customerEmail,
      serviceType: values.serviceType,
      preferredDate: values.preferredDate,
      preferredTime: values.preferredTime,
      message: values.message,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });

    if (response.ok) {
      confirmationMessage.textContent = `Thank you, ${values.customerName}! Your booking request has been saved successfully.`;
      confirmationMessage.classList.remove('hidden');
      confirmationMessage.classList.add('visible');

      contactActions.innerHTML = `
        <a class="button button-secondary" href="${mailtoLink}" target="_blank" rel="noopener noreferrer">Send Email</a>
        <a class="button button-primary" href="${whatsappLink}" target="_blank" rel="noopener noreferrer">Send WhatsApp</a>
      `;
      contactActions.classList.remove('hidden');
      bookingForm.reset();
    } else {
      confirmationMessage.textContent = `There was an error saving your booking. Please try again.`;
      confirmationMessage.classList.remove('hidden');
      confirmationMessage.classList.add('visible');
    }
  });
}

if (document.getElementById('bookingList')) {
  document.getElementById('bookingList').addEventListener('click', (event) => {
    const target = event.target;
    if (target.matches('.action-complete')) {
      updateBookingStatus(Number(target.dataset.index));
    }
    if (target.matches('.action-delete')) {
      deleteBooking(Number(target.dataset.index));
    }
  });

  const clearAllButton = document.getElementById('clearAllButton');
  if (clearAllButton) {
    clearAllButton.addEventListener('click', clearAllBookings);
  }

  renderDashboard();
}
